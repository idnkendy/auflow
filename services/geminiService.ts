
// Fix: Imported GenerateVideosResponse to correctly type the video generation operation.
import { GoogleGenAI, GenerateContentResponse, Modality, Operation, GenerateVideosResponse, Type } from "@google/genai";
import { AspectRatio, FileData } from "../types";

// Sử dụng giá trị rỗng nếu không có key để tránh crash ứng dụng ngay khi mở
const API_KEY = process.env.API_KEY || "";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Hàm kiểm tra key trước khi gọi API
const ensureApiKey = () => {
    if (!API_KEY) {
        throw new Error("API Key chưa được cấu hình. Vui lòng kiểm tra biến môi trường.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, numberOfImages: number = 1): Promise<string[]> => {
    ensureApiKey();
    try {
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

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image. Please check the prompt and try again.");
    }
};

export const generateVideo = async (
    prompt: string, 
    startImage?: FileData
): Promise<string> => {
    ensureApiKey();
    try {
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
            config: {
                numberOfVideos: 1
            }
        });
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
          throw new Error("Video generation completed, but no download link was found.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
        }
        
        const videoBlob = await videoResponse.blob();
        
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(videoBlob);
        });

    } catch (error) {
        console.error("Error generating video:", error);
        throw new Error("Failed to generate video. This can take a few minutes. If the problem persists, please try again later.");
    }
};

export const generateTextFromImage = async (prompt: string, image: FileData): Promise<string> => {
    ensureApiKey();
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.base64,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating text from image:", error);
        throw new Error("Failed to analyze the image. Please try again.");
    }
};

export const generateText = async (prompt: string): Promise<string> => {
    ensureApiKey();
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        throw new Error("Failed to generate text response. Please try again.");
    }
};

export const generatePromptSuggestions = async (image: FileData, subject: string, count: number, customInstruction?: string): Promise<Record<string, string[]>> => {
    ensureApiKey();
    try {
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
            responseSchema = {
                type: Type.OBJECT,
                properties: allProperties
            };
        } else if (allSubjects[subject]) {
            prompt += `\nTập trung vào chủ đề '${subject}'. Cung cấp ${count} prompt.`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    [subject]: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            };
        } else {
             throw new Error("Chủ đề gợi ý không hợp lệ.");
        }

        if (customInstruction && customInstruction.trim()) {
            prompt += `\nLưu ý quan trọng: Luôn tích hợp yêu cầu sau vào mỗi prompt: "${customInstruction.trim()}".`;
        }


        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.base64,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
        
    } catch (error) {
        console.error("Error generating prompt suggestions:", error);
        throw new Error("Không thể tạo gợi ý. Vui lòng thử lại.");
    }
};

export const enhancePrompt = async (
    customNeeds: string,
    image?: FileData
): Promise<string> => {
    ensureApiKey();
    try {
        let prompt = `Bạn là một chuyên gia viết prompt cho AI tạo hình ảnh kiến trúc. Nhiệm vụ của bạn là nhận yêu cầu của người dùng (có thể là từ khóa, mô tả chi tiết, hoặc một hình ảnh) và biến chúng thành một prompt hoàn chỉnh, chuyên nghiệp bằng tiếng Việt.

Yêu cầu đầu vào:
- Mô tả của người dùng: "${customNeeds}"
${image ? '- Có một hình ảnh tham khảo được cung cấp.' : ''}

Nhiệm vụ:
1. ${image ? 'Phân tích hình ảnh tham khảo để hiểu bối cảnh, phong cách kiến trúc, vật liệu và bố cục.' : ''}
2. Dựa vào tất cả thông tin đầu vào, hãy tạo ra **DUY NHẤT MỘT** chuỗi prompt hoàn chỉnh và chi tiết.
3. Cấu trúc prompt nên bao gồm các yếu tố sau (nếu có thể): loại công trình, phong cách thiết kế, góc nhìn camera, ánh sáng, thời tiết, vật liệu, bối cảnh xung quanh, và các chi tiết nghệ thuật khác để tạo ra một bức ảnh chân thực và ấn tượng.
4. **KHÔNG** thêm bất kỳ lời dẫn, giải thích, hay định dạng nào khác. Chỉ trả về chuỗi prompt cuối cùng.`;

        const parts: any[] = [];
        if (image) {
            parts.push({
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            });
        }
        parts.push({ text: prompt });

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        throw new Error("Không thể tạo prompt. Vui lòng thử lại.");
    }
};


