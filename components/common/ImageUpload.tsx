
import React, { useCallback, useState, useMemo, useRef } from 'react';
import { FileData } from '../../types';

interface ImageUploadProps {
  onFileSelect: (fileData: FileData | null) => void;
  id?: string;
  previewUrl?: string | null;
  maskPreviewUrl?: string | null;
  directionPreviewUrl?: string | null;
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, id, previewUrl, maskPreviewUrl, directionPreviewUrl }) => {
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uniqueId = useMemo(() => id || `file-upload-${Math.random().toString(36).substr(2, 9)}`, [id]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setError('Chỉ chấp nhận các tệp PNG, JPG, hoặc WEBP.');
                onFileSelect(null);
                return;
            }
             if (file.size > 30 * 1024 * 1024) { // 30MB size limit
                setError('Kích thước tệp không được vượt quá 30MB.');
                onFileSelect(null);
                return;
            }

            setError(null);
            try {
                const base64 = await fileToBase64(file);
                const objectURL = URL.createObjectURL(file);
                onFileSelect({ 
                    base64, 
                    mimeType: file.type, 
                    objectURL
                });
            } catch (err) {
                setError('Không thể đọc tệp hình ảnh.');
                onFileSelect(null);
            }
        }
    }, [onFileSelect]);
    
    const handleRemove = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onFileSelect(null);
    };

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            const mockEvent = {
                target: { files }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(mockEvent);
        }
    }, [handleFileChange]);

    const handleContainerClick = () => {
        inputRef.current?.click();
    };


    if (previewUrl) {
        return (
            <div className="relative group w-full aspect-video bg-main-bg dark:bg-gray-800 rounded-md overflow-hidden border border-border-color dark:border-gray-700">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                {maskPreviewUrl && (
                    <img 
                        src={maskPreviewUrl} 
                        alt="Mask Preview" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                    />
                )}
                {directionPreviewUrl && (
                    <img 
                        src={directionPreviewUrl} 
                        alt="Direction Preview" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                    />
                )}
                
                {/* Close Button (Top-Right) */}
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full transition-all shadow-sm z-10"
                    title="Xóa ảnh"
                >
                    <XIcon />
                </button>

                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                     <button
                        onClick={handleContainerClick}
                        className="pointer-events-auto bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                        Thay đổi ảnh
                    </button>
                </div>
                 <input
                    ref={inputRef}
                    id={uniqueId}
                    name={uniqueId}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
        );
    }
    
    return (
        <div>
            <div 
                className="relative w-full aspect-video bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-600 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-accent transition-all duration-300"
                onClick={handleContainerClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                    <p className="font-semibold text-text-primary dark:text-gray-300">Nhấp để tải ảnh lên</p>
                    <p className="text-sm text-text-secondary dark:text-gray-500">hoặc kéo và thả</p>
                    <p className="text-xs text-gray-400 pt-1">PNG, JPG, WEBP (Tối đa 30MB)</p>
                </div>
                <input
                    ref={inputRef}
                    id={uniqueId}
                    name={uniqueId}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default ImageUpload;
