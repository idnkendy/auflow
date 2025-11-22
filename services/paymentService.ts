
import { PricingPlan, Transaction, UserStatus, UsageLog } from "../types";
import { supabase } from "./supabaseClient";

// Mock API response delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for retrying operations
const withRetry = async <T>(operation: () => Promise<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Check if it's a fetch error or network error
            const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError');
            if (isNetworkError || i < maxRetries - 1) {
                console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delayMs}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
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
    console.log(`Processing payment for plan: ${plan.name} (${plan.id}) via ${paymentMethod}`);
    
    // 1. Simulate network request delay
    await delay(2000);

    // 2. Generate fake transaction code
    const transactionCode = `TXN_${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const isSuccess = true; 

    if (isSuccess) {
        // 3. Record Transaction (History log)
        const { error: txError } = await withRetry<any>(() => supabase
            .from('transactions')
            .insert({
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

        if (txError) {
            console.error("Error saving transaction:", txError);
            throw new Error("Lỗi lưu giao dịch: " + txError.message);
        }

        // 4. Update Profile (Source of Truth) - Logic cộng dồn
        
        // Lấy profile hiện tại
        const { data: currentProfile } = await withRetry<any>(() => supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle());

        const updates: any = { 
            id: userId,
            updated_at: new Date().toISOString() 
        };

        // A. Xử lý Credits: Cộng dồn vào số cũ
        // Nếu user mới chưa có profile, mặc định tặng 50 credits + gói mua
        const currentCredits = currentProfile?.credits || 50; 
        if (plan.credits && plan.credits > 0) {
            updates.credits = currentCredits + plan.credits;
        } else {
            updates.credits = currentCredits;
        }

        // B. Xử lý Subscription: Logic cộng dồn thời gian (Stacking) theo tháng dương lịch
        if (plan.type === 'subscription' && plan.durationMonths) {
            const now = new Date();
            let currentEndDate = currentProfile?.subscription_end 
                ? new Date(currentProfile.subscription_end) 
                : new Date(0); // Nếu chưa có, coi như đã hết hạn từ lâu

            // Nếu hạn cũ còn hiệu lực (> now), thì bắt đầu tính từ hạn cũ.
            // Nếu hạn cũ đã hết (< now), thì bắt đầu tính từ bây giờ.
            const effectiveStartDate = currentEndDate > now ? currentEndDate : now;

            // Tính ngày hết hạn mới bằng cách cộng số tháng
            const newEndDate = new Date(effectiveStartDate);
            newEndDate.setMonth(newEndDate.getMonth() + plan.durationMonths);
            
            // Xử lý edge case (vd: 31/1 + 1 tháng -> 28/2 hoặc 29/2)
            // Nếu ngày bị lệch sang tháng sau (do tháng cũ dài hơn tháng mới), set về ngày cuối tháng
            if (newEndDate.getDate() !== effectiveStartDate.getDate()) {
                newEndDate.setDate(0);
            }

            updates.subscription_end = newEndDate.toISOString();
        }

        // Thực hiện update hoặc insert (upsert)
        // Lấy email nếu cần tạo mới profile
        if (!currentProfile) {
             const { data: { user } } = await supabase.auth.getUser();
             updates.email = user?.email;
        }

        const { error: updateError } = await withRetry<any>(() => supabase
            .from('profiles')
            .upsert(updates, { onConflict: 'id' }));

        if (updateError) {
            console.error("Error updating profile:", updateError);
            throw new Error("Lỗi cập nhật tài khoản: " + updateError.message);
        }

        return {
            success: true,
            message: `Thanh toán thành công! Đã cộng ${new Intl.NumberFormat('vi-VN').format(plan.credits || 0)} credits.`,
            transactionId: transactionCode
        };
    } else {
        throw new Error("Thanh toán thất bại. Vui lòng thử lại.");
    }
};

export const getTransactionHistory = async (): Promise<Transaction[]> => {
    try {
        const { data, error } = await withRetry<any>(() => supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false }));

        if (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }

        return data as Transaction[];
    } catch (e) {
        console.error("Failed to load history:", e);
        return [];
    }
};

export const getUserStatus = async (userId: string): Promise<UserStatus> => {
    let currentCredits = 0;
    let subscriptionEnd: string | null = null;
    
    try {
        // 1. Get Data directly from PROFILES table
        const { data: profile, error: profileError } = await withRetry<any>(() => supabase
            .from('profiles')
            .select('credits, subscription_end')
            .eq('id', userId)
            .maybeSingle());

        if (profile) {
            currentCredits = profile.credits;
            subscriptionEnd = profile.subscription_end;
        } else {
            // Init profile for new user
            console.log("Profile not found in getUserStatus, initializing...");
            currentCredits = 50; // NEW USER BONUS: 50 Credits
            
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Race condition handling: try insert, if fail (exists), then select again
                const { error: insertError } = await withRetry<any>(() => supabase.from('profiles').upsert({
                    id: userId,
                    email: user.email,
                    credits: currentCredits,
                    subscription_end: null
                }, { onConflict: 'id' }));
                
                if (insertError) {
                     console.log("Profile init race condition (normal), retrying fetch...");
                     const { data: retryProfile } = await withRetry<any>(() => supabase
                        .from('profiles')
                        .select('credits, subscription_end')
                        .eq('id', userId)
                        .maybeSingle());
                     if (retryProfile) {
                         currentCredits = retryProfile.credits;
                         subscriptionEnd = retryProfile.subscription_end;
                     }
                }
            }
        }
    } catch (e) {
        console.warn("Error getting user status (using defaults):", e);
    }

    // 2. Check Expiry based on stored date
    let isExpired = true;
    if (subscriptionEnd) {
        isExpired = new Date(subscriptionEnd) < new Date();
    }

    return {
        credits: currentCredits,
        subscriptionEnd,
        isExpired
    };
};

export const deductCredits = async (userId: string, amount: number, description: string = 'Sử dụng tính năng AI'): Promise<string> => {
    // Wrapped in retry logic to prevent "Failed to fetch" errors from stopping the flow
    return withRetry(async () => {
        // 1. Get current balance and ensure profile exists
        // We call getUserStatus inside here but carefully as to not create infinite loops or heavy load
        // For atomicity, normally we'd use a stored procedure or RLS check, but here we check client side first.
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();
            
        const currentCredits = profile?.credits ?? 0;

        if (currentCredits < amount) {
            throw new Error(`Không đủ Credits. Bạn cần ${amount} credits nhưng chỉ còn ${currentCredits}.`);
        }

        // 2. Record Usage Log
        // IMPORTANT: Using .select('id').single() to get the ID for job linking
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
            console.error("Error logging usage:", JSON.stringify(logError));
            throw new Error("Lỗi hệ thống khi ghi nhận giao dịch: " + logError.message);
        }

        // 3. Deduct from Profile
        const newBalance = currentCredits - amount;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Error updating balance:", updateError);
            // Critical consistency error, but log exists.
            throw new Error("Lỗi cập nhật số dư: " + updateError.message);
        }

        return logData.id;
    });
};

export const refundCredits = async (userId: string, amount: number, description: string = 'Hoàn tiền do lỗi hệ thống'): Promise<void> => {
    try {
        await withRetry(async () => {
            // 1. Get current balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (!profile) return;

            // 2. Add credits back
            const newBalance = profile.credits + amount;
            await supabase
                .from('profiles')
                .update({ 
                    credits: newBalance, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', userId);

            // 3. Log negative usage to reflect refund
            await supabase
                .from('usage_logs')
                .insert({
                    user_id: userId,
                    credits_used: -amount, // Negative indicates refund
                    description: description,
                });
        });
            
        console.log(`Refunded ${amount} credits to ${userId}`);
    } catch (e) {
        console.error("Error processing refund:", e);
    }
};

export const getPaymentMethods = () => {
    return [
        { id: 'qr', name: 'Chuyển khoản ngân hàng (QR Code)', icon: '🏦' },
        { id: 'card', name: 'Thẻ tín dụng / Ghi nợ Quốc tế', icon: '💳' },
    ];
};
