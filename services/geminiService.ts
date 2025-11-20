import { GoogleGenAI, Modality, Operation, GenerateVideosResponse, Type } from "@google/genai";
import { AspectRatio, FileData } from "../types";
import { supabase } from "./supabaseClient";
import { updateJobApiKey } from "./jobService";

// --- HELPER: Parse Error Object Robustly ---
// Fixes issue where Vercel/Production returns different error structures
// e.g. { error: { code: 400, message: "..." } } vs { status: 400, message: "..." }
const getErrorDetails = (error: any) => {
    let status = error.status || error.response?.status;
    let message = error.message || '';

    // Handle nested Google API error structure
    if (error.error) {
        if (error.error.code) status = error.error.code;
        if (error.error.message) message = error.error.message;
    }

    // Try parsing message if it's a JSON string (Common in Vercel logs)
    if (typeof message === 'string' && (message.startsWith('{') || message.startsWith('['))) {
        try {
            const parsed = JSON.parse(message);
            if (parsed.error) {
                if (parsed.error.code) status = parsed.error.code;
                if (parsed.error.message) message = parsed.error.message;
            }
        } catch (e) {
            // Not JSON, keep original message
        }
    }

    return { 
        status: Number(status), // Ensure it's a number
        message: String(message) 
    };
};

// --- HELPER: Report Bad Key to Supabase ---
const markKeyAsExhausted = async (key: string) => {
    try {
        // Only mark if it's NOT the env key
        if (key && key !== process.env.API_KEY) {
            console.warn(`Marking key ending in ...${key.slice(-4)} as exhausted.`);
            await supabase.rpc('mark_key_exhausted', { key_val: key });
        }
    } catch (e) {
        console.error("Failed to mark key as exhausted:", e);
    }
};

// --- HELPER: Get Client ---
const getAIClient = async (jobId?: string, forceEnvKey: boolean = false): Promise<{ ai: GoogleGenAI, key: string, isEnvKey: boolean }> => {
    try {
        // 1. Forced Env Key or Supabase not ready
        if (forceEnvKey || !supabase) {
            if (process.env.API_KEY) {
                const key = process.env.API_KEY;
                if (jobId) await updateJobApiKey(jobId, "FALLBACK_ENV_KEY");
                return { 
                    ai: new GoogleGenAI({ apiKey: key }),
                    key: key,
                    isEnvKey: true
                };
            }
            throw new Error("SYSTEM_BUSY"); 
        }

        // 2. Get Key from Supabase (RPC handles rotation)
        const { data: apiKey, error } = await supabase.rpc('get_worker_key');

        if (error || !apiKey) {
            // If DB fails or returns no key, fallback to Env Key if available
            if (process.env.API_KEY) {
                const key = process.env.API_KEY;
                if (jobId) await updateJobApiKey(jobId, "FALLBACK_ENV_KEY");
                return { 
                    ai: new GoogleGenAI({ apiKey: key }),
                    key: key,
                    isEnvKey: true
                };
            }
            throw new Error("SYSTEM_BUSY");
        }

        // 3. Log usage
        if (jobId) {
            await updateJobApiKey(jobId, apiKey);
        }

        return { 
            ai: new GoogleGenAI({ apiKey: apiKey }),
            key: apiKey,
            isEnvKey: false
        };
    } catch (e: any) {
        if (e.message === "SYSTEM_BUSY") throw e;
        
        // Final safety net
        if (process.env.API_KEY) {
             return { 
                 ai: new GoogleGenAI({ apiKey: process.env.API_KEY }), 
                 key: process.env.API_KEY,
                 isEnvKey: true
             };
        }
        throw e;
    }
};

