
import React, { useState, useEffect } from 'react';
import * as historyService from '../services/historyService';
import { HistoryItem, Tool } from '../types';
import Spinner from './Spinner';

const toolDisplayNames: Record<string, string> = {
    [Tool.FloorPlan]: 'Render Mặt Bằng',
    [Tool.Renovation]: 'Cải Tạo AI',
    [Tool.ArchitecturalRendering]: 'Render Kiến trúc',
    [Tool.InteriorRendering]: 'Render Nội thất',
    [Tool.UrbanPlanning]: 'Render Quy hoạch',
    [Tool.LandscapeRendering]: 'Render Sân vườn',
    [Tool.AITechnicalDrawings]: 'Bản vẽ kỹ thuật AI',
    [Tool.SketchConverter]: 'Biến ảnh thành Sketch',
    [Tool.ViewSync]: 'Đồng Bộ View',
    [Tool.MaterialSwap]: 'Thay Vật Liệu AI',
    [Tool.VideoGeneration]: 'Tạo Video AI',
    [Tool.ImageEditing]: 'Chỉnh Sửa Ảnh AI',
    [Tool.Upscale]: 'Upscale AI',
    [Tool.Moodboard]: 'Tạo ảnh Moodboard',
    [Tool.History]: 'Lịch sử',
    [Tool.FengShui]: 'Phân tích Phong thủy',
};

