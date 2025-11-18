import React, { useState } from 'react';
import { FileData, Tool } from '../types';
import { StagingState } from '../state/toolState';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import MultiImageUpload from './common/MultiImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import ImagePreviewModal from './common/ImagePreviewModal';

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

interface StagingProps {
    state: StagingState;
    onStateChange: (newState: Partial<StagingState>) => void;
}

const Staging: React.FC<StagingProps> = ({ state, onStateChange }) => {
    const { prompt, sceneImage, objectImages, isLoading, error, resultImages, numberOfImages } = state;
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    const handleAutoPrompt = async () => {
        if (!sceneImage) {
            onStateChange({ error: 'Vui lòng tải ảnh không gian lên trước khi tạo prompt tự động.' });
            return;
        }
        setIsGeneratingPrompt(true);
        onStateChange({ error: null });
        try {
            const generatedPrompt = await geminiService.generatePromptFromImageAndText(sceneImage, prompt);
            onStateChange({ prompt: generatedPrompt });
        } catch (err: any) {
            onStateChange({ error: err.message });
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) {
            onStateChange({ error: 'Vui lòng nhập mô tả yêu cầu.' });
            return;
        }
        if (!sceneImage) {
            onStateChange({ error: 'Vui lòng tải lên ảnh không gian.' });
            return;
        }
        if (objectImages.length === 0) {
            onStateChange({ error: 'Vui lòng tải lên ít nhất một ảnh đồ vật cần đặt vào.' });
            return;
        }

        onStateChange({ isLoading: true, error: null, resultImages: [] });

        try {
            const fullPrompt = `Integrate the objects from the following images into the main scene image. Follow these instructions for placement and style: ${prompt}. Ensure the objects are realistically scaled, lit, and shadowed to match the environment of the main scene.`;
            const results = await geminiService.generateStagingImage(fullPrompt, sceneImage, objectImages, numberOfImages);
            const imageUrls = results.map(r => r.imageUrl);
            onStateChange({ resultImages: imageUrls });

            imageUrls.forEach(url => {
                 historyService.addToHistory({
                    tool: Tool.Staging,
                    prompt: prompt,
                    sourceImageURL: sceneImage.objectURL,
                    resultImageURL: url,
                });
            });

        } catch (err: any) {
            onStateChange({ error: err.message || 'Đã xảy ra lỗi không mong muốn.' });
        } finally {
            onStateChange({ isLoading: false });
        }
    };

    const handleSceneFileSelect = (fileData: FileData | null) => {
        onStateChange({ sceneImage: fileData, resultImages: [] });
    };
    
    const handleObjectsFileChange = (files: FileData[]) => {
        onStateChange({ objectImages: files });
    };

    const handleDownload = () => {
        if (resultImages.length !== 1) return;
        const link = document.createElement('a');
        link.href = resultImages[0];
        link.download = "ai-staging.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
            <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Staging</h2>
            <p className="text-text-secondary dark:text-gray-300 mb-6">Tải lên ảnh không gian và ảnh của một hoặc nhiều đồ vật (nội thất, cây cối,...). AI sẽ đặt các đồ vật đó vào không gian một cách tự nhiên theo mô tả của bạn.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- INPUTS --- */}
                <div className="space-y-6 bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">1. Tải Lên Ảnh Không Gian (Phòng, sân vườn...)</label>
                        <ImageUpload onFileSelect={handleSceneFileSelect} id="scene-image-upload-staging" previewUrl={sceneImage?.objectURL} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">2. Tải Lên Ảnh Các Đồ Vật (Tối đa 12 ảnh)</label>
                        <MultiImageUpload onFilesChange={handleObjectsFileChange} maxFiles={12} />
                    </div>
                    <div>
                        <label htmlFor="prompt-staging" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">3. Mô tả vị trí và cách sắp xếp</label>
                        <textarea
                            id="prompt-staging"
                            rows={3}
                            className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                            placeholder="VD: Đặt chiếc ghế sofa này vào giữa phòng khách, đặt chậu cây ở góc phải..."
                            value={prompt}
                            onChange={(e) => onStateChange({ prompt: e.target.value })}
                        />
                        <button
                            onClick={handleAutoPrompt}
                            disabled={!sceneImage || isLoading || isGeneratingPrompt}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            {isGeneratingPrompt ? <Spinner /> : <SparklesIcon />}
                            <span>{isGeneratingPrompt ? 'Đang tạo...' : 'Tạo tự động Prompt'}</span>
                        </button>
                    </div>
                     <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({ numberOfImages: val })} disabled={isLoading} />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !sceneImage || objectImages.length === 0}
                        className="w-full flex justify-center items-center gap-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        {isLoading ? <><Spinner /> Đang xử lý...</> : 'Bắt đầu Staging'}
                    </button>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
                </div>

                {/* --- RESULTS --- */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-text-primary dark:text-white">So sánh Trước & Sau</h3>
                        {resultImages.length === 1 && (
                             <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewImage(resultImages[0])}
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
                            </div>
                        )}
                    </div>
                    <div className="w-full aspect-video bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700 flex items-center justify-center overflow-hidden">
                        {isLoading && <Spinner />}
                        
                        {!isLoading && resultImages.length === 1 && sceneImage && (
                            <ImageComparator
                                originalImage={sceneImage.objectURL}
                                resultImage={resultImages[0]}
                            />
                        )}
                        
                        {!isLoading && resultImages.length > 1 && (
                            <ResultGrid images={resultImages} toolName="staging" />
                        )}

                        {!isLoading && resultImages.length === 0 && (
                             <p className="text-text-secondary dark:text-gray-400 text-center p-4">{sceneImage ? 'Kết quả sẽ được hiển thị ở đây.' : 'Tải lên ảnh để bắt đầu.'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Staging;