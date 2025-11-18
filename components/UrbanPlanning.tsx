import React, { useState, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import { FileData, Tool, AspectRatio } from '../types';
import { UrbanPlanningState } from '../state/toolState';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import ImageComparator from './ImageComparator';
import NumberOfImagesSelector from './common/NumberOfImagesSelector';
import ResultGrid from './common/ResultGrid';
import OptionSelector from './common/OptionSelector';
import AspectRatioSelector from './common/AspectRatioSelector';
import ImagePreviewModal from './common/ImagePreviewModal';

const viewTypeOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'phối cảnh mắt chim (bird\'s-eye view)', label: 'Phối cảnh mắt chim' },
    { value: 'phối cảnh từ trên cao góc 45 độ (aerial 45-degree view)', label: 'Phối cảnh trên cao (45°)' },
    { value: 'phối cảnh tầm mắt người đi bộ (street-level perspective)', label: 'Phối cảnh tầm mắt người' },
    { value: 'phối cảnh ven sông/ven biển (waterfront view)', label: 'Phối cảnh ven sông/biển' },
];

const densityOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'khu dân cư ngoại ô mật độ thấp', label: 'Ngoại ô mật độ thấp' },
    { value: 'khu phức hợp mật độ trung bình', label: 'Phức hợp mật độ trung bình' },
    { value: 'lõi đô thị mật độ cao', label: 'Trung tâm mật độ cao' },
    { value: 'khu công viên và cây xanh', label: 'Công viên cây xanh' },
];

const lightingOptions = [
    { value: 'none', label: 'Chưa chọn' },
    { value: 'bình minh dịu nhẹ', label: 'Ánh sáng bình minh' },
    { value: 'buổi trưa, trời xanh trong', label: 'Ánh sáng ban ngày' },
    { value: 'nắng chiều, nắng vàng cam', label: 'Ánh nắng chiều (giờ vàng)' },
    { value: 'buổi tối, đèn đô thị sáng rực', label: 'Ánh sáng ban đêm' },
    { value: 'khung cảnh u ám, có mây', label: 'Trời u ám, có mây' },
];

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

interface UrbanPlanningProps {
  state: UrbanPlanningState;
  onStateChange: (newState: Partial<UrbanPlanningState>) => void;
  onSendToViewSync: (image: FileData) => void;
}

