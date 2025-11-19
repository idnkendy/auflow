
import { GoogleGenAI, GenerateContentResponse, Modality, Operation, GenerateVideosResponse, Type } from "@google/genai";
import { AspectRatio, FileData } from "../types";
import { supabase } from "./supabaseClient";
import { updateJobApiKey } from "./jobService";

// --- HELPER: Report Bad Key to Supabase ---
const markKeyAsExhausted = async (key: string) => {
    try {
        // Only mark if it's NOT the env key
        if (key !== process.env.API_KEY) {
            console.warn(`Marking key ending in ...${key.slice(-4)} as exhausted in DB.`);
            await supabase.rpc('mark_key_exhausted', { key_val: key });
        }
    } catch (e) {
        console.error("Failed to mark key as exhausted:", e);
    }
};

// Hàm lấy Dynamic API Key từ Supabase (Load Balancing)
const getAIClient = async (jobId?: string, forceEnvKey: boolean = false): Promise<{ ai: GoogleGenAI, key: string, isEnvKey: boolean }> => {
    try {
        // 1. Nếu bị ép dùng Key môi trường hoặc có lỗi kết nối DB trước đó
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

        // 2. Gọi Stored Procedure 'get_worker_key' từ Supabase
        const { data: apiKey, error } = await supabase.rpc('get_worker_key');

        if (error || !apiKey) {
            console.warn("Supabase key rotation error:", error);
            // Fallback: Nếu DB lỗi, dùng key môi trường
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

        // 3. Log key đã dùng
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
        console.error("Critical error initializing AI client:", e);
        // Final attempt with env key
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

// --- SMART RETRY LOGIC ---
// This wrapper handles the "Key 1 Fail -> Mark Exhausted -> Try Key 2" logic
async function withSmartRetry<T>(
    operation: (ai: GoogleGenAI, currentKey: string) => Promise<T>, 
    jobId?: string,
    maxRetries: number = 3 // Try up to 3 different keys from DB before falling back to Env
): Promise<T> {
    let lastError: any;
    let attempts = 0;
    let forceEnv = false;

    // Loop to try rotating DB keys
    while (attempts <= maxRetries) {
        try {
            const { ai, key, isEnvKey } = await getAIClient(jobId, forceEnv);
            
            // If we are forced to Env Key, just do it once and break if fail (handled by outer catch)
            if (forceEnv && isEnvKey) {
                 return await operation(ai, key);
            }

            try {
                return await operation(ai, key);
            } catch (apiError: any) {
                const status = apiError.status;
                const msg = apiError.message || '';

                // Detect "Dead Key" scenarios
                const isQuota = status === 429 || msg.includes('quota') || msg.includes('exhausted');
                const isBilling = status === 400 && (msg.includes('billed users') || msg.includes('billing') || msg.includes('credits'));
                
                // If it's a DB key and it failed with Quota/Billing -> Kill it and Retry
                if (!isEnvKey && (isQuota || isBilling)) {
                    console.warn(`Key ...${key.slice(-4)} failed (Status ${status}). Marking exhausted and rotating.`);
                    await markKeyAsExhausted(key); // Tell DB to skip this key next time
                    attempts++; 
                    continue; // Retry loop -> will fetch NEW key from DB
                }
                
                throw apiError; // Other errors (like Bad Request content) -> throw up
            }

        } catch (e: any) {
            lastError = e;
            if (e.message === "SYSTEM_BUSY") break; // DB is empty/down
            
            // Check if we should switch to Env key as last resort
            if (!forceEnv && attempts >= maxRetries && process.env.API_KEY) {
                console.warn("All DB keys exhausted/failed. Switching to Environment Key.");
                forceEnv = true;
                attempts = 0; // Reset attempts for Env key try
                maxRetries = 1; // Only try Env key once
            } else {
                throw e; // Fatal
            }
        }
    }

    throw lastError;
}


// Helper function for fallback image generation using Flash model
const generateImageFallback = async (prompt: string, numberOfImages: number, jobId?: string): Promise<string[]> => {
    console.warn(`Falling back to gemini-2.5-flash-image`);
    
    return withSmartRetry(async (ai) => {
        const generateSingle = async (): Promise<string> => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("No image data in fallback response");
        };
        const promises = Array.from({ length: numberOfImages }, () => generateSingle());
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
            return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        }, jobId);

    } catch (error: any) {
        // If specifically billing error on the main model (even after retries), fallback to Flash
        if (error.status === 400 || error.message?.includes('billed users')) {
            return await generateImageFallback(prompt, numberOfImages, jobId);
        }
        throw error;
    }
};

export const generateVideo = async (prompt: string, startImage?: FileData, jobId?: string): Promise<string> => {
    return withSmartRetry(async (ai, key) => {
        let finalPrompt = prompt;
        let imageForApi: FileData | undefined = startImage;

        if (startImage) {
            finalPrompt = `Animate the provided static image or create a video starting from it, based on the following prompt: "${prompt}"`;
        }

        let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: finalPrompt,
            ...(imageForApi && {
              image: {
                imageBytes: imageForApi.base64,
                mimeType: imageForApi.mimeType,
              },
            }),
            config: { numberOfVideos: 1 }
        });
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation completed, but no download link was found.");
        
        const videoResponse = await fetch(`${downloadLink}&key=${key}`);
        if (!videoResponse.ok) throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
        
        const videoBlob = await videoResponse.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(videoBlob);
        });
    }, jobId);
};