const HistoryPanel: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const items = await historyService.getHistory();
                setHistory(items);
            } catch (error) {
                console.error("Failed to load history from Supabase", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, []);

    const handleClearHistory = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử không? Hành động này không thể hoàn tác.')) {
            setIsLoading(true);
            try {
                await historyService.clearHistory();
                setHistory([]);
            } catch (error) {
                alert("Có lỗi xảy ra khi xóa lịch sử.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
        // Critical: Stop propagation to prevent modal from opening
        e.stopPropagation();
        e.preventDefault(); 

        if (window.confirm('Bạn có chắc chắn muốn xóa mục này không?')) {
            setIsDeletingId(id);
            try {
                await historyService.deleteHistoryItem(id);
                setHistory(prev => prev.filter(item => item.id !== id));
            } catch (error: any) {
                console.error("Delete error:", error);
                alert(`Không thể xóa mục này: ${error.message || "Lỗi không xác định"}`);
            } finally {
                setIsDeletingId(null);
            }
        }
    };
    
    const handleModalDelete = async () => {
        if (!selectedItem) return;
        if (window.confirm('Bạn có chắc chắn muốn xóa mục này không?')) {
            setIsDeletingId(selectedItem.id);
            try {
                await historyService.deleteHistoryItem(selectedItem.id);
                setHistory(prev => prev.filter(item => item.id !== selectedItem.id));
                setSelectedItem(null);
            } catch (error: any) {
                 console.error("Delete error:", error);
                 alert(`Không thể xóa mục này: ${error.message || "Lỗi không xác định"}`);
            } finally {
                setIsDeletingId(null);
            }
        }
    };

    const renderModal = () => {
        if (!selectedItem) return null;

        const handleDownload = () => {
            if (!selectedItem) return;
            const url = selectedItem.media_url || selectedItem.resultImageURL || selectedItem.resultVideoURL;
            if (!url) return;
            
            const isVideo = selectedItem.media_type === 'video' || !!selectedItem.resultVideoURL;

            const link = document.createElement('a');
            link.href = url;
            link.download = isVideo
                ? `ai-mastery-render-${selectedItem.id}.mp4`
                : `ai-mastery-render-${selectedItem.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        // Backwards compatibility for display
        const displayUrl = selectedItem.media_url || selectedItem.resultImageURL || selectedItem.resultVideoURL;
        const sourceUrl = selectedItem.source_url || selectedItem.sourceImageURL;
        const isVideo = selectedItem.media_type === 'video' || !!selectedItem.resultVideoURL;
        const dateString = selectedItem.created_at 
            ? new Date(selectedItem.created_at).toLocaleString() 
            : (selectedItem.timestamp ? new Date(selectedItem.timestamp).toLocaleString() : '');

        return (
            <div 
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedItem(null)}
            >
                <div 
                    className="bg-main-bg dark:bg-gray-800 p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Kết Quả</h3>
                        {isVideo ? (
                            <video controls autoPlay src={displayUrl} className="w-full rounded-lg bg-black" />
                        ) : (
                            displayUrl && <img src={displayUrl} alt="Kết quả đã tạo" className="w-full rounded-lg" />
                        )}
                    </div>
                    <div className="flex-1 space-y-4">
                         {sourceUrl && (
                             <div>
                                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Ảnh Gốc</h3>
                                <img src={sourceUrl} alt="Ảnh gốc" className="w-full rounded-lg" />
                            </div>
                         )}
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-gray-300">Công cụ</h3>
                            <p className="text-text-primary dark:text-gray-100">{toolDisplayNames[selectedItem.tool] || selectedItem.tool}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-gray-300">Prompt</h3>
                            <p className="text-text-primary dark:text-gray-100 bg-surface dark:bg-gray-700/50 p-3 rounded-md text-sm break-words max-h-40 overflow-y-auto">{selectedItem.prompt}</p>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-gray-300">Thời gian</h3>
                            <p className="text-text-primary dark:text-gray-100">{dateString}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={handleModalDelete}
                                disabled={isDeletingId === selectedItem.id}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex justify-center"
                            >
                                {isDeletingId === selectedItem.id ? <Spinner /> : 'Xóa'}
                            </button>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleDownload}
                                className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Tải xuống
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderModal()}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary dark:text-white">Lịch sử ảnh đã tạo</h2>
                    <p className="text-text-secondary dark:text-gray-300">Xem lại các tác phẩm bạn đã tạo. Dữ liệu được lưu trữ trên đám mây.</p>
                </div>
                {history.length > 0 && !isLoading && (
                    <button
                        onClick={handleClearHistory}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                        Xóa tất cả
                    </button>
                )}
            </div>

            {isLoading ? (
                 <div className="text-center py-16 bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700">
                    <div className="flex justify-center items-center">
                        <Spinner />
                    </div>
                    <p className="mt-4 text-sm text-text-secondary dark:text-gray-300">Đang tải lịch sử từ hệ thống...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-16 bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-medium text-text-primary dark:text-white">Chưa có gì ở đây</h3>
                    <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">Bắt đầu tạo ảnh và chúng sẽ xuất hiện ở đây.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {history.map(item => {
                         const displayUrl = item.media_url || item.resultImageURL || item.resultVideoURL;
                         const isVideo = item.media_type === 'video' || !!item.resultVideoURL;
                         const dateString = item.created_at 
                            ? new Date(item.created_at).toLocaleDateString()
                            : (item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '');
                         
                         const isDeleting = isDeletingId === item.id;

                         return (
                            <div 
                                key={item.id} 
                                className="group relative aspect-square bg-main-bg dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer shadow-lg border border-border-color/50 dark:border-gray-700/50 hover:border-accent dark:hover:border-accent transition-all" 
                                onClick={() => setSelectedItem(item)}
                            >
                                {isVideo ? (
                                    <>
                                        <video 
                                            src={displayUrl} 
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                            muted 
                                            autoPlay 
                                            loop 
                                            playsInline
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/70" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </>
                                ) : (
                                    displayUrl && <img src={displayUrl} alt={item.prompt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end pointer-events-none">
                                    <h4 className="font-bold text-white text-sm truncate">{toolDisplayNames[item.tool] || item.tool}</h4>
                                    <p className="text-xs text-gray-300">{dateString}</p>
                                </div>

                                {isDeleting ? (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => handleDeleteItem(item.id, e)}
                                        className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 backdrop-blur-sm shadow-md"
                                        title="Xóa mục này"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;