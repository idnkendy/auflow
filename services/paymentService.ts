
import { PricingPlan, Transaction, UserStatus, UsageLog } from "../types";
import { supabase } from "./supabaseClient";

// Mock API response delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        const { error: txError } = await supabase
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
            });

        if (txError) {
            console.error("Error saving transaction:", txError);
            throw new Error("Lỗi lưu giao dịch: " + txError.message);
        }

        // 4. Update Profile (Source of Truth) - Logic cộng dồn
        
        // Lấy profile hiện tại
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        const updates: any = { 
            id: userId,
            updated_at: new Date().toISOString() 
        };

        // A. Xử lý Credits: Cộng dồn vào số cũ
        if (plan.credits && plan.credits > 0) {
            const currentCredits = currentProfile?.credits || 100; // Mặc định 100 nếu user mới
            updates.credits = currentCredits + plan.credits;
        } else if (!currentProfile) {
            updates.credits = 100; // Init credits cho user mới nếu chỉ mua gói tháng
        }

        // B. Xử lý Subscription: Logic cộng dồn thời gian (Stacking)
        if (plan.type === 'subscription') {
            const now = new Date();
            let currentEndDate = currentProfile?.subscription_end 
                ? new Date(currentProfile.subscription_end) 
                : new Date(0); // Nếu chưa có, coi như đã hết hạn từ lâu

            // Nếu hạn cũ còn hiệu lực (> now), thì bắt đầu tính từ hạn cũ.
            // Nếu hạn cũ đã hết (< now), thì bắt đầu tính từ bây giờ.
            const effectiveStartDate = currentEndDate > now ? currentEndDate : now;

            // Cộng thêm 30 ngày vào ngày bắt đầu hiệu lực
            const daysToAdd = 30;
            const newEndDate = new Date(effectiveStartDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

            updates.subscription_end = newEndDate.toISOString();
        }

        // Thực hiện update hoặc insert (upsert)
        // Lấy email nếu cần tạo mới profile
        if (!currentProfile) {
             const { data: { user } } = await supabase.auth.getUser();
             updates.email = user?.email;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert(updates, { onConflict: 'id' });

        if (updateError) {
            console.error("Error updating profile:", updateError);
            throw new Error("Lỗi cập nhật tài khoản: " + updateError.message);
        }

        return {
            success: true,
            message: "Thanh toán thành công! Gói cước đã được kích hoạt.",
            transactionId: transactionCode
        };
    } else {
        throw new Error("Thanh toán thất bại. Vui lòng thử lại.");
    }
};

export const getTransactionHistory = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }

    return data as Transaction[];
};

export const getUserStatus = async (userId: string): Promise<UserStatus> => {
    let currentCredits = 0;
    let subscriptionEnd: string | null = null;
    
    // 1. Get Data directly from PROFILES table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, subscription_end')
        .eq('id', userId)
        .maybeSingle();

    if (profile) {
        currentCredits = profile.credits;
        subscriptionEnd = profile.subscription_end;
    } else {
        // Init profile for new user
        console.log("Profile not found in getUserStatus, initializing...");
        currentCredits = 100; 
        
        const { data: { user } } = await supabase.auth.getUser();
        // Race condition handling: try insert, if fail (exists), then select again
        const { error: insertError } = await supabase.from('profiles').upsert({
            id: userId,
            email: user?.email,
            credits: currentCredits,
            subscription_end: null
        }, { onConflict: 'id' });
        
        if (insertError) {
             console.log("Profile init race condition (normal), retrying fetch...");
             const { data: retryProfile } = await supabase
                .from('profiles')
                .select('credits, subscription_end')
                .eq('id', userId)
                .maybeSingle();
             if (retryProfile) {
                 currentCredits = retryProfile.credits;
                 subscriptionEnd = retryProfile.subscription_end;
             }
        }
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
    // 1. Get current balance and ensure profile exists
    let status = await getUserStatus(userId); 
    let currentCredits = status.credits;

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
        throw new Error("Lỗi hệ thống khi ghi nhận giao dịch.");
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
};

export const refundCredits = async (userId: string, amount: number, description: string = 'Hoàn tiền do lỗi hệ thống'): Promise<void> => {
    try {
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