// Text Generation Wrappers
export const generateTextFromImage = async (prompt: string, image: FileData): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: prompt },
                ],
            },
        });
        return response.text || "";
    });
};

export const generateText = async (prompt: string): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        });
        return response.text || "";
    });
};

export const generatePromptSuggestions = async (image: FileData, subject: string, count: number, customInstruction?: string): Promise<Record<string, string[]>> => {
    return withSmartRetry(async (ai) => {
        let prompt = `Từ ảnh kiến trúc, tạo các prompt tiếng Việt sáng tạo để render ảnh mới.`;
        let responseSchema: any;

        const allSubjects: Record<string, string> = {
            'Góc toàn cảnh': 'mô tả quy mô, bối cảnh, phản chiếu, ánh sáng tự nhiên',
            'Góc trung cảnh': 'mô tả sự tương tác của con người với không gian',
            'Góc lấy nét': 'tập trung vào một đối tượng tiền cảnh như người, chim, hoa, lá—đối tượng chính chiếm tỉ lệ lớn, công trình bị mờ ở hậu cảnh, tạo sự tách biệt rõ ràng giữa tiền cảnh và hậu cảnh',
            'Chi tiết kiến trúc': 'tập trung vào một chi tiết kiến trúc nhỏ cụ thể'
        };

        const allProperties = {
            'Góc toàn cảnh': { type: Type.ARRAY, items: { type: Type.STRING } },
            'Góc trung cảnh': { type: Type.ARRAY, items: { type: Type.STRING } },
            'Góc lấy nét': { type: Type.ARRAY, items: { type: Type.STRING } },
            'Chi tiết kiến trúc': { type: Type.ARRAY, items: { type: Type.STRING } }
        };

        if (subject === 'all') {
            prompt += `\nCung cấp ${count} prompt cho mỗi danh mục: 'Góc toàn cảnh', 'Góc trung cảnh', 'Góc lấy nét', và 'Chi tiết kiến trúc'.`;
            responseSchema = { type: Type.OBJECT, properties: allProperties };
        } else if (allSubjects[subject]) {
            prompt += `\nTập trung vào chủ đề '${subject}'. Cung cấp ${count} prompt.`;
            responseSchema = { type: Type.OBJECT, properties: { [subject]: { type: Type.ARRAY, items: { type: Type.STRING } } } };
        } else {
             throw new Error("Chủ đề gợi ý không hợp lệ.");
        }

        if (customInstruction && customInstruction.trim()) {
            prompt += `\nLưu ý quan trọng: Luôn tích hợp yêu cầu sau vào mỗi prompt: "${customInstruction.trim()}".`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: prompt },
                ],
            },
            config: { responseMimeType: "application/json", responseSchema: responseSchema }
        });

        const jsonStr = response.text?.trim();
        if (!jsonStr) return {};
        return JSON.parse(jsonStr);
    });
};

export const enhancePrompt = async (customNeeds: string, image?: FileData): Promise<string> => {
    return withSmartRetry(async (ai) => {
        let prompt = `Bạn là một chuyên gia viết prompt cho AI tạo hình ảnh kiến trúc. Nhiệm vụ của bạn là nhận yêu cầu của người dùng (có thể là từ khóa, mô tả chi tiết, hoặc một hình ảnh) và biến chúng thành một prompt hoàn chỉnh, chuyên nghiệp bằng tiếng Việt.\n\nYêu cầu đầu vào:\n- Mô tả của người dùng: "${customNeeds}"\n${image ? '- Có một hình ảnh tham khảo được cung cấp.' : ''}\n\nNhiệm vụ:\n1. ${image ? 'Phân tích hình ảnh tham khảo để hiểu bối cảnh, phong cách kiến trúc, vật liệu và bố cục.' : ''}\n2. Dựa vào tất cả thông tin đầu vào, hãy tạo ra **DUY NHẤT MỘT** chuỗi prompt hoàn chỉnh và chi tiết.\n3. Cấu trúc prompt nên bao gồm các yếu tố sau (nếu có thể): loại công trình, phong cách thiết kế, góc nhìn camera, ánh sáng, thời tiết, vật liệu, bối cảnh xung quanh, và các chi tiết nghệ thuật khác để tạo ra một bức ảnh chân thực và ấn tượng.\n4. **KHÔNG** thêm bất kỳ lời dẫn, giải thích, hay định dạng nào khác. Chỉ trả về chuỗi prompt cuối cùng.`;
        const parts: any[] = [];
        if (image) parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
        parts.push({ text: prompt });
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: parts } });
        return response.text?.trim() || "";
    });
};

