
import { FileData } from "../types";

// Hàm helper để chờ (sleep)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const pingServer = async (backendUrl: string): Promise<boolean> => {
    try {
        // Vercel endpoint sẽ là /api/py/health
        const url = backendUrl.includes('vercel.app') || backendUrl.startsWith('/') 
            ? '/api/py/health' 
            : `${backendUrl.replace(/\/+$/, '')}/api/py/health`;
            
        // Fallback nếu dùng code python cũ (không có /api/py)
        const fallbackUrl = backendUrl.replace(/\/+$/, '');

        try {
            const res = await fetch(url);
            if (res.ok) return true;
        } catch (e) {}

        // Thử fallback root (cho render cũ)
        const res2 = await fetch(fallbackUrl);
        return res2.ok;
    } catch (e) {
        return false;
    }
};

export const generateVideoExternal = async (prompt: string, backendUrl: string, startImage?: FileData): Promise<string> => {
    // Chuẩn hóa URL: Nếu để trống hoặc là relative path thì dùng đường dẫn nội bộ của Vercel
    let baseUrl = backendUrl.replace(/\/+$/, '');
    if (!baseUrl || baseUrl === '/') {
        baseUrl = ''; // Relative path calls
    }

    // Nếu là Vercel internal route, endpoint là /api/py/...
    // Nếu là Render (code cũ), endpoint là /run-video
    // Ta sẽ ưu tiên logic Polling mới (Vercel)
    
    const isVercel = baseUrl === '' || baseUrl.includes('vercel.app');
    
    if (!isVercel) {
        // --- LOGIC CŨ (DÙNG CHO RENDER/PYTHONANYWHERE) ---
        try {
            const payload: any = { prompt: prompt };
            if (startImage) {
                payload.image = `data:${startImage.mimeType};base64,${startImage.base64}`;
            }
            const response = await fetch(`${baseUrl}/run-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Lỗi ${response.status}`);
            if (data.status === 'success' && data.video_url) return data.video_url;
            throw new Error(data.message || "Lỗi không xác định.");
        } catch (error: any) {
            if (error.message.includes('504')) throw new Error("Server Render bị Timeout (504). Vui lòng thử lại.");
            throw error;
        }
    } 
    
    // --- LOGIC MỚI (POLLING CHO VERCEL) ---
    console.log("[Video Service] Starting Vercel Polling Mode...");
    
    // 1. Trigger (Gửi lệnh)
    const triggerUrl = '/api/py/trigger';
    const payload: any = { prompt: prompt };
    if (startImage) {
        payload.image = `data:${startImage.mimeType};base64,${startImage.base64}`;
    }

    const triggerRes = await fetch(triggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!triggerRes.ok) {
        const err = await triggerRes.json().catch(() => ({}));
        throw new Error(err.message || `Lỗi Trigger: ${triggerRes.status}`);
    }

    const triggerData = await triggerRes.json();
    const { task_id, scene_id } = triggerData;

    if (!task_id) throw new Error("Không nhận được Task ID từ server.");
    console.log(`[Video Service] Task Started: ${task_id}. Polling...`);

    // 2. Polling (Vòng lặp kiểm tra trạng thái)
    const maxRetries = 60; // 60 lần * 5s = 5 phút tối đa
    let attempts = 0;
    const checkUrl = '/api/py/check';

    while (attempts < maxRetries) {
        attempts++;
        await wait(5000); // Đợi 5 giây trước mỗi lần hỏi

        try {
            const checkRes = await fetch(checkUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id, scene_id })
            });

            if (checkRes.ok) {
                const checkData = await checkRes.json();
                
                if (checkData.status === 'completed' && checkData.video_url) {
                    console.log("[Video Service] Completed!", checkData.video_url);
                    return checkData.video_url;
                }
                
                if (checkData.status === 'failed') {
                    throw new Error(checkData.message || "Quá trình tạo video thất bại.");
                }
                
                // Nếu status === 'processing', tiếp tục lặp
                console.log(`[Video Service] Polling... (${attempts}/${maxRetries})`);
            }
        } catch (e) {
            console.warn("Polling error (ignored, retrying):", e);
        }
    }

    throw new Error("Quá thời gian chờ (Timeout) phía Client.");
};