export const generatePromptFromImageAndText = async (image: FileData, keywords: string): Promise<string> => {
    ensureApiKey();
    try {
        const prompt = `Phân tích hình ảnh và từ khóa ("${keywords}"). Trả về DUY NHẤT một chuỗi prompt tiếng Việt chi tiết theo cấu trúc sau, KHÔNG thêm bất kỳ lời dẫn, giải thích hay định dạng nào khác. Cấu trúc: "Biến thành ảnh chụp thực tế, [loại công trình], [phong cách thiết kế], [tone màu], [vật liệu], [các đặc điểm khác của công trình], [cảnh quan xung quanh], [thời gian]". Điền thông tin vào các mục trong ngoặc vuông dựa trên phân tích.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.base64,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating prompt from image and text:", error);
        throw new Error("Không thể tạo prompt tự động. Vui lòng thử lại.");
    }
};

export const generateMoodboardPromptFromScene = async (sceneImage: FileData): Promise<string> => {
    ensureApiKey();
    try {
        const prompt = `Analyze this image of an interior or exterior scene. Identify the core design style, key materials, and color palette. Summarize these elements into a concise, descriptive prompt suitable for generating a moodboard. For example: "A minimalist interior with light oak wood, soft gray fabrics, and a neutral color palette." or "A tropical brutalist exterior with raw concrete, lush green plants, and black metal accents." Return ONLY the descriptive phrase, in Vietnamese, without any introductory text.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: sceneImage.base64,
                            mimeType: sceneImage.mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating moodboard prompt from scene:", error);
        throw new Error("Không thể phân tích ảnh để tạo prompt. Vui lòng thử lại.");
    }
};


const generateEditedImages = async (parts: any[], numberOfImages: number): Promise<{imageUrl: string, text: string}[]> => {
    ensureApiKey();
    const generateSingle = async (): Promise<{imageUrl: string, text: string}> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        let imageUrl = '';
        let text = '';

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                text = part.text;
            } else if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        if (!imageUrl) {
            throw new Error("The model did not return an edited image.");
        }

        return { imageUrl, text };
    };
    
    const promises = Array.from({ length: numberOfImages }, () => generateSingle());
    return Promise.all(promises);
}

export const editImage = async (prompt: string, image: FileData, numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            },
            {
                text: prompt,
            },
        ];
        return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image. Please check your prompt and image and try again.");
    }
};

export const editImageWithMask = async (prompt: string, baseImage: FileData, maskImage: FileData, numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: baseImage.base64,
                    mimeType: baseImage.mimeType,
                },
            },
            { // The mask part
                inlineData: {
                    data: maskImage.base64,
                    mimeType: maskImage.mimeType,
                },
            },
            {
                text: prompt,
            },
        ];
        return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image with mask:", error);
        throw new Error("Failed to edit image with mask. Please check your prompt and images and try again.");
    }
};

export const editImageWithReference = async (prompt: string, baseImage: FileData, referenceImage: FileData, numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: baseImage.base64,
                    mimeType: baseImage.mimeType,
                },
            },
            {
                inlineData: {
                    data: referenceImage.base64,
                    mimeType: referenceImage.mimeType,
                },
            },
            {
                text: prompt,
            },
        ];
       return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image with reference:", error);
        throw new Error("Failed to edit image. Please check your prompt and images and try again.");
    }
};

export const generateStagingImage = async (prompt: string, sceneImage: FileData, objectImages: FileData[], numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            { // The scene image
                inlineData: {
                    data: sceneImage.base64,
                    mimeType: sceneImage.mimeType,
                },
            },
            ...objectImages.map(objImg => ({ // The object images
                inlineData: {
                    data: objImg.base64,
                    mimeType: objImg.mimeType,
                },
            })),
            { // The text prompt
                text: prompt,
            },
        ];
       return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error generating staging image:", error);
        throw new Error("Failed to stage objects. Please check your prompt and images, then try again.");
    }
};

export const editImageWithMaskAndReference = async (prompt: string, baseImage: FileData, maskImage: FileData, referenceImage: FileData, numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: baseImage.base64,
                    mimeType: baseImage.mimeType,
                },
            },
            { // The mask part
                inlineData: {
                    data: maskImage.base64,
                    mimeType: maskImage.mimeType,
                },
            },
            { // The reference part
                inlineData: {
                    data: referenceImage.base64,
                    mimeType: referenceImage.mimeType,
                },
            },
            {
                text: prompt,
            },
        ];
       return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image with mask and reference:", error);
        throw new Error("Failed to edit image. Please check your prompt and images and try again.");
    }
};

export const editImageWithMultipleReferences = async (prompt: string, baseImage: FileData, referenceImages: FileData[], numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: baseImage.base64,
                    mimeType: baseImage.mimeType,
                },
            },
            ...referenceImages.map(refImg => ({
                inlineData: {
                    data: refImg.base64,
                    mimeType: refImg.mimeType,
                },
            })),
            {
                text: prompt,
            },
        ];
       return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image with multiple references:", error);
        throw new Error("Failed to edit image. Please check your prompt and images and try again.");
    }
};

export const editImageWithMaskAndMultipleReferences = async (prompt: string, baseImage: FileData, maskImage: FileData, referenceImages: FileData[], numberOfImages: number = 1): Promise<{imageUrl: string, text: string}[]> => {
    try {
        const parts = [
            {
                inlineData: {
                    data: baseImage.base64,
                    mimeType: baseImage.mimeType,
                },
            },
            { // The mask part
                inlineData: {
                    data: maskImage.base64,
                    mimeType: maskImage.mimeType,
                },
            },
            ...referenceImages.map(refImg => ({
                inlineData: {
                    data: refImg.base64,
                    mimeType: refImg.mimeType,
                },
            })),
            {
                text: prompt,
            },
        ];
       return await generateEditedImages(parts, numberOfImages);
    } catch (error) {
        console.error("Error editing image with mask and multiple references:", error);
        throw new Error("Failed to edit image. Please check your prompt and images and try again.");
    }
};