export const generatePromptFromImageAndText = async (image: FileData, keywords: string): Promise<string> => {
    return withSmartRetry(async (ai) => {
        const prompt = `Phân tích hình ảnh và từ khóa ("${keywords}"). Trả về DUY NHẤT một chuỗi prompt tiếng Việt chi tiết theo cấu trúc sau, KHÔNG thêm bất kỳ lời dẫn, giải thích hay định dạng nào khác. Cấu trúc: "Biến thành ảnh chụp thực tế, [loại công trình], [phong cách thiết kế], [tone màu], [vật liệu], [các đặc điểm khác của công trình], [cảnh quan xung quanh], [thời gian]". Điền thông tin vào các mục trong ngoặc vuông dựa trên phân tích.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: prompt },
                ],
            },
        });
        return response.text || "";
    });
};

export const generateMoodboardPromptFromScene = async (sceneImage: FileData): Promise<string> => {
     return withSmartRetry(async (ai) => {
        const prompt = `Analyze this image of an interior or exterior scene. Identify the core design style, key materials, and color palette. Summarize these elements into a concise, descriptive prompt suitable for generating a moodboard. For example: "A minimalist interior with light oak wood, soft gray fabrics, and a neutral color palette." or "A tropical brutalist exterior with raw concrete, lush green plants, and black metal accents." Return ONLY the descriptive phrase, in Vietnamese, without any introductory text.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: sceneImage.base64, mimeType: sceneImage.mimeType } },
                    { text: prompt },
                ],
            },
        });
        return response.text || "";
    });
};

// Internal helper for edit images using Smart Retry
const generateEditedImages = async (parts: any[], numberOfImages: number, jobId?: string): Promise<{imageUrl: string, text: string}[]> => {
    return withSmartRetry(async (ai) => {
        const generateSingle = async (): Promise<{imageUrl: string, text: string}> => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            
            let imageUrl = '';
            let text = '';
            for (const part of response.candidates[0].content.parts) {
                if (part.text) text = part.text;
                else if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            
            if (!imageUrl) {
                if (text) console.warn("Model returned text only:", text);
                throw new Error("The model did not return an edited image.");
            }
            return { imageUrl, text };
        };
        const promises = Array.from({ length: numberOfImages }, () => generateSingle());
        return Promise.all(promises);
    }, jobId);
}

// Image Editing Wrappers
export const editImage = async (prompt: string, image: FileData, numberOfImages: number = 1, jobId?: string) => {
    return await generateEditedImages([
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithMask = async (prompt: string, baseImage: FileData, maskImage: FileData, numberOfImages: number = 1, jobId?: string) => {
    return await generateEditedImages([
        { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } },
        { inlineData: { data: maskImage.base64, mimeType: maskImage.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithReference = async (prompt: string, baseImage: FileData, referenceImage: FileData, numberOfImages: number = 1, jobId?: string) => {
    return await generateEditedImages([
        { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } },
        { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const generateStagingImage = async (prompt: string, sceneImage: FileData, objectImages: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts = [
        { inlineData: { data: sceneImage.base64, mimeType: sceneImage.mimeType } },
        ...objectImages.map(objImg => ({ inlineData: { data: objImg.base64, mimeType: objImg.mimeType } })),
        { text: prompt },
    ];
    return await generateEditedImages(parts, numberOfImages, jobId);
};

export const editImageWithMaskAndReference = async (prompt: string, baseImage: FileData, maskImage: FileData, referenceImage: FileData, numberOfImages: number = 1, jobId?: string) => {
     return await generateEditedImages([
        { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } },
        { inlineData: { data: maskImage.base64, mimeType: maskImage.mimeType } },
        { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } },
        { text: prompt },
    ], numberOfImages, jobId);
};

export const editImageWithMultipleReferences = async (prompt: string, baseImage: FileData, referenceImages: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts = [
        { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } },
        ...referenceImages.map(refImg => ({ inlineData: { data: refImg.base64, mimeType: refImg.mimeType } })),
        { text: prompt },
    ];
    return await generateEditedImages(parts, numberOfImages, jobId);
};

export const editImageWithMaskAndMultipleReferences = async (prompt: string, baseImage: FileData, maskImage: FileData, referenceImages: FileData[], numberOfImages: number = 1, jobId?: string) => {
    const parts = [
        { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } },
        { inlineData: { data: maskImage.base64, mimeType: maskImage.mimeType } },
        ...referenceImages.map(refImg => ({ inlineData: { data: refImg.base64, mimeType: refImg.mimeType } })),
        { text: prompt },
    ];
    return await generateEditedImages(parts, numberOfImages, jobId);
};
