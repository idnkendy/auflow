
import { PricingPlan, Transaction, UserStatus, UsageLog } from "../types";
import { supabase } from "./supabaseClient";

// Mock API response delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for retrying operations
const withRetry = async <T>(operation: () => PromiseLike<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            // Extract error message string safely to check for retryable conditions
            let msg = '';
            if (typeof error === 'string') msg = error;
            else if (error instanceof Error) msg = error.message;
            else if (typeof error === 'object') {
                // Handle the specific JSON error structure if present
                try {
                    msg = JSON.stringify(error);
                } catch (e) {
                    msg = 'Unknown error object';
                }
            }
            
            // Check for retryable network/server errors
            const isRetryable = 
                msg.includes('Failed to fetch') || 
                msg.includes('NetworkError') || 
                msg.includes('network') || 
                msg.includes('503') || 
                msg.includes('504') || 
                msg.includes('502') ||
                msg.includes('500') ||
                msg.includes('TypeError: Failed to fetch') ||
                msg.includes('upstream connect error'); // Supabase cold start specific

            if (i < maxRetries - 1 && isRetryable) {
                // Exponential backoff: 1s, 2.5s, 5s... to allow DB to wake up
                const backoff = delayMs * Math.pow(2.5, i);
                console.warn(`[PaymentService] Lỗi mạng (lần ${i + 1}/${maxRetries}). Database có thể đang khởi động. Thử lại sau ${Math.round(backoff)}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            } else {
                // If it's a logic error (e.g., "Not enough credits"), throw immediately
                throw error;
            }
        }
    }
    throw lastError;
};

export interface PaymentResult {
    success: boolean;
    message: string;
    transactionId?: string;
}

export const processPayment = async (userId: string, plan: PricingPlan, paymentMethod: 'qr' | 'card'): Promise<PaymentResult> => {
    await delay(1000);
    const transactionCode = `TXN_${Date.now().toString().slice(-6)}`;

    const { error: txError } = await withRetry<{ error: any }>(() => supabase.from('transactions').insert({
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        currency: 'VND',
        type: plan.type,
        credits_added: plan.credits || 0,
        status: 'completed',
        payment_method: paymentMethod,
        transaction_code: transactionCode
    }));

    if (txError) throw new Error(`Lỗi lưu giao dịch: ${txError.message}`);

    const { data: currentProfile } = await withRetry<{ data: { credits: number } | null }>(() => supabase.from('profiles').select('credits').eq('id', userId).maybeSingle());
    const currentCredits = currentProfile?.credits || 0;
    
    const { error: updateError } = await withRetry<{ error: any }>(() => supabase.from('profiles').upsert({
        id: userId,
        credits: currentCredits + (plan.credits || 0),
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' }));

    if (updateError) throw new Error(`Lỗi cập nhật tài khoản: ${updateError.message}`);

    return {
        success: true,
        message: `Thanh toán thành công! Đã cộng ${plan.credits} credits.`,
        transactionId: transactionCode
    };
};

export const getTransactionHistory = async (): Promise<Transaction[]> => {
    try {
        const { data, error } = await withRetry<{ data: any[] | null, error: any }>(() => supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false }));

        if (error) throw error;
        return data as Transaction[];
    } catch (e) {
        console.error("Failed to load history:", e);
        return [];
    }
};

export const getUserStatus = async (userId: string): Promise<UserStatus> => {
    try {
        const { data: profile } = await withRetry<{ data: { credits: number, subscription_end: string | null } | null }>(() => supabase
            .from('profiles')
            .select('credits, subscription_end')
            .eq('id', userId)
            .maybeSingle());

        if (profile) {
            return {
                credits: profile.credits,
                subscriptionEnd: profile.subscription_end,
                isExpired: profile.subscription_end ? new Date(profile.subscription_end) < new Date() : true
            };
        } else {
            // Init profile for new user with bonus credits
            const { error } = await withRetry<{ error: any }>(() => supabase.from('profiles').upsert({
                id: userId,
                credits: 50, 
            }, { onConflict: 'id' }));
            
            if (!error) return { credits: 50, subscriptionEnd: null, isExpired: true };
        }
    } catch (e) {
        console.warn("Error getting user status:", e);
    }
    return { credits: 0, subscriptionEnd: null, isExpired: true };
};

export const deductCredits = async (userId: string, amount: number, description: string = 'Sử dụng tính năng AI'): Promise<string> => {
    try {
        console.group('[PaymentService] Bắt đầu trừ Credits');
        return await withRetry(async () => {
            // 1. Check Balance
            console.log("Bước 1: Kiểm tra số dư...");
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();
                
            if (fetchError) {
                 const msg = fetchError.message || '';
                 if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                     throw new Error('TypeError: Failed to fetch (Check Balance)');
                 }
                 if (fetchError.code === 'PGRST116') {
                     throw new Error("Không tìm thấy thông tin tài khoản.");
                 }
                 throw new Error(`Lỗi kiểm tra số dư: ${msg}`);
            }

            const currentCredits = profile?.credits ?? 0;
            console.log(`-> Số dư hiện tại: ${currentCredits}. Cần trừ: ${amount}`);
            
            if (currentCredits < amount) {
                throw new Error(`Không đủ Credits. Cần ${amount}, hiện có ${currentCredits}.`);
            }

            // 2. Record Usage Log
            console.log("Bước 2: Ghi nhật ký giao dịch...");
            const { data: logData, error: logError } = await supabase
                .from('usage_logs')
                .insert({
                    user_id: userId,
                    credits_used: amount,
                    description: description,
                })
                .select('id')
                .single();

            if (logError) {
                const msg = logError.message || '';
                if (msg.includes('Failed to fetch')) throw new Error('TypeError: Failed to fetch (Insert Log)');
                throw new Error(`Lỗi ghi nhật ký: ${msg}`);
            }

            // 3. Update Balance
            console.log("Bước 3: Cập nhật số dư mới...");
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    credits: currentCredits - amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                const msg = updateError.message || '';
                if (msg.includes('Failed to fetch')) throw new Error('TypeError: Failed to fetch (Update Balance)');
                throw new Error(`Lỗi trừ tiền: ${msg}`);
            }

            console.log("-> Hoàn tất trừ tiền.");
            return logData.id;
        }, 5, 2000); // Increased retry delay for cold starts

    } catch (error: any) {
        console.error("Deduct credits failed (Final):", error);
        
        let uiMessage = "Lỗi không xác định.";
        
        // --- ROBUST ERROR PARSING LOGIC ---
        // Try to handle the specific JSON string format: {"message": "...", "details": "..."}
        let errorObj = error;
        if (typeof error === 'string') {
            try {
                if (error.trim().startsWith('{')) {
                    errorObj = JSON.parse(error);
                } else {
                    uiMessage = error;
                }
            } catch (e) {
                uiMessage = error;
            }
        }

        if (typeof errorObj === 'object' && errorObj !== null) {
            // Prioritize 'details' if it exists and looks like an error message
            if (errorObj.details && typeof errorObj.details === 'string') {
                 uiMessage = errorObj.details;
            } else if (errorObj.message) {
                 uiMessage = errorObj.message;
            } else {
                 uiMessage = JSON.stringify(errorObj);
            }
        }

        // Map technical messages to friendly UI messages
        if (uiMessage.includes('Failed to fetch') || uiMessage.includes('NetworkError') || uiMessage.includes('fetch')) {
            throw new Error("Lỗi kết nối (Failed to fetch). Có thể Database đang khởi động lại, vui lòng thử lại sau 10-20 giây.");
        } else if (uiMessage.includes('Không đủ Credits')) {
            throw error; // Pass through logic errors
        } else {
            // If it's a clean message, use it, otherwise fallback
            throw new Error(uiMessage.length < 200 ? uiMessage : "Lỗi hệ thống. Vui lòng thử lại sau.");
        }
    } finally {
        console.groupEnd();
    }
};

export const refundCredits = async (userId: string, amount: number, description: string = 'Hoàn tiền'): Promise<void> => {
    try {
        await withRetry(async () => {
            const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
            if (!profile) return;

            await supabase.from('profiles').update({ 
                credits: profile.credits + amount, 
                updated_at: new Date().toISOString() 
            }).eq('id', userId);

            await supabase.from('usage_logs').insert({
                user_id: userId,
                credits_used: -amount,
                description: description,
            });
        });
    } catch (e) {
        console.error("Refund failed:", e);
    }
};

export const redeemGiftCode = async (userId: string, code: string): Promise<number> => {
    const cleanCode = code.trim().toUpperCase();
    
    // 1. Find Gift Code
    const { data: giftCode, error: codeError } = await supabase
        .from('gift_codes')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

    if (codeError || !giftCode) {
        throw new Error('Mã quà tặng không hợp lệ hoặc không tồn tại.');
    }

    // 2. Check Expiry
    if (giftCode.expires_at && new Date(giftCode.expires_at) < new Date()) {
        throw new Error('Mã quà tặng đã hết hạn.');
    }

    // 3. Check usage for this user
    const { data: usage } = await supabase
        .from('gift_code_usages')
        .select('id')
        .eq('user_id', userId)
        .eq('code_id', giftCode.id)
        .maybeSingle();

    if (usage) {
        throw new Error('Bạn đã sử dụng mã quà tặng này rồi.');
    }

    // 4. Record Usage (Try to insert first to handle concurrency via Unique Constraint)
    const { error: usageError } = await supabase
        .from('gift_code_usages')
        .insert({
            user_id: userId,
            code_id: giftCode.id
        });

    if (usageError) {
        // If duplicate key error, user already used it (race condition catch)
        if (usageError.code === '23505') {
            throw new Error('Bạn đã sử dụng mã quà tặng này rồi.');
        }
        throw new Error('Lỗi hệ thống khi áp dụng mã.');
    }

    // 5. Add Credits to Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    
    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + giftCode.credits;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
            credits: newCredits,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (updateError) {
        // Critical error: Usage recorded but credits not added. 
        // Ideally should use SQL Transaction (RPC) for atomic operation.
        console.error("CRITICAL: Failed to add credits after recording usage", updateError);
        throw new Error('Lỗi cập nhật số dư. Vui lòng liên hệ hỗ trợ.');
    }

    // 6. Log Transaction for history
    await supabase.from('transactions').insert({
        user_id: userId,
        plan_name: `Giftcode: ${cleanCode}`,
        plan_id: 'gift_redemption',
        amount: 0,
        currency: 'VND',
        type: 'credit', // or 'gift'
        credits_added: giftCode.credits,
        status: 'completed',
        payment_method: 'giftcode',
        transaction_code: cleanCode
    });

    return giftCode.credits;
};
