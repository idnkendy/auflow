
import React, { useState, useCallback, useRef } from 'react';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import * as jobService from '../services/jobService';
import { refundCredits } from '../services/paymentService';
import { FileData, Tool, AspectRatio } from '../types';
import { ImageGeneratorState } from '../state/toolState';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import OptionSelector from './common/OptionSelector';
import AspectRatioSelector from './common/AspectRatioSelector';
import ImagePreviewModal from './common/ImagePreviewModal';
import { supabase } from '../services/supabaseClient';

const buildingTypeOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'nhà phố', label: 'Nhà phố' },
    { value: 'biệt thự', label: 'Biệt thự' },
    { value: 'nhà cấp 4', label: 'Nhà cấp 4' },
    { value: 'chung cư', label: 'Chung cư' },
    { value: 'toà nhà văn phòng', label: 'Toà nhà văn phòng' },
    { value: 'quán cà phê', label: 'Quán cà phê' },
    { value: 'nhà hàng', label: 'Nhà hàng' },
];

const styleOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'Hiện đại', label: 'Hiện đại' },
    { value: 'Tối giản', label: 'Tối giản' },
    { value: 'Tân Cổ điển', label: 'Tân Cổ điển' },
    { value: 'Scandinavian', label: 'Scandinavian' },
    { value: 'Công nghiệp', label: 'Công nghiệp (Industrial)' },
    { value: 'Nhiệt đới', label: 'Nhiệt đới (Tropical)' },
    { value: 'Brutalism', label: 'Brutalism' },
];

const contextOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'trên một đường phố Việt Nam', label: 'Đường phố Việt Nam' },
    { value: 'ở một làng quê Việt Nam', label: 'Làng quê Việt Nam' },
    { value: 'trong một khu đô thị hiện đại Việt Nam', label: 'Khu đô thị hiện đại Việt Nam' },
    { value: 'tại một ngã ba đường phố Việt Nam', label: 'Ngã ba đường phố Việt Nam' },
    { value: 'tại một ngã tư đường phố Việt Nam', label: 'Ngã tư đường phố Việt Nam' },
];

const lightingOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'bình minh dịu nhẹ', label: 'Ánh sáng bình minh dịu nhẹ' },
    { value: 'buổi trưa, trời xanh trong', label: 'Ánh sáng buổi trưa, trời xanh trong' },
    { value: 'nắng chiều, nắng vàng cam', label: 'Ánh nắng chiều, nắng vàng cam' },
    { value: 'buổi tối, đèn vàng từ trong nhà hắt ra, đèn đường sáng', label: 'Ánh sáng buổi tối, đèn vàng & đèn đường' },
    { value: 'đêm khuya, đèn công trình sáng và bầu trời đầy sao', label: 'Ánh sáng đêm khuya, trời đầy sao' },
];

const weatherOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'trời trong xanh, quang đãng', label: 'Trời trong, quang đãng' },
    { value: 'có mưa nhẹ và đường ướt', label: 'Mưa nhẹ' },
    { value: 'có tuyết rơi nhẹ', label: 'Tuyết rơi' },
    { value: 'dưới trời nắng gắt, bóng đổ rõ rệt', label: 'Nắng gắt' },
    { value: 'sau một cơn mưa, có vũng nước và phản chiếu', label: 'Sau cơn mưa' },
];

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

interface ImageGeneratorProps {
  state: ImageGeneratorState;
  onStateChange: (newState: Partial<ImageGeneratorState>) => void;
  onSendToViewSync: (image: FileData) => void;
  userCredits?: number;
  onDeductCredits?: (amount: number, description: string) => Promise<string>;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ state, onStateChange, onSendToViewSync, userCredits = 0, onDeductCredits }) => {
    const { 
        style, context, lighting, weather, buildingType, customPrompt, referenceImage, 
        sourceImage, isLoading, isUpscaling, error, resultImages, upscaledImage, 
        numberOfImages, aspectRatio 
    } = state;
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const updatePrompt = useCallback((type: 'style' | 'context' | 'lighting' | 'weather' | 'buildingType', newValue: string, oldValue: string) => {
        const getPromptPart = (partType: string, value: string): string => {
            if (value === 'none' || !value) return '';
            switch (partType) {
                case 'style': return `phong cách ${value}`;
                case 'context': return `bối cảnh ${value}`;
                case 'lighting': return `ánh sáng ${value}`;
                case 'weather': return `thời tiết ${value}`;
                case 'buildingType': return `là một ${value}`;
                default: return '';
            }
        };

        const oldPart = getPromptPart(type, oldValue);
        const newPart = getPromptPart(type, newValue);
        
        let nextPrompt = customPrompt;

        if (oldPart && nextPrompt.includes(oldPart)) {
             nextPrompt = newPart ? nextPrompt.replace(oldPart, newPart) : nextPrompt.replace(new RegExp(`,?\\s*${oldPart}`), '').replace(new RegExp(`${oldPart},?\\s*`), '');
        } else if (newPart) {
            nextPrompt = nextPrompt.trim() ? `${nextPrompt}, ${newPart}` : newPart;
        }

        const cleanedPrompt = nextPrompt
            .replace(/,+/g, ',')
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .join(', ');
            
        onStateChange({ customPrompt: cleanedPrompt });

    }, [customPrompt, onStateChange]);

    const handleBuildingTypeChange = (newVal: string) => {
        updatePrompt('buildingType', newVal, buildingType);
        onStateChange({ buildingType: newVal });
    };

    const handleStyleChange = (newVal: string) => {
        updatePrompt('style', newVal, style);
        onStateChange({ style: newVal });
    };

    const handleContextChange = (newVal: string) => {
        updatePrompt('context', newVal, context);
        onStateChange({ context: newVal });
    };

    const handleLightingChange = (newVal: string) => {
        updatePrompt('lighting', newVal, lighting);
        onStateChange({ lighting: newVal });
    };

    const handleWeatherChange = (newVal: string) => {
        updatePrompt('weather', newVal, weather);
        onStateChange({ weather: newVal });
    };

    const handleFileSelect = (fileData: FileData | null) => {
        onStateChange({ 
            sourceImage: fileData, 
            resultImages: [], 
            upscaledImage: null 
        });
    }

    const handleReferenceFileSelect = (fileData: FileData | null) => {
        onStateChange({ referenceImage: fileData });
    };

    const handleAutoPrompt = async () => {
        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải ảnh lên trước khi tạo prompt tự động.' });
            return;
        }
        setIsGeneratingPrompt(true);
        onStateChange({ error: null });
        try {
            const generatedPrompt = await geminiService.generatePromptFromImageAndText(sourceImage, customPrompt);
            onStateChange({ customPrompt: generatedPrompt });
        } catch (err: any) {
            onStateChange({ error: err.message });
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const cost = numberOfImages * 10;

    const performGeneration = async (
        prompt: string, 
        sourceImage: FileData | null, 
        referenceImage: FileData | null, 
        numberOfImages: number,
        aspectRatio: AspectRatio,
        jobId?: string
    ): Promise<string[]> => {
         if (sourceImage) {
            // Image-to-Image Generation
            const promptForService = `Generate an image with a strict aspect ratio of ${aspectRatio}. Adapt the composition from the source image to fit this new frame. Do not add black bars or letterbox. The main creative instruction is: ${prompt}`;
            
            let results;
            if (referenceImage) {
                const promptWithRef = `${promptForService} Also, take aesthetic inspiration (colors, materials, atmosphere) from the provided reference image.`;
                results = await geminiService.editImageWithReference(promptWithRef, sourceImage, referenceImage, numberOfImages, jobId);
            } else {
                results = await geminiService.editImage(promptForService, sourceImage, numberOfImages, jobId);
            }
            return results.map(r => r.imageUrl);
    
        } else {
            // Text-to-Image Generation
            const promptForService = `${prompt}, photorealistic architectural rendering, high detail, masterpiece`;
            return await geminiService.generateImage(promptForService, aspectRatio, numberOfImages, jobId);
        }
    };

    const handleGenerate = async () => {
        if (onDeductCredits && userCredits < cost) {
             onStateChange({ error: `Bạn không đủ credits. Cần ${cost} credits nhưng chỉ còn ${userCredits}. Vui lòng nạp thêm.` });
             return;
        }

        if (!customPrompt.trim()) {
            onStateChange({ error: 'Lời nhắc (prompt) không được để trống.' });
            return;
        }
        
        onStateChange({ isLoading: true, error: null, resultImages: [], upscaledImage: null });
        setStatusMessage(null);
        
        let jobId: string | null = null;
        let logId: string | null = null;

        try {
            // 1. Deduct credits first & Get Log ID
            if (onDeductCredits) {
                logId = await onDeductCredits(cost, `Render kiến trúc (${numberOfImages} ảnh)`);
            }
            
            // 2. Create Job (Pending)
            const { data: { user } } = await supabase.auth.getUser();
            if (user && logId) {
                 jobId = await jobService.createJob({
                    user_id: user.id,
                    tool_id: Tool.ArchitecturalRendering,
                    prompt: customPrompt,
                    cost: cost,
                    usage_log_id: logId
                });
            }

            // 3. Smart Retry Logic
            let attempts = 0;
            const maxAttempts = 60; // Try for 5 minutes (approx 5s per loop + wait)
            let imageUrls: string[] = [];
            let success = false;

            while (attempts < maxAttempts) {
                try {
                     if (jobId) await jobService.updateJobStatus(jobId, 'processing');
                     
                     // Pass jobId to performGeneration to track API Key
                     imageUrls = await performGeneration(customPrompt, sourceImage, referenceImage, numberOfImages, aspectRatio, jobId || undefined);
                     
                     success = true;
                     break; // Success!

                } catch (apiError: any) {
                    if (apiError.message === 'SYSTEM_BUSY') {
                        attempts++;
                        console.warn(`System busy, retrying... (${attempts}/${maxAttempts})`);
                        setStatusMessage(`Hệ thống đang bận (${attempts}), vui lòng đợi trong giây lát...`);
                        
                        // Keep job as 'pending' in DB logic (conceptually), but here we just wait
                        // Actually, set it back to 'pending' so if user closes tab, the cron job picks it up later as stale
                        if (jobId) await jobService.updateJobStatus(jobId, 'pending');

                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
                    } else {
                        throw apiError; // Fatal error (e.g., bad request), stop immediately
                    }
                }
            }

            if (!success) {
                 throw new Error("Hệ thống quá tải. Đã hoàn tiền, vui lòng thử lại sau.");
            }

            // Success Handling
            onStateChange({ resultImages: imageUrls });
            if (jobId && imageUrls.length > 0) {
                await jobService.updateJobStatus(jobId, 'completed', imageUrls[0]);
            }

             // Add history
            const historyPrompt = sourceImage 
                ? `Generate an image with a strict aspect ratio of ${aspectRatio}. Adapt the composition from the source image to fit this new frame. The main creative instruction is: ${customPrompt}`
                : `${customPrompt}, photorealistic architectural rendering, high detail, masterpiece`;

            imageUrls.forEach(url => {
                historyService.addToHistory({
                    tool: Tool.ArchitecturalRendering,
                    prompt: historyPrompt,
                    sourceImageURL: sourceImage?.objectURL,
                    resultImageURL: url,
                });
            });

        } catch (err: any) {
            const errorMessage = err.message || 'Đã xảy ra lỗi không mong muốn.';
            onStateChange({ error: errorMessage });
            
            // 5. Update Job Failed & Refund
            if (jobId) {
                await jobService.updateJobStatus(jobId, 'failed', undefined, errorMessage);
            }
            // Refund
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                await refundCredits(user.id, cost, `Hoàn tiền: Lỗi khi render kiến trúc (${errorMessage})`);
             }

        } finally {
            onStateChange({ isLoading: false });
            setStatusMessage(null);
        }
    };

    const handleUpscale = async () => {
        if (resultImages.length !== 1) return;
        const resultImage = resultImages[0];

        onStateChange({ isUpscaling: true, error: null });

        try {
            const parts = resultImage.split(';base64,');
            if (parts.length < 2) throw new Error("Invalid result image format for upscaling.");
            
            const mimeType = parts[0].split(':')[1];
            const base64 = parts[1];
            
            const imageToUpscale: FileData = {
                base64,
                mimeType,
                objectURL: resultImage
            };

            const upscalePrompt = "Upscale this architectural rendering to a high resolution. Enhance the details, textures, and lighting to make it look photorealistic and professional. Do not change the composition or the core design.";
            
            const result = await geminiService.editImage(upscalePrompt, imageToUpscale, 1);
            onStateChange({ upscaledImage: result[0].imageUrl });
        } catch (err: any) {
            onStateChange({ error: err.message || "Failed to upscale image." });
        } finally {
            onStateChange({ isUpscaling: false });
        }
    };

    const handleDownload = () => {
        const url = upscaledImage || (resultImages.length > 0 ? resultImages[0] : null);
        if (!url) return;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = "generated-architecture.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendImageToSync = (imageUrl: string) => {
        const parts = imageUrl.split(';base64,');
        if (parts.length < 2) {
            onStateChange({ error: "Không thể chuyển ảnh, định dạng không hợp lệ." });
            return;
        }

        const mimeType = parts[0].split(':')[1];
        const base64 = parts[1];

        const fileData: FileData = {
            base64,
            mimeType,
            objectURL: imageUrl,
        };

        onSendToViewSync(fileData);
    };

    return (
        <div className="flex flex-col gap-8">
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
            
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-text-primary dark:text-white">AI Render Kiến trúc</h2>
                <p className="text-text-secondary dark:text-gray-400">Biến phác thảo thành hiện thực hoặc tạo ý tưởng mới từ mô tả văn bản.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT COLUMN: CONFIGURATION --- */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Prompt Input - Top Priority */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <label htmlFor="custom-prompt-architectural" className="block text-sm font-bold text-text-primary dark:text-white mb-2">
                            Mô tả ý tưởng (Prompt)
                        </label>
                        <div className="relative">
                            <textarea
                                id="custom-prompt-architectural"
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:border-accent focus:outline-none transition-all resize-none"
                                placeholder="VD: Một ngôi nhà phố hiện đại, mặt tiền 5m, nhiều cây xanh, cửa kính lớn, ánh sáng tự nhiên..."
                                value={customPrompt}
                                onChange={(e) => onStateChange({ customPrompt: e.target.value })}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAutoPrompt}
                                disabled={!sourceImage || isLoading || isUpscaling || isGeneratingPrompt}
                                className="absolute bottom-2 right-2 p-2 text-xs bg-accent/10 hover:bg-accent/20 text-accent-600 dark:text-accent-400 rounded-md transition-colors flex items-center gap-1"
                                title="Tạo prompt từ ảnh"
                            >
                                {isGeneratingPrompt ? <Spinner /> : <SparklesIcon />}
                                <span>Auto Prompt</span>
                            </button>
                        </div>
                    </div>

                    {/* Image Inputs */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-border-color dark:border-gray-700 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Ảnh Phác Thảo (Sketch)</label>
                            <ImageUpload onFileSelect={handleFileSelect} previewUrl={sourceImage?.objectURL}/>
                        </div>
                         <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2 mt-3">Ảnh Tham Chiếu (Style Reference)</label>
                            <ImageUpload onFileSelect={handleReferenceFileSelect} previewUrl={referenceImage?.objectURL}/>
                        </div>
                    </div>

                    {/* Advanced Options (Accordion Style) */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-border-color dark:border-gray-700">
                        <h3 className="text-sm font-bold text-text-primary dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Tinh chỉnh chi tiết</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <OptionSelector id="building-type-selector" label="Loại công trình" options={buildingTypeOptions} value={buildingType} onChange={handleBuildingTypeChange} disabled={isLoading} />
                            <OptionSelector id="style-selector" label="Phong cách" options={styleOptions} value={style} onChange={handleStyleChange} disabled={isLoading} />
                            <OptionSelector id="context-selector" label="Bối cảnh" options={contextOptions} value={context} onChange={handleContextChange} disabled={isLoading} />
                            <OptionSelector id="lighting-selector" label="Ánh sáng" options={lightingOptions} value={lighting} onChange={handleLightingChange} disabled={isLoading} />
                            <OptionSelector id="weather-selector" label="Thời tiết" options={weatherOptions} value={weather} onChange={handleWeatherChange} disabled={isLoading} />
                        </div>
                    </div>
                    
                    {/* Output Settings */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-border-color dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                            <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({numberOfImages: val})} disabled={isLoading || isUpscaling} />
                            <AspectRatioSelector value={aspectRatio} onChange={(val) => onStateChange({aspectRatio: val})} disabled={isLoading || isUpscaling} />
                        </div>
                    </div>

                    {/* Generate Button Block */}
                    <div className="sticky bottom-4 z-20">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-accent/20 dark:border-accent/20">
                            <div className="flex justify-between items-center mb-3 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Chi phí ước tính:</span>
                                <div className={`font-bold ${userCredits < cost ? 'text-red-500' : 'text-accent-600 dark:text-accent-400'}`}>
                                    {cost} Credits <span className="font-normal text-gray-400 text-xs">/ {userCredits} khả dụng</span>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !customPrompt.trim() || isUpscaling || userCredits < cost}
                                className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-accent-600 to-teal-500 hover:from-accent-500 hover:to-teal-400 text-white font-bold text-lg shadow-lg shadow-accent-500/30 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2"
                            >
                                {isLoading ? <><Spinner /> {statusMessage || 'Đang xử lý...'}</> : 'Bắt đầu Render'}
                            </button>
                             {error && <p className="mt-3 text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">{error}</p>}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: PREVIEW & RESULTS --- */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary dark:text-white flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                             Kết quả
                        </h3>
                        
                        {/* Action Buttons for Result */}
                        {resultImages.length === 1 && (
                            <div className="flex items-center gap-2">
                                {!upscaledImage && (
                                    <button
                                        onClick={handleUpscale}
                                        disabled={isUpscaling || isLoading}
                                        className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-yellow-500/20"
                                    >
                                        {isUpscaling ? <Spinner/> : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        )}
                                        <span>Upscale</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleSendImageToSync(upscaledImage || resultImages[0])}
                                    className="text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/40 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-accent-200 dark:border-accent-800"
                                >
                                    Đồng bộ View
                                </button>
                                <button
                                    onClick={() => setPreviewImage(upscaledImage || resultImages[0])}
                                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-lg transition-colors"
                                    title="Phóng to"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                </button>
                                 <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors">
                                    Tải xuống
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Canvas Area */}
                    <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-accent-600 dark:text-accent-400 font-medium animate-pulse">AI đang vẽ...</p>
                            </div>
                        )}

                        {!isLoading && upscaledImage && resultImages.length === 1 && (
                             <ImageComparator originalImage={resultImages[0]} resultImage={upscaledImage} />
                        )}
                        {!isLoading && !upscaledImage && resultImages.length === 1 && sourceImage && (
                             <ImageComparator originalImage={sourceImage.objectURL} resultImage={resultImages[0]} />
                        )}
                         {!isLoading && !upscaledImage && resultImages.length === 1 && !sourceImage && (
                            <img src={resultImages[0]} alt="Generated Result" className="w-full h-full object-contain" />
                        )}
                         {!isLoading && resultImages.length > 1 && (
                            <ResultGrid images={resultImages} toolName="architecture-render" onSendToViewSync={handleSendImageToSync} />
                        )}
                        {!isLoading && resultImages.length === 0 && (
                            <div className="text-center p-8 opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">Kết quả render sẽ xuất hiện ở đây</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Hãy nhập mô tả hoặc tải ảnh lên để bắt đầu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
