
import React, { useState } from 'react';
import { FileData, Tool, ImageResolution } from '../types';
import { UpscaleState } from '../state/toolState';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import ImagePreviewModal from './common/ImagePreviewModal';
import ResolutionSelector from './common/ResolutionSelector';

interface UpscaleProps {
    state: UpscaleState;
    onStateChange: (newState: Partial<UpscaleState>) => void;
    userCredits?: number;
    onDeductCredits?: (amount: number, description: string) => Promise<string>;
}

const Upscale: React.FC<UpscaleProps> = ({ state, onStateChange, userCredits = 0, onDeductCredits }) => {
    const { sourceImage, isLoading, error, upscaledImages, numberOfImages, resolution } = state;
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const upscalePrompt = "Upscale this image to a high resolution. Enhance the details, textures, and lighting to make it look photorealistic and professional. Do not change the composition or the core design.";
    
    // Calculate cost based on resolution
    const getCostPerImage = () => {
        switch (resolution) {
            case 'Standard': return 5;
            case '1K': return 15;
            case '2K': return 20;
            case '4K': return 30;
            default: return 5;
        }
    };
    
    const cost = numberOfImages * getCostPerImage();

    const handleResolutionChange = (val: ImageResolution) => {
        onStateChange({ resolution: val });
    };

    const handleUpscale = async () => {
        if (onDeductCredits && userCredits < cost) {
             onStateChange({ error: `Bạn không đủ credits. Cần ${cost} credits nhưng chỉ còn ${userCredits}. Vui lòng nạp thêm.` });
             return;
        }

        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải lên một hình ảnh để nâng cấp.' });
            return;
        }
        onStateChange({ isLoading: true, error: null, upscaledImages: [] });

        try {
             if (onDeductCredits) {
                await onDeductCredits(cost, `Upscale ảnh (${numberOfImages} ảnh) - ${resolution}`);
            }

            let results: { imageUrl: string }[] = [];

            // High Quality (Pro) Logic
            if (resolution === '1K' || resolution === '2K' || resolution === '4K') {
                const promises = Array.from({ length: numberOfImages }).map(async () => {
                    const images = await geminiService.generateHighQualityImage(upscalePrompt, '1:1', resolution, sourceImage || undefined);
                    return { imageUrl: images[0] };
                });
                results = await Promise.all(promises);
            } 
            // Standard (Flash) Logic
            else {
                results = await geminiService.editImage(upscalePrompt, sourceImage, numberOfImages);
            }

            const imageUrls = results.map(r => r.imageUrl);
            onStateChange({ upscaledImages: imageUrls });

            imageUrls.forEach(url => {
                historyService.addToHistory({
                    tool: Tool.Upscale,
                    prompt: "Nâng cấp chi tiết ảnh",
                    sourceImageURL: sourceImage.objectURL,
                    resultImageURL: url,
                });
            });
        } catch (err: any) {
            onStateChange({ error: err.message || 'Đã xảy ra lỗi không mong muốn.' });
        } finally {
            onStateChange({ isLoading: false });
        }
    };
    
    const handleFileSelect = (fileData: FileData | null) => {
        onStateChange({ sourceImage: fileData, upscaledImages: [] });
    }

    const handleDownload = () => {
        if (upscaledImages.length !== 1) return;
        const link = document.createElement('a');
        link.href = upscaledImages[0];
        link.download = "upscaled-image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-8">
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
            <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Upscale - Nâng Cấp Chi Tiết</h2>
                <p className="text-text-secondary dark:text-gray-300 mb-6">Tăng cường độ phân giải và làm sắc nét các chi tiết trong ảnh của bạn. Phù hợp để cải thiện chất lượng ảnh render hoặc ảnh chụp.</p>
                
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 border border-border-color dark:border-gray-700 rounded-xl p-6 flex flex-col items-center">
                    <div className="w-full max-w-lg">
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2 text-center">1. Tải Lên Ảnh Gốc Cần Nâng Cấp</label>
                        <ImageUpload onFileSelect={handleFileSelect} previewUrl={sourceImage?.objectURL} />
                    </div>
                     <div className="w-full max-w-lg mt-6">
                        <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({ numberOfImages: val })} disabled={isLoading} />
                    </div>
                    
                    <div className="w-full max-w-lg mt-6">
                        <ResolutionSelector value={resolution} onChange={handleResolutionChange} disabled={isLoading} />
                    </div>

                    <div className="w-full max-w-lg mt-6">
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
                            onClick={handleUpscale}
                            disabled={isLoading || !sourceImage || userCredits < cost}
                            className="w-full flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            {isLoading ? <><Spinner /> Đang nâng cấp...</> : 'Bắt Đầu Nâng Cấp'}
                        </button>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm max-w-lg w-full">{error}</div>}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-text-primary dark:text-white">So Sánh Kết Quả</h3>
                     {upscaledImages.length === 1 && (
                         <div className="flex items-center gap-2">
                             <button
                                onClick={() => setPreviewImage(upscaledImages[0])}
                                className="text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                Phóng to
                            </button>
                             <button onClick={handleDownload} className="text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm">
                                Tải xuống Ảnh Nâng Cấp
                            </button>
                        </div>
                    )}
                </div>
                <div className="w-full aspect-video bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    {isLoading && <Spinner />}
                    
                    {!isLoading && upscaledImages.length === 1 && sourceImage && (
                        <ImageComparator
                            originalImage={sourceImage.objectURL}
                            resultImage={upscaledImages[0]}
                        />
                    )}
                    
                    {!isLoading && upscaledImages.length > 1 && (
                        <ResultGrid images={upscaledImages} toolName="upscale" />
                    )}

                    {!isLoading && upscaledImages.length === 0 && (
                         <p className="text-text-secondary dark:text-gray-400 text-center p-4">{sourceImage ? 'Kết quả nâng cấp sẽ hiển thị ở đây.' : 'Tải lên một ảnh để bắt đầu.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upscale;
