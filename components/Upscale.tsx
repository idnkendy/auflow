
import React, { useState } from 'react';
import { FileData, Tool } from '../types';
import { UpscaleState } from '../state/toolState';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import ImagePreviewModal from './common/ImagePreviewModal';

interface UpscaleProps {
    state: UpscaleState;
    onStateChange: (newState: Partial<UpscaleState>) => void;
    userCredits?: number;
    onDeductCredits?: (amount: number, description: string) => Promise<string>;
}

const Upscale: React.FC<UpscaleProps> = ({ state, onStateChange, userCredits, onDeductCredits }) => {
    const { sourceImage, isLoading, error, upscaledImages, numberOfImages } = state;
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const upscalePrompt = "Upscale this image to a high resolution. Enhance the details, textures, and lighting to make it look photorealistic and professional. Do not change the composition or the core design.";

    const handleUpscale = async () => {
        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải lên một hình ảnh để nâng cấp.' });
            return;
        }
        onStateChange({ isLoading: true, error: null, upscaledImages: [] });

        try {
            const results = await geminiService.editImage(upscalePrompt, sourceImage, numberOfImages);
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
                        <button
                            onClick={handleUpscale}
                            disabled={isLoading || !sourceImage}
                            className="w-full flex justify-center items-center gap-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
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
