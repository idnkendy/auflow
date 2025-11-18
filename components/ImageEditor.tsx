import React, { useState } from 'react';
import { FileData, Tool } from '../types';
import { ImageEditorState } from '../state/toolState';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ResultGrid from './common/ResultGrid';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import MaskingModal from './MaskingModal';
import ImageComparator from './ImageComparator';
import ImagePreviewModal from './common/ImagePreviewModal';
import MultiImageUpload from './common/MultiImageUpload';

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

interface ImageEditorProps {
    state: ImageEditorState;
    onStateChange: (newState: Partial<ImageEditorState>) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ state, onStateChange }) => {
    const { prompt, sourceImage, maskImage, referenceImages, isLoading, error, resultImages, numberOfImages } = state;
    
    const [isMaskingModalOpen, setIsMaskingModalOpen] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);


    const handleFileSelect = (fileData: FileData | null) => {
        onStateChange({
            sourceImage: fileData,
            resultImages: [],
            maskImage: null,
        });
    };

    const handleReferenceFilesChange = (files: FileData[]) => {
        onStateChange({ referenceImages: files });
    };

    const handleAutoPrompt = async () => {
        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải ảnh lên trước khi tạo prompt tự động.' });
            return;
        }
        setIsGeneratingPrompt(true);
        onStateChange({ error: null });
        try {
            const generatedPrompt = await geminiService.generatePromptFromImageAndText(sourceImage, prompt);
            onStateChange({ prompt: generatedPrompt });
        } catch (err: any) {
            onStateChange({ error: err.message });
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) {
            onStateChange({ error: 'Vui lòng nhập mô tả yêu cầu chỉnh sửa.' });
            return;
        }
        if (!sourceImage) {
            onStateChange({ error: 'Vui lòng tải lên một ảnh để chỉnh sửa.' });
            return;
        }

        onStateChange({ isLoading: true, error: null, resultImages: [] });

        try {
            let results;
            if (referenceImages && referenceImages.length > 0) {
                if (maskImage) {
                    results = await geminiService.editImageWithMaskAndMultipleReferences(prompt, sourceImage, maskImage, referenceImages, numberOfImages);
                } else {
                    results = await geminiService.editImageWithMultipleReferences(prompt, sourceImage, referenceImages, numberOfImages);
                }
            } else if (maskImage) {
                results = await geminiService.editImageWithMask(prompt, sourceImage, maskImage, numberOfImages);
            } else {
                results = await geminiService.editImage(prompt, sourceImage, numberOfImages);
            }
            const imageUrls = results.map(r => r.imageUrl);
            onStateChange({ resultImages: imageUrls });

            imageUrls.forEach(url => {
                historyService.addToHistory({
                    tool: Tool.ImageEditing,
                    prompt: prompt,
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

    const handleApplyMask = (mask: FileData) => {
        onStateChange({ maskImage: mask });
        setIsMaskingModalOpen(false);
    };

    const handleRemoveMask = () => {
        onStateChange({ maskImage: null });
    };

    return (
        <div>
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
            {isMaskingModalOpen && sourceImage && (
                <MaskingModal
                    image={sourceImage}
                    onClose={() => setIsMaskingModalOpen(false)}
                    onApply={handleApplyMask}
                />
            )}
            <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Chỉnh Sửa Ảnh</h2>
            <p className="text-text-secondary dark:text-gray-300 mb-6">Tải lên một bức ảnh và mô tả những thay đổi bạn muốn. Bạn cũng có thể dùng công cụ mask để chỉ định vùng cần chỉnh sửa.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- INPUTS --- */}
                <div className="space-y-6 flex flex-col">
                    <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">1. Tải Lên Ảnh Gốc</label>
                        <ImageUpload onFileSelect={handleFileSelect} previewUrl={sourceImage?.objectURL} />
                         {sourceImage && (
                            <div className="mt-4">
                                <p className="text-sm text-text-secondary dark:text-gray-400 mb-2">Tùy chọn vùng chọn:</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsMaskingModalOpen(true)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                        {maskImage ? 'Sửa vùng chọn' : 'Vẽ vùng chọn'}
                                    </button>
                                    {maskImage && (
                                        <button
                                            onClick={handleRemoveMask}
                                            className="bg-red-600 hover:bg-red-700 text-white font-semibold p-2 rounded-lg transition-colors"
                                            title="Xóa vùng chọn"
                                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    )}
                                </div>
                                {maskImage && <p className="text-xs text-green-500 dark:text-green-400 mt-2">Đã áp dụng vùng chọn.</p>}
                            </div>
                        )}
                    </div>
                     <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">2. Tải Ảnh Tham Chiếu Phong Cách (Tùy chọn, tối đa 10)</label>
                        <MultiImageUpload onFilesChange={handleReferenceFilesChange} maxFiles={10} />
                    </div>
                    <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                        <label htmlFor="prompt-edit" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">3. Mô tả yêu cầu chỉnh sửa</label>
                        <textarea
                            id="prompt-edit"
                            rows={3}
                            className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                            placeholder="VD: Xóa người đàn ông ở phía bên trái..."
                            value={prompt}
                            onChange={(e) => onStateChange({ prompt: e.target.value })}
                        />
                        <button
                            onClick={handleAutoPrompt}
                            disabled={!sourceImage || isLoading || isGeneratingPrompt}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            {isGeneratingPrompt ? <Spinner /> : <SparklesIcon />}
                            <span>{isGeneratingPrompt ? 'Đang tạo...' : 'Tạo tự động Prompt'}</span>
                        </button>
                    </div>
                    <div className="flex-grow"></div>
                     <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                        <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({ numberOfImages: val })} disabled={isLoading} />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !sourceImage}
                        className="w-full flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        {isLoading ? <><Spinner /> Đang chỉnh sửa...</> : 'Bắt đầu Chỉnh Sửa'}
                    </button>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
                </div>

                {/* --- RESULTS --- */}
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-text-primary dark:text-white">So sánh Trước & Sau</h3>
                         {resultImages.length === 1 && (
                            <button
                                onClick={() => setPreviewImage(resultImages[0])}
                                className="text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                Phóng to
                            </button>
                        )}
                    </div>
                    <div className="w-full aspect-video bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700 flex items-center justify-center overflow-hidden">
                       {isLoading && <Spinner />}
                       {!isLoading && resultImages.length === 1 && sourceImage && (
                            <ImageComparator originalImage={sourceImage.objectURL} resultImage={resultImages[0]} />
                       )}
                       {!isLoading && resultImages.length > 1 && (
                            <ResultGrid images={resultImages} toolName="image-edit" />
                       )}
                       {!isLoading && resultImages.length === 0 && (
                            <p className="text-text-secondary dark:text-gray-400 p-4 text-center">{sourceImage ? 'Kết quả chỉnh sửa sẽ hiển thị ở đây' : 'Tải lên một ảnh để bắt đầu'}</p>
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;