// --- SMART RETRY LOGIC (CORE ROTATION) ---
async function withSmartRetry<T>(
    operation: (ai: GoogleGenAI, currentKey: string) => Promise<T>, 
    jobId?: string,
    maxRetries: number = 15 // Try enough times to cycle through all DB keys + reset
): Promise<T> {
    let lastError: any;
    let attempts = 0;
    let forceEnv = false;
    const failedKeys = new Set<string>(); 

    while (attempts < maxRetries) {
        let currentKey = "";
        let isCurrentEnv = false;

        try {
            // 1. Fetch Client (This gets the NEXT available key from DB)
            const client = await getAIClient(jobId, forceEnv);
            currentKey = client.key;
            isCurrentEnv = client.isEnvKey;

            // Prevention: If DB gives back a key we just failed on in this loop, skip it
            if (failedKeys.has(currentKey) && !isCurrentEnv) {
                 // Ensure it's marked exhausted again just in case
                 await markKeyAsExhausted(currentKey); 
                 attempts++;
                 continue; 
            }

            // 2. Execute Operation
            return await operation(client.ai, currentKey);

        } catch (error: any) {
             const { status, message } = getErrorDetails(error);
             lastError = error;

             // Detect Limit/Quota Errors
             const isQuota = status === 429 || message.includes('quota') || message.includes('exhausted') || message.includes('429');
             const isBilling = status === 400 && (message.includes('billed users') || message.includes('billing') || message.includes('credits'));
             const isSystemBusy = message === "SYSTEM_BUSY";

             // Case A: DB Exhausted (No keys left)
             if (isSystemBusy) {
                 if (!forceEnv && process.env.API_KEY) {
                     console.warn("DB keys exhausted. Switching to Env Key.");
                     forceEnv = true;
                     continue;
                 }
                 break; // No keys left anywhere
             }

             // Case B: Key Hit Limit -> Mark & Rotate
             if (isQuota || isBilling) {
                 if (!isCurrentEnv && currentKey) {
                     console.warn(`Key ...${currentKey.slice(-4)} failed (${status}). Marking as exhausted & rotating.`);
                     
                     // A. Tell DB this key is dead
                     await markKeyAsExhausted(currentKey);
                     
                     // B. Track locally
                     failedKeys.add(currentKey);
                     
                     // C. Retry loop immediately -> getAIClient will fetch next key
                     attempts++;
                     continue; 
                 } 
             }
             
             // Case C: Server Error -> Wait & Retry
             if (status === 503 || status === 500) {
                 attempts++;
                 await new Promise(r => setTimeout(r, 1500));
                 continue;
             }

             // Case D: Fatal Error (Prompt issue, etc) -> Stop
             throw error; 
        }
    }

    throw lastError || new Error("Service unavailable after retries.");
}

// --- GENERATION FUNCTIONS ---

const generateImageFallback = async (prompt: string, numberOfImages: number, jobId?: string): Promise<string[]> => {
    console.warn(`Falling back to gemini-2.5-flash-image`);
    return withSmartRetry(async (ai) => {
        const parts = [{ text: prompt }];
        const promises = Array.from({ length: numberOfImages }).map(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE] },
            });
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            throw new Error("No image data in fallback response");
        });
        return Promise.all(promises);
    }, jobId);
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, numberOfImages: number = 1, jobId?: string): Promise<string[]> => {
    try {
        return await withSmartRetry(async (ai) => {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });
            if (!response.generatedImages) throw new Error("No images generated");
            return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        }, jobId);

    } catch (error: any) {
        const { status, message } = getErrorDetails(error);
        // Fallback check using parsed details
        if (status === 400 && (message.includes('billed users') || message.includes('billing'))) {
            return await generateImageFallback(prompt, numberOfImages, jobId);
        }
        throw error;
    }
};

export const generateVideo = async (prompt: string, startImage?: FileData, jobId?: string): Promise<string> => {
    return withSmartRetry(async (ai, key) => {
        let finalPrompt = prompt;
        let imagePayload = undefined;

        if (startImage) {
            finalPrompt = `Animate the provided image: "${prompt}"`;
            imagePayload = {
                imageBytes: startImage.base64,
                mimeType: startImage.mimeType,
            };
        }

        // @ts-ignore - Type definition mismatch workaround
        let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: finalPrompt,
            image: imagePayload as any, 
            config: { numberOfVideos: 1 }
        });
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed: No URI returned.");
        
        const videoResponse = await fetch(`${videoUri}&key=${key}`);
        if (!videoResponse.ok) throw new Error("Failed to download video.");
        
        const blob = await videoResponse.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }, jobId);
};

