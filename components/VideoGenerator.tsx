
import React, { useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import * as jobService from '../services/jobService';
import { refundCredits } from '../services/paymentService';
import { FileData, Tool } from '../types';
import { VideoGeneratorState } from '../state/toolState';
import Spinner from './Spinner';
import ImageUpload from './common/ImageUpload';
import { supabase } from '../services/supabaseClient';

const loadingMessages = [
    "Đang khởi tạo các photon ánh sáng...",
    "Đang render các bóng đổ thực tế...",
    "Đang sắp xếp các pixel thành một kiệt tác...",
    "AI đang uống một chút cà phê để sáng tạo...",
    "Đang tính toán động lực học chất lỏng cho hồ bơi...",
    "Việc này có thể mất vài phút, hãy kiên nhẫn nhé...",
];

const exteriorSuggestions = [
    { label: 'Tiếp Cận Công Trình Từ Xa (Flycam)', prompt: 'Một video flycam bay chậm rãi tiến lại gần công trình từ xa.' },
    { label: 'Bay Vòng Quanh Toàn Cảnh (Orbit)', prompt: 'Một video flycam bay vòng quanh công trình để thể hiện mọi góc cạnh.' },
    { label: 'Góc Nhìn Thấp Hùng Vĩ (Low Angle)', prompt: 'Một video quay từ góc thấp, di chuyển camera từ từ lên cao để thể hiện sự hoành tráng.' },
    { label: 'Time-lapse Chuyển Giao Ngày Đêm', prompt: 'Một video time-lapse cho thấy sự thay đổi ánh sáng từ ngày sang đêm trên công trình.' },
    { label: 'Góc Nhìn Người Đi Bộ Tiếp Cận', prompt: 'Một video mô phỏng góc nhìn người đi bộ tiến lại gần cổng chính của công trình.' },
    { label: 'Nâng Cao Tầm Nhìn (Crane Shot)', prompt: 'Một video quay từ góc thấp, di chuyển camera thẳng đứng lên cao giống như một cần cẩu (crane shot), thể hiện sự cao lớn của công trình.' },
    { label: 'Hiệu Ứng Vertigo (Dolly Zoom)', prompt: 'Một video sử dụng hiệu ứng dolly zoom, trong đó camera di chuyển ra xa trong khi ống kính zoom vào, giữ nguyên kích thước công trình nhưng thay đổi phối cảnh nền.' },
    { label: 'Hyper-lapse Dòng Thời Gian Chuyển Động', prompt: 'Một video hyper-lapse (time-lapse di chuyển) tiến lại gần công trình, cho thấy sự nhộn nhịp của xe cộ và người đi bộ xung quanh.' },
    { label: 'Đường Bay Cong Giờ Vàng (Arc shot)', prompt: 'Một video flycam bay theo một đường cong rộng trong giờ vàng (bình minh hoặc hoàng hôn), với ánh nắng ấm áp chiếu xiên lên mặt tiền công trình.' },
    { label: 'Hiện Ra Từ Sau Vật Cản (Reveal Shot)', prompt: 'Một video flycam bay vòng quanh, ban đầu bị che khuất bởi cây cối hoặc một công trình khác, sau đó dần dần hiện ra toàn bộ công trình.' },
];

const interiorSuggestions = [
    { label: 'Lia Máy Quét Toàn Cảnh Phòng (Pan)', prompt: 'Một video lia máy quay chậm rãi từ trái sang phải để bao quát toàn bộ không gian phòng.' },
    { label: 'Bước Vào Không Gian (Walk-in)', prompt: 'Một video mô phỏng góc nhìn người đi bộ từ từ bước vào phòng từ cửa chính.' },
    { label: 'Cận Cảnh Chi Tiết Nội Thất (Zoom)', prompt: 'Một video tập trung zoom vào một chi tiết nội thất đặc sắc (VD: bộ sofa, bàn ăn, đèn trang trí).' },
    { label: 'Hướng Nhìn Ra Cửa Sổ (Window View)', prompt: 'Một video di chuyển camera hướng về phía cửa sổ lớn, thể hiện khung cảnh bên ngoài.' },
    { label: 'Bao Quát Từ Trần Xuống (Top-down)', prompt: 'Một video quay từ trên cao xuống, bao quát toàn bộ layout và cách bố trí nội thất.' },
    { label: 'Tập Trung Vào Chi Tiết (Push-in)', prompt: 'Một video di chuyển camera chậm rãi từ góc rộng của căn phòng và tiến thẳng vào một chi tiết cụ thể, như một bức tranh hoặc một lọ hoa.' },
    { label: 'Mở Rộng Ra Toàn Cảnh (Pull-back)', prompt: 'Một video bắt đầu từ một cảnh quay cận cảnh một đồ vật, sau đó từ từ kéo camera ra xa để tiết lộ toàn bộ không gian nội thất.' },
    { label: 'Di Chuyển Theo Lối Đi (Follow Path)', prompt: 'Một video mô phỏng góc nhìn người đi bộ di chuyển theo một con đường tự nhiên trong nhà, ví dụ từ phòng khách đến nhà bếp.' },
    { label: 'Lướt Theo Chi Tiết Kiến Trúc (Detail Pan)', prompt: 'Một video lia máy quay dọc theo một chi tiết kiến trúc, như một trần nhà độc đáo, một hệ lam trang trí, hoặc một bức tường có vật liệu đặc biệt.' },
    { label: 'Time-lapse Vệt Nắng Trong Phòng', prompt: 'Một video time-lapse quay cảnh ánh nắng mặt trời di chuyển qua căn phòng, tạo ra các vệt sáng và bóng đổ thay đổi trên đồ đạc và sàn nhà.' },
];

const FilmIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
);

interface VideoGeneratorProps {
    state: VideoGeneratorState;
    onStateChange: (newState: Partial<VideoGeneratorState>) => void;
    userCredits?: number;
    onDeductCredits?: (amount: number, description: string) => Promise<string>;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ state, onStateChange, userCredits = 0, onDeductCredits }) => {
    const { prompt, startImage, isLoading, loadingMessage, error, generatedVideoUrl, mode } = state;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            interval = setInterval(() => {
                const currentIndex = loadingMessages.indexOf(loadingMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                onStateChange({ loadingMessage: loadingMessages[nextIndex] });
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading, loadingMessage, onStateChange]);

    const handleSuggestionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPrompt = e.target.value;
        if (selectedPrompt) {
            const newPrompt = prompt.trim() ? `${prompt.trim()}. ${selectedPrompt}` : selectedPrompt;
            onStateChange({ prompt: newPrompt });
            e.target.value = ""; // Reset dropdown after selection
        }
    };

    const cost = 50;

    const handleGenerate = async () => {
        if (onDeductCredits && userCredits < cost) {
             onStateChange({ error: `Bạn không đủ credits. Cần ${cost} credits nhưng chỉ còn ${userCredits}. Vui lòng nạp thêm.` });
             return;
        }

        if (!prompt) {
            onStateChange({ error: 'Vui lòng nhập một mô tả.' });
            return;
        }
        onStateChange({ 
            isLoading: true, 
            error: null, 
            generatedVideoUrl: null, 
            loadingMessage: loadingMessages[0] 
        });

        let jobId: string | null = null;
        let logId: string | null = null;

        try {
            if (onDeductCredits) {
                logId = await onDeductCredits(cost, "Tạo video AI");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user && logId) {
                 jobId = await jobService.createJob({
                    user_id: user.id,
                    tool_id: Tool.VideoGeneration,
                    prompt: prompt,
                    cost: cost,
                    usage_log_id: logId
                });
            }

            if (jobId) await jobService.updateJobStatus(jobId, 'processing');

            // Pass jobId to generateVideo
            const url = await geminiService.generateVideo(prompt, startImage || undefined, jobId || undefined);
            onStateChange({ generatedVideoUrl: url });

            if (jobId) await jobService.updateJobStatus(jobId, 'completed', url);

            historyService.addToHistory({
                tool: Tool.VideoGeneration,
                prompt,
                sourceImageURL: startImage?.objectURL,
                resultVideoURL: url,
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
                await refundCredits(user.id, cost, `Hoàn tiền: Lỗi khi tạo video (${errorMessage})`);
             }

        } finally {
            onStateChange({ isLoading: false });
        }
    };

    const handleDownload = () => {
        if (!generatedVideoUrl) return;

        const link = document.createElement('a');
        link.href = generatedVideoUrl;
        link.download = "generated-video.mp4";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">AI Tạo Video</h2>
            <p className="text-text-secondary dark:text-gray-300 mb-6">Tạo các video chuyển động, fly-through, hoặc diễn hoạt kiến trúc từ mô tả hoặc hình ảnh ban đầu.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* --- LEFT COLUMN: INPUTS --- */}
                <div className="space-y-6">
                     <div>
                        <label htmlFor="prompt-video" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">1. Mô tả (Prompt)</label>
                        <textarea
                            id="prompt-video"
                            rows={4}
                            className="w-full bg-main-bg dark:bg-gray-800 border border-border-color dark:border-gray-700 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                            placeholder="VD: Một video fly-through qua một khu rừng nhiệt đới, hướng tới một căn nhà gỗ hiện đại..."
                            value={prompt}
                            onChange={(e) => onStateChange({ prompt: e.target.value })}
                        />
                    </div>

                    <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700">
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-3">2. Thêm gợi ý chuyển động (Tùy chọn)</label>
                        <div className="flex items-center gap-2 bg-main-bg dark:bg-gray-800 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => onStateChange({ mode: 'exterior' })}
                                disabled={isLoading}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-main-bg dark:focus:ring-offset-gray-800 focus:ring-accent disabled:opacity-50 ${
                                    mode === 'exterior' ? 'bg-accent text-white shadow' : 'bg-transparent text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Ngoại thất
                            </button>
                            <button
                                onClick={() => onStateChange({ mode: 'interior' })}
                                disabled={isLoading}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-main-bg dark:focus:ring-offset-gray-800 focus:ring-accent disabled:opacity-50 ${
                                    mode === 'interior' ? 'bg-accent text-white shadow' : 'bg-transparent text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Nội thất
                            </button>
                        </div>
                         <div className="relative">
                            <select
                                onChange={handleSuggestionSelect}
                                disabled={isLoading}
                                className="w-full bg-main-bg dark:bg-gray-800 border border-border-color dark:border-gray-700 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-10"
                                defaultValue=""
                            >
                                <option value="" disabled>Chọn một gợi ý chuyển động...</option>
                                {(mode === 'exterior' ? exteriorSuggestions : interiorSuggestions).map((suggestion) => (
                                    <option key={suggestion.label} value={suggestion.prompt}>
                                        {suggestion.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400">
                               <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">3. Ảnh Bắt Đầu (Tùy chọn)</label>
                        <div className="max-w-md">
                             <ImageUpload onFileSelect={(file) => onStateChange({ startImage: file })} previewUrl={startImage?.objectURL}/>
                        </div>
                    </div>

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
                        disabled={isLoading || userCredits < cost}
                        className="w-full flex justify-center items-center gap-3 bg-accent hover:bg-accent-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                       {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo Video'}
                    </button>
                    {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
                </div>

                {/* --- RIGHT COLUMN: VIDEO DISPLAY --- */}
                <div>
                     <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4 text-center">Kết quả Video</h3>
                     <div className="sticky top-28">
                         <div className="aspect-video bg-main-bg dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700 flex items-center justify-center overflow-hidden">
                            {isLoading && (
                                <div className="text-center p-4">
                                    <Spinner />
                                    <p className="text-text-secondary dark:text-gray-400 mt-4">{loadingMessage}</p>
                                </div>
                            )}
                            {!isLoading && generatedVideoUrl && (
                                <video controls src={generatedVideoUrl} className="w-full h-full object-contain" />
                            )}
                            {!isLoading && !generatedVideoUrl && (
                                 <div className="text-center text-text-secondary dark:text-gray-400 p-4">
                                    <FilmIcon />
                                    <p className="mt-2">Video kết quả sẽ hiển thị ở đây.</p>
                                 </div>
                            )}
                         </div>
                         {generatedVideoUrl && !isLoading && (
                             <button onClick={handleDownload} className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                                Tải xuống Video
                            </button>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
