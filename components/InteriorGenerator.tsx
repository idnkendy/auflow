
import React, { useState, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import * as jobService from '../services/jobService';
import { refundCredits } from '../services/paymentService';
import { FileData, Tool, AspectRatio, ImageResolution } from '../types';
import { InteriorGeneratorState } from '../state/toolState';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import OptionSelector from './common/OptionSelector';
import AspectRatioSelector from './common/AspectRatioSelector';
import ResolutionSelector from './common/ResolutionSelector';
import ImagePreviewModal from './common/ImagePreviewModal';
import { supabase } from '../services/supabaseClient';

const styleOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'Hiện đại', label: 'Hiện đại' },
    { value: 'Tối giản', label: 'Tối giản' },
    { value: 'Tân Cổ điển', label: 'Tân Cổ điển' },
    { value: 'Scandinavian', label: 'Scandinavian' },
    { value: 'Japandi', label: 'Japandi' },
    { value: 'Công nghiệp', label: 'Công nghiệp (Industrial)' },
    { value: 'Nhiệt đới', label: 'Nhiệt đới (Tropical)' },
    { value: 'Bohemian', label: 'Bohemian' },
];

const roomTypeOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'Phòng khách', label: 'Phòng khách' },
    { value: 'Phòng ngủ', label: 'Phòng ngủ' },
    { value: 'Nhà bếp', label: 'Nhà bếp' },
    { value: 'Phòng ăn', label: 'Phòng ăn' },
    { value: 'Phòng tắm', label: 'Phòng tắm' },
    { value: 'Văn phòng tại nhà', label: 'Văn phòng tại nhà' },
];

const interiorLightingOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'Ánh sáng tự nhiên ban ngày, chan hòa', label: 'Ánh sáng tự nhiên ban ngày' },
    { value: 'Ánh sáng nhân tạo ấm áp buổi tối', label: 'Ánh sáng nhân tạo ấm áp' },
    { value: 'Ánh sáng studio, làm nổi bật chi tiết', label: 'Ánh sáng studio' },
    { value: 'Ánh sáng moody, có độ tương phản cao', label: 'Ánh sáng moody, tương phản' },
    { value: 'Ánh sáng đèn neon hiện đại', label: 'Ánh sáng đèn neon' },
];

const colorPaletteOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'Tông màu trung tính (trắng, xám, be)', label: 'Tông màu trung tính' },
    { value: 'Tông màu ấm (kem, nâu, cam đất)', label: 'Tông màu ấm' },
    { value: 'Tông màu lạnh (xanh dương, xanh lá, xám)', label: 'Tông màu lạnh' },
    { value: 'Tông màu tương phản cao (đen và trắng)', label: 'Tông màu tương phản' },
    { value: 'Tông màu pastel nhẹ nhàng', label: 'Tông màu pastel' },
];

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

interface InteriorGeneratorProps {
  state: InteriorGeneratorState;
  onStateChange: (newState: Partial<InteriorGeneratorState>) => void;
  onSendToViewSync: (image: FileData) => void;
  userCredits?: number;
  onDeductCredits?: (amount: number, description: string) => Promise<string>;
}

const InteriorGenerator: React.FC<InteriorGeneratorProps> = ({ state, onStateChange, onSendToViewSync, userCredits = 0, onDeductCredits }) => {
    const { 
        style, roomType, lighting, colorPalette, customPrompt, referenceImage, sourceImage, 
        isLoading, isUpscaling, error, resultImages, upscaledImage, numberOfImages, aspectRatio, resolution
    } = state;

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    
    const updatePrompt = useCallback((type: 'style' | 'roomType' | 'lighting' | 'colorPalette', newValue: string, oldValue: string) => {
        const getPromptPart = (partType: string, value: string): string => {
            if (value === 'none' || !value) return '';
            switch (partType) {
                case 'style': return `phong cách ${value}`;
                case 'roomType': return `cho ${value}`;
                case 'lighting': return `với ${value}`;
                case 'colorPalette': return `sử dụng ${value}`;
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

    const handleStyleChange = (newVal: string) => {
        updatePrompt('style', newVal, style);
        onStateChange({ style: newVal });
    };

    const handleRoomTypeChange = (newVal: string) => {
        updatePrompt('roomType', newVal, roomType);
        onStateChange({ roomType: newVal });
    };

    const handleLightingChange = (newVal: string) => {
        updatePrompt('lighting', newVal, lighting);
        onStateChange({ lighting: newVal });
    };
    
    const handleColorPaletteChange = (newVal: string) => {
        updatePrompt('colorPalette', newVal, colorPalette);
        onStateChange({ colorPalette: newVal });
    };

    const handleResolutionChange = (val: ImageResolution) => {
        onStateChange({ resolution: val });
    };

    const handleFileSelect = (fileData: FileData | null) => {
        onStateChange({
            sourceImage: fileData,
            resultImages: [],
            upscaledImage: null,
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

    // Update Cost: 5 credits per image
    const cost = numberOfImages * 5;

    const handleGenerate = async () => {
        if (onDeductCredits && userCredits < cost) {
             onStateChange({ error: `Bạn không đủ credits. Cần ${cost} credits nhưng chỉ còn ${userCredits}. Vui lòng nạp thêm.` });
             return;
        }

        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải lên một hình ảnh phác thảo hoặc không gian.' });
            return;
        }
        if (!customPrompt.trim()) {
            onStateChange({ error: 'Lời nhắc (prompt) không được để trống.' });
            return;
        }

        onStateChange({ isLoading: true, error: null, resultImages: [], upscaledImage: null });

        const promptForService = `Generate an image with a strict aspect ratio of ${aspectRatio}. Adapt the composition of the interior scene from the source image to fit this new frame. Do not add black bars or letterbox. The main creative instruction is: ${customPrompt}`;
        
        let jobId: string | null = null;
        let logId: string | null = null;

        try {
            if (onDeductCredits) {
                logId = await onDeductCredits(cost, `Render nội thất (${numberOfImages} ảnh) - ${resolution || '1K'}`);
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user && logId) {
                 jobId = await jobService.createJob({
                    user_id: user.id,
                    tool_id: Tool.InteriorRendering,
                    prompt: customPrompt,
                    cost: cost,
                    usage_log_id: logId
                });
            }

            if (jobId) await jobService.updateJobStatus(jobId, 'processing');

            let results: { imageUrl: string }[];
            
            // High Quality Logic
            if (resolution === '2K' || resolution === '4K') {
                const promises = Array.from({ length: numberOfImages }).map(async () => {
                    const images = await geminiService.generateHighQualityImage(customPrompt, aspectRatio, resolution, sourceImage || undefined);
                    return images[0];
                });
                const images = await Promise.all(promises);
                results = images.map(url => ({ imageUrl: url })); // Normalize structure
            } else {
                // Standard Logic
                 if (referenceImage) {
                     const promptWithRef = `${promptForService} Also, take aesthetic inspiration (colors, materials, atmosphere) from the provided reference image.`;
                     results = await geminiService.editImageWithReference(promptWithRef, sourceImage, referenceImage, numberOfImages, jobId || undefined);
                } else {
                     results = await geminiService.editImage(promptForService, sourceImage, numberOfImages, jobId || undefined);
                }
            }
            
            const imageUrls = results.map(r => r.imageUrl);
            onStateChange({ resultImages: imageUrls });

            if (jobId && imageUrls.length > 0) {
                await jobService.updateJobStatus(jobId, 'completed', imageUrls[0]);
            }
            
            imageUrls.forEach(url => {
                historyService.addToHistory({
                    tool: Tool.InteriorRendering,
                    prompt: promptForService,
                    sourceImageURL: sourceImage.objectURL,
                    resultImageURL: url,
                });
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Đã xảy ra lỗi không mong muốn.';
            onStateChange({ error: errorMessage });

             if (jobId) {
                await jobService.updateJobStatus(jobId, 'failed', undefined, errorMessage);
            }
            // Refund
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                await refundCredits(user.id, cost, `Hoàn tiền: Lỗi khi render nội thất (${errorMessage})`);
             }
        } finally {
            onStateChange({ isLoading: false });
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

            const upscalePrompt = "Upscale this interior design rendering to a high resolution. Enhance the details, textures, and lighting to make it look photorealistic and professional. Do not change the composition or the core design.";
            
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
        link.download = "generated-interior.png";
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
            <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Render Nội thất</h2>
                <p className="text-text-secondary dark:text-gray-300 mb-6">Tải lên ảnh phác thảo, mặt bằng hoặc ảnh thực tế của một không gian, AI sẽ giúp bạn hoàn thiện với đầy đủ vật liệu, ánh sáng và đồ đạc.</p>
                
                {/* --- INPUTS --- */}
                <div className="space-y-6 bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Image Uploads (Left Column) */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">1. Tải Lên Ảnh Phác Thảo / Không Gian</label>
                                <ImageUpload onFileSelect={handleFileSelect} previewUrl={sourceImage?.objectURL}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Ảnh Tham Chiếu (Tùy chọn)</label>
                                <ImageUpload onFileSelect={handleReferenceFileSelect} previewUrl={referenceImage?.objectURL}/>
                            </div>
                        </div>

                        {/* Prompt and Options (Right Column) */}
                         <div className="space-y-4 flex flex-col">
                             <div>
                                <label htmlFor="custom-prompt-interior" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">2. Mô tả yêu cầu chính</label>
                                <textarea
                                    id="custom-prompt-interior"
                                    rows={4}
                                    className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                                    placeholder="Mô tả ý tưởng của bạn ở đây..."
                                    value={customPrompt}
                                    onChange={(e) => onStateChange({ customPrompt: e.target.value })}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleAutoPrompt}
                                    disabled={!sourceImage || isLoading || isUpscaling || isGeneratingPrompt}
                                    className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                                >
                                    {isGeneratingPrompt ? <Spinner /> : <SparklesIcon />}
                                    <span>{isGeneratingPrompt ? 'Đang tạo...' : 'Tạo tự động Prompt'}</span>
                                </button>
                             </div>
                            
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">3. Tinh chỉnh tùy chọn</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <OptionSelector id="style-selector-int" label="Phong cách thiết kế" options={styleOptions} value={style} onChange={handleStyleChange} disabled={isLoading} />
                                    <OptionSelector id="room-type-selector" label="Loại phòng" options={roomTypeOptions} value={roomType} onChange={handleRoomTypeChange} disabled={isLoading} />
                                    <OptionSelector id="lighting-selector-int" label="Ánh sáng" options={interiorLightingOptions} value={lighting} onChange={handleLightingChange} disabled={isLoading} />
                                    <OptionSelector id="color-palette-selector" label="Tone màu" options={colorPaletteOptions} value={colorPalette} onChange={handleColorPaletteChange} disabled={isLoading} />
                                </div>
                            </div>
                            
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({ numberOfImages: val })} disabled={isLoading || isUpscaling} />
                               <AspectRatioSelector value={aspectRatio} onChange={(val) => onStateChange({ aspectRatio: val })} disabled={isLoading || isUpscaling} />
                               <ResolutionSelector value={resolution} onChange={handleResolutionChange} disabled={isLoading || isUpscaling} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                         <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 rounded-lg px-4 py-2 mb-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
                                </svg>
                                <span>Chi phí: <span className="font-bold text-text-primary dark:text-white">{cost} Credits</span></span>
                            </div>
                            <div className="text-xs">
                                {userCredits < cost ? (
                                    <span className="text-red-500 font-semibold">Không đủ (Có: {userCredits})</span>
                                ) : (
                                    <span className="text-green-600 dark:text-green-400">Khả dụng: {userCredits}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !sourceImage || isUpscaling || userCredits < cost}
                            className="w-full flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                           {isLoading ? <><Spinner /> Đang Render...</> : 'Bắt đầu Render'}
                        </button>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
                </div>
            </div>

            {/* --- RESULTS VIEW --- */}
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-white">So sánh Trước & Sau</h3>
                    <div className="flex items-center gap-2">
                        {resultImages.length === 1 && !upscaledImage && (
                            <button
                                onClick={handleUpscale}
                                disabled={isUpscaling || isLoading}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                            >
                                {isUpscaling ? <Spinner/> : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                )}
                                <span>{isUpscaling ? 'Đang nâng cấp...' : 'Nâng cấp chi tiết'}</span>
                            </button>
                        )}
                        {resultImages.length === 1 && (
                            <>
                                 <button
                                    onClick={() => handleSendImageToSync(upscaledImage || resultImages[0])}
                                    className="text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm flex items-center gap-2"
                                    title="Chuyển ảnh này tới Đồng Bộ View để xử lý tiếp"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2H-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Đồng bộ
                                </button>
                                 <button
                                    onClick={() => setPreviewImage(upscaledImage || resultImages[0])}
                                    className="text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                    Phóng to
                                </button>
                                 <button onClick={handleDownload} className="text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm">
                                    Tải xuống
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="w-full aspect-video bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    {isLoading && <Spinner />}
                    {!isLoading && upscaledImage && resultImages.length === 1 && (
                         <ImageComparator originalImage={resultImages[0]} resultImage={upscaledImage} />
                    )}
                    {!isLoading && !upscaledImage && resultImages.length === 1 && sourceImage &&(
                         <ImageComparator originalImage={sourceImage.objectURL} resultImage={resultImages[0]} />
                    )}
                     {!isLoading && resultImages.length > 1 && (
                        <ResultGrid images={resultImages} toolName="interior-render" onSendToViewSync={handleSendImageToSync} />
                    )}
                    {!isLoading && resultImages.length === 0 && (
                        <p className="text-text-secondary dark:text-gray-400 p-4 text-center">{sourceImage ? 'Kết quả render sẽ hiển thị ở đây' : 'Tải lên một ảnh để bắt đầu'}</p>
                    )}
                </div>
              </div>
        </div>
    );
};

export default InteriorGenerator;