// --- EDIT / TEXT FUNCTIONS ---

const generateGeminiEdit = async (parts: any[], numberOfImages: number, jobId?: string): Promise<{imageUrl: string, text: string}[]> => {
    return withSmartRetry(async (ai) => {
        const promises = Array.from({ length: numberOfImages }).map(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            let imageUrl = '';
            const part = response.candidates?.[0]?.content?.parts?.[0];
            
            if (part?.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part?.text) {
                 console.warn("Model returned text:", part.text);
                 throw new Error("Model refused to generate image (Safety/Policy).");
            }
            
            if (!imageUrl) throw new Error("No image returned.");
            return { imageUrl, text: '' };
        });
        return Promise.all(promises);
    }, jobId);
};

export const editImage = async (prompt: string, image: FileData, numberOfImages: number = 1, jobId?: string) => {
    return generateGeminiEdit([
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithMask = async (prompt: string, image: FileData, mask: FileData, numberOfImages: number = 1, jobId?: string) => {
    return generateGeminiEdit([
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { inlineData: { data: mask.base64, mimeType: mask.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithReference = async (prompt: string, source: FileData, ref: FileData, numberOfImages: number = 1, jobId?: string) => {
    return generateGeminiEdit([
        { inlineData: { data: source.base64, mimeType: source.mimeType } },
        { inlineData: { data: ref.base64, mimeType: ref.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithMaskAndReference = async (prompt: string, source: FileData, mask: FileData, ref: FileData, numberOfImages: number = 1, jobId?: string) => {
    return generateGeminiEdit([
        { inlineData: { data: source.base64, mimeType: source.mimeType } },
        { inlineData: { data: mask.base64, mimeType: mask.mimeType } },
        { inlineData: { data: ref.base64, mimeType: ref.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithMultipleReferences = async (prompt: string, source: FileData, refs: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts: any[] = [{ inlineData: { data: source.base64, mimeType: source.mimeType } }];
    refs.forEach(r => parts.push({ inlineData: { data: r.base64, mimeType: r.mimeType } }));
    parts.push({ text: prompt });
    return generateGeminiEdit(parts, numberOfImages, jobId);
};

export const editImageWithMaskAndMultipleReferences = async (prompt: string, source: FileData, mask: FileData, refs: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts: any[] = [
        { inlineData: { data: source.base64, mimeType: source.mimeType } },
        { inlineData: { data: mask.base64, mimeType: mask.mimeType } }
    ];
    refs.forEach(r => parts.push({ inlineData: { data: r.base64, mimeType: r.mimeType } }));
    parts.push({ text: prompt });
    return generateGeminiEdit(parts, numberOfImages, jobId);
};

export const generateStagingImage = async (prompt: string, scene: FileData, objects: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts: any[] = [{ inlineData: { data: scene.base64, mimeType: scene.mimeType } }];
    objects.forEach(o => parts.push({ inlineData: { data: o.base64, mimeType: o.mimeType } }));
    parts.push({ text: prompt });
    return generateGeminiEdit(parts, numberOfImages, jobId);
};

export const generateText = async (prompt: string): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] }
        });
        return res.text || '';
    });
};

export const generatePromptFromImageAndText = async (image: FileData, prompt: string): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: `Analyze image. ${prompt}` }
                ]
            }
        });
        return res.text || '';
    });
};

export const enhancePrompt = async (prompt: string, image?: FileData): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const parts: any[] = [];
        if (image) parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
        parts.push({ text: `Enhance this prompt for architecture: ${prompt}` });
        
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        return res.text || '';
    });
};

export const generateMoodboardPromptFromScene = async (image: FileData): Promise<string> => {
    return generatePromptFromImageAndText(image, "Create a detailed moodboard prompt describing style, colors, and materials.");
};

export const generatePromptSuggestions = async (image: FileData, subject: string, count: number, instruction: string): Promise<Record<string, string[]>> => {
    return withSmartRetry(async (ai) => {
        const prompt = `Analyze this image. Provide ${count} prompts based on "${subject}". ${instruction}. Output strictly JSON.`;
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        try { return JSON.parse(res.text || '{}'); } catch { return {}; }
    });
};