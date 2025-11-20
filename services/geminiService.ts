import { GoogleGenAI, Modality, Operation, GenerateVideosResponse, Type } from "@google/genai";
import { AspectRatio, FileData } from "../types";
import { supabase } from "./supabaseClient";
import { updateJobApiKey } from "./jobService";

// --- HELPER: Parse Error Object Robustly ---
const getErrorDetails = (error: any) => {
    let status = error.status || error.response?.status;
    let message = error.message || '';

    if (error.error) {
        if (error.error.code) status = error.error.code;
        if (error.error.message) message = error.error.message;
    }
    
    if (error.body) {
        try {
             const body = JSON.parse(error.body);
             if (body.error) {
                 status = body.error.code || status;
                 message = body.error.message || message;
             }
        } catch (e) {}
    }

    if (typeof message === 'string') {
        if (message.startsWith('{') || message.startsWith('[')) {
            try {
                const parsed = JSON.parse(message);
                if (parsed.error) {
                    status = parsed.error.code || status;
                    message = parsed.error.message || message;
                }
            } catch (e) {}
        }
        
        if (!status) {
            if (message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('exhausted')) {
                status = 429;
            } else if (message.includes('400') || message.toLowerCase().includes('billing')) {
                status = 400;
            } else if (message.includes('503') || message.toLowerCase().includes('overloaded')) {
                status = 503;
            }
        }
    }

    return { 
        status: Number(status), 
        message: String(message) 
    };
};

// --- HELPER: Report Bad Key to Supabase ---
const markKeyAsExhausted = async (key: string) => {
    try {
        if (key) {
            console.warn(`[GeminiService] Marking key ...${key.slice(-4)} as exhausted.`);
            await supabase.rpc('mark_key_exhausted', { key_val: key });
        }
    } catch (e) {
        console.error("Failed to mark key as exhausted:", e);
    }
};

// --- HELPER: Get Client (STRICT SUPABASE ONLY) ---
const getAIClient = async (jobId?: string): Promise<{ ai: GoogleGenAI, key: string }> => {
    try {
        if (!supabase) {
            throw new Error("SYSTEM_BUSY"); 
        }

        const { data: apiKey, error } = await supabase.rpc('get_worker_key');

        if (error || !apiKey) {
            console.warn("[GeminiService] Supabase get_worker_key failed or empty:", error?.message);
            throw new Error("SYSTEM_BUSY");
        }

        if (jobId) {
            await updateJobApiKey(jobId, apiKey);
        }

        return { 
            ai: new GoogleGenAI({ apiKey: apiKey }),
            key: apiKey
        };
    } catch (e: any) {
        console.error("Critical error initializing AI client:", e.message);
        throw e;
    }
};

// --- SMART RETRY LOGIC (CORE ROTATION) ---
async function withSmartRetry<T>(
    operation: (ai: GoogleGenAI, currentKey: string) => Promise<T>, 
    jobId?: string,
    maxRetries: number = 15 
): Promise<T> {
    let lastError: any;
    let attempts = 0;
    const failedKeys = new Set<string>(); 
    let consecutiveQuotaErrors = 0; 

    while (attempts < maxRetries) {
        let currentKey = "";

        try {
            const client = await getAIClient(jobId);
            currentKey = client.key;

            // Prevention: If DB gives back a key we just failed on, skip it locally
            if (failedKeys.has(currentKey)) {
                 console.warn(`[GeminiService] DB returned previously failed key ...${currentKey.slice(-4)}. Skipping locally.`);
                 attempts++;
                 continue; 
            }

            const result = await operation(client.ai, currentKey);
            return result;

        } catch (error: any) {
             const { status, message } = getErrorDetails(error);
             lastError = error;
             
             console.warn(`[GeminiService] Attempt ${attempts + 1} failed. Status: ${status}. Key: ...${currentKey?.slice(-4)}`);

             const isQuota = status === 429 || message.includes('quota') || message.includes('exhausted') || message.includes('429');
             const isBilling = status === 400 && (message.includes('billed users') || message.includes('billing') || message.includes('credits'));
             const isSystemBusy = message === "SYSTEM_BUSY";

             if (isSystemBusy) {
                 console.warn("[GeminiService] No keys available in DB. Waiting before retry...");
                 await new Promise(r => setTimeout(r, 3000));
                 attempts++;
                 continue; 
             }

             // CASE 1: QUOTA ERROR (429) -> Rotate Key
             if (isQuota) {
                 consecutiveQuotaErrors++;

                 // Anti-cascade: If IP blocked (multiple 429s in a row), slow down significantly
                 if (consecutiveQuotaErrors >= 3) {
                     console.warn(`[GeminiService] Suspected IP block (${consecutiveQuotaErrors}). Pausing for 5s...`);
                     await new Promise(r => setTimeout(r, 5000));
                 }

                 if (currentKey) {
                     console.warn(`[GeminiService] Key ...${currentKey.slice(-4)} exhausted (429). Marking in DB.`);
                     await markKeyAsExhausted(currentKey);
                     failedKeys.add(currentKey);
                     
                     attempts++;
                     await new Promise(r => setTimeout(r, 1500)); 
                     continue; 
                 } 
             }
             
             // CASE 2: BILLING ERROR (400) -> THROW TO FALLBACK
             // IMPORTANT: Do NOT mark as exhausted. Do NOT rotate. 
             // Throwing here allows generateImage's catch block to pick this up and trigger Fallback mode.
             if (isBilling) {
                 console.warn(`[GeminiService] Key ...${currentKey?.slice(-4)} has billing restriction (400). Triggering Fallback.`);
                 throw error; 
             }
             
             // Reset quota counter if error is something else (like network glitch)
             consecutiveQuotaErrors = 0;

             // Case 3: Server Error -> Wait & Retry
             if (status === 503 || status === 500) {
                 attempts++;
                 await new Promise(r => setTimeout(r, 3000));
                 continue;
             }

             if (!status) {
                 attempts++;
                 await new Promise(r => setTimeout(r, 1000));
                 continue;
             }

             throw error; 
        }
    }

    throw lastError || new Error("Service unavailable after retries.");
}

// --- GENERATION FUNCTIONS ---

const generateImageFallback = async (prompt: string, numberOfImages: number, jobId?: string): Promise<string[]> => {
    console.warn(`[GeminiService] Triggering Fallback to Flash Model`);
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

        // @ts-ignore
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