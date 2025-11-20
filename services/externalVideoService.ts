
import { FileData } from "../types";

// Hàm helper để chờ (sleep)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const pingServer = async (backendUrl: string): Promise<boolean> => {
    // Không cần ping với Vercel Serverless
    return true;
};

export const generateVideoExternal = async (prompt: string, backendUrl: string, startImage?: FileData): Promise<string> => {
    // Luôn dùng đường dẫn tương đối với Vercel
    
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
        let errMsg = `Lỗi Trigger: ${triggerRes.status}`;
        try {
            const errData = await triggerRes.json();
            if (errData.message) errMsg = errData.message;
        } catch (e) {}
        throw new Error(errMsg);
    }

    const triggerData = await triggerRes.json();
    const { task_id, scene_id } = triggerData;

    if (!task_id) throw new Error("Không nhận được Task ID từ server.");
    console.log(`[Video Service] Task Started: ${task_id}. Polling...`);

    // 2. Polling (Vòng lặp kiểm tra trạng thái)
    // Thời gian chờ tối đa 10 phút (120 lần * 5s)
    const maxRetries = 120; 
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
                
                console.log(`[Video Service] Polling... (${attempts}/${maxRetries})`);
            }
        } catch (e) {
            console.warn("Polling error (ignored, retrying):", e);
        }
    }

    throw new Error("Quá thời gian chờ (Timeout) phía Client.");
};