const UrbanPlanning: React.FC<UrbanPlanningProps> = ({ state, onStateChange, onSendToViewSync }) => {
    const { 
        viewType, density, lighting, customPrompt, referenceImage, 
        sourceImage, isLoading, isUpscaling, error, resultImages, upscaledImage, 
        numberOfImages, aspectRatio 
    } = state;
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    const updatePrompt = useCallback((type: 'viewType' | 'density' | 'lighting', newValue: string, oldValue: string) => {
        const getPromptPart = (partType: string, value: string): string => {
            if (value === 'none' || !value) return '';
            switch (partType) {
                case 'viewType': return `tạo ra một ${value}`;
                case 'density': return `mô phỏng một ${value}`;
                case 'lighting': return `với ánh sáng ${value}`;
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

    const handleViewTypeChange = (newVal: string) => {
        updatePrompt('viewType', newVal, viewType);
        onStateChange({ viewType: newVal });
    };

    const handleDensityChange = (newVal: string) => {
        updatePrompt('density', newVal, density);
        onStateChange({ density: newVal });
    };

    const handleLightingChange = (newVal: string) => {
        updatePrompt('lighting', newVal, lighting);
        onStateChange({ lighting: newVal });
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

    const handleGenerate = async () => {
        if (!customPrompt.trim()) {
            onStateChange({ error: 'Lời nhắc (prompt) không được để trống.' });
            return;
        }
        onStateChange({ isLoading: true, error: null, resultImages: [], upscaledImage: null });
    
        // Logic branching based on sourceImage
        if (sourceImage) {
            // Image-to-Image Generation (from a site plan)
            const promptForService = `Generate a photorealistic urban planning render with a strict aspect ratio of ${aspectRatio}. Develop the provided 2D site plan into a 3D environment. Adapt the composition to fit this new frame. Do not add black bars or letterbox. The main creative instruction is: ${customPrompt}`;
            
            try {
                let results;
                if (referenceImage) {
                    const promptWithRef = `${promptForService} Also, take aesthetic inspiration (architectural style, materials, atmosphere) from the provided reference image.`;
                    results = await geminiService.editImageWithReference(promptWithRef, sourceImage, referenceImage, numberOfImages);
                } else {
                    results = await geminiService.editImage(promptForService, sourceImage, numberOfImages);
                }
                
                const imageUrls = results.map(r => r.imageUrl);
                onStateChange({ resultImages: imageUrls });
                
                imageUrls.forEach(url => {
                    historyService.addToHistory({
                        tool: Tool.UrbanPlanning,
                        prompt: promptForService,
                        sourceImageURL: sourceImage.objectURL,
                        resultImageURL: url,
                    });
                });
            } catch (err: any) {
                onStateChange({ error: err.message || 'Đã xảy ra lỗi không mong muốn.' });
            } finally {
                onStateChange({ isLoading: false });
            }
    
        } else {
            // Text-to-Image Generation
            const promptForService = `${customPrompt}, photorealistic urban planning, master plan rendering, high detail, masterpiece`;
            
            try {
                const imageUrls = await geminiService.generateImage(promptForService, aspectRatio, numberOfImages);
                onStateChange({ resultImages: imageUrls });
                
                imageUrls.forEach(url => {
                    historyService.addToHistory({
                        tool: Tool.UrbanPlanning,
                        prompt: promptForService,
                        resultImageURL: url,
                    });
                });
            } catch (err: any) {
                onStateChange({ error: err.message || 'Đã xảy ra lỗi không mong muốn.' });
            } finally {
                onStateChange({ isLoading: false });
            }
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

            const upscalePrompt = "Upscale this urban planning rendering to a high resolution. Enhance details like building facades, landscapes, textures, and lighting to make it look photorealistic and professional. Do not change the composition or the core design.";
            
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
        link.download = "urban-planning-render.png";
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
                <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Render Quy hoạch</h2>
                <p className="text-text-secondary dark:text-gray-300 mb-6">Mô tả chi tiết ý tưởng quy hoạch của bạn, hoặc tải lên bản vẽ mặt bằng tổng thể để AI trực quan hóa thành một không gian đô thị sống động.</p>
                
                {/* --- INPUTS --- */}
                <div className="space-y-6 bg-main-bg/50 dark:bg-dark-bg/50 p-6 rounded-xl border border-border-color dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Image Uploads (Left Column) */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">1. Tải Lên Mặt Bằng Tổng Thể (Tùy chọn)</label>
                                <ImageUpload onFileSelect={handleFileSelect} previewUrl={sourceImage?.objectURL}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Ảnh Tham Chiếu Phong Cách (Tùy chọn)</label>
                                <ImageUpload onFileSelect={handleReferenceFileSelect} previewUrl={referenceImage?.objectURL}/>
                            </div>
                        </div>

                        {/* Prompt and Options (Right Column) */}
                         <div className="space-y-4 flex flex-col">
                             <div>
                                <label htmlFor="custom-prompt-urban" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">2. Mô tả yêu cầu chính</label>
                                <textarea
                                    id="custom-prompt-urban"
                                    rows={4}
                                    className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                                    placeholder="Mô tả ý tưởng quy hoạch của bạn ở đây..."
                                    value={customPrompt}
                                    onChange={(e) => onStateChange({ customPrompt: e.target.value })}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleAutoPrompt}
                                    disabled={!sourceImage || isLoading || isUpscaling || isGeneratingPrompt}
                                    className="mt-2 w-full flex items-center justify-center gap-2 bg-accent-700 hover:bg-accent-800 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                                >
                                    {isGeneratingPrompt ? <Spinner /> : <SparklesIcon />}
                                    <span>{isGeneratingPrompt ? 'Đang tạo...' : 'Tạo tự động Prompt'}</span>
                                </button>
                             </div>
                            
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">3. Tinh chỉnh tùy chọn</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <OptionSelector id="view-type-selector" label="Loại phối cảnh" options={viewTypeOptions} value={viewType} onChange={handleViewTypeChange} disabled={isLoading} />
                                    <OptionSelector id="density-selector" label="Mật độ đô thị" options={densityOptions} value={density} onChange={handleDensityChange} disabled={isLoading} />
                                    <OptionSelector id="lighting-selector" label="Ánh sáng" options={lightingOptions} value={lighting} onChange={handleLightingChange} disabled={isLoading} />
                                </div>
                            </div>
                            
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <NumberOfImagesSelector value={numberOfImages} onChange={(val) => onStateChange({numberOfImages: val})} disabled={isLoading || isUpscaling} />
                               <AspectRatioSelector value={aspectRatio} onChange={(val) => onStateChange({aspectRatio: val})} disabled={isLoading || isUpscaling} />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !customPrompt.trim() || isUpscaling}
                        className="w-full flex justify-center items-center gap-3 bg-accent hover:bg-accent-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4"
                    >
                       {isLoading ? <><Spinner /> Đang Render...</> : 'Bắt đầu Render'}
                    </button>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
                </div>
            </div>

            {/* --- RESULTS VIEW --- */}
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-white">
                        {sourceImage ? 'So sánh Trước & Sau' : 'Kết quả Render'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {resultImages.length === 1 && !upscaledImage && (
                            <button
                                onClick={handleUpscale}
                                disabled={isUpscaling || isLoading}
                                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors"
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
                                    className="text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 transition-colors rounded-lg text-sm flex items-center gap-2"
                                    title="Chuyển ảnh này tới Đồng Bộ View để xử lý tiếp"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
                    {!isLoading && !upscaledImage && resultImages.length === 1 && sourceImage && (
                         <ImageComparator originalImage={sourceImage.objectURL} resultImage={resultImages[0]} />
                    )}
                     {!isLoading && !upscaledImage && resultImages.length === 1 && !sourceImage && (
                        <img src={resultImages[0]} alt="Generated Result" className="w-full h-full object-contain" />
                    )}
                     {!isLoading && resultImages.length > 1 && (
                        <ResultGrid images={resultImages} toolName="urban-plan-render" onSendToViewSync={handleSendImageToSync} />
                    )}
                    {!isLoading && resultImages.length === 0 && (
                        <p className="text-text-secondary dark:text-gray-400 p-4 text-center">{sourceImage ? 'Kết quả render sẽ hiển thị ở đây' : 'Nhập mô tả hoặc tải ảnh lên để bắt đầu'}</p>
                    )}
                </div>
              </div>
        </div>
    );
};

export default UrbanPlanning;