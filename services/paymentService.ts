
import { PricingPlan, Transaction, UserStatus } from "../types";
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
    
    // 1. Simulate network request delay (processing payment gateway)
    await delay(2000);

    // 2. Generate a fake transaction code (in real app, this comes from payment gateway)
    const transactionCode = `TXN_${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Simulate random success/failure (mostly success for demo)
    const isSuccess = true; 

    if (isSuccess) {
        // 3. Save to Supabase
        const { error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                plan_id: plan.id,
                plan_name: plan.name,
                amount: plan.price,
                currency: 'VND', // Assuming VND based on UI
                type: plan.type,
                credits_added: plan.credits || 0,
                status: 'completed',
                payment_method: paymentMethod,
                transaction_code: transactionCode
            });

        if (error) {
            console.error("Error saving transaction:", error);
            // Even if saving DB fails, if payment gateway was success, we might return success with a warning, 
            // but for this demo, let's treat DB failure as transaction failure.
            throw new Error("Giao dịch thành công nhưng lỗi khi lưu dữ liệu. Vui lòng liên hệ hỗ trợ.");
        }

        return {
            success: true,
            message: "Thanh toán thành công! Gói cước đã được kích hoạt.",
            transactionId: transactionCode
        };
    } else {
        throw new Error("Thanh toán thất bại. Vui lòng thử lại hoặc liên hệ ngân hàng.");
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
    // 1. Fetch all completed transactions for the user
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

    if (error) {
        console.error("Error fetching user status:", error);
        return { credits: 0, subscriptionEnd: null, isExpired: false };
    }

    const transactions = data as Transaction[];

    // 2. Calculate Credits
    // Base credits for every new account = 10
    let totalCredits = 10; 
    
    // Add credits from purchased packs
    totalCredits += transactions.reduce((sum, tx) => sum + (tx.credits_added || 0), 0);

    // 3. Calculate Subscription Status
    // Find the latest subscription transaction
    const subscriptionTxs = transactions
        .filter(tx => tx.type === 'subscription')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let subscriptionEnd: string | null = null;
    let isExpired = false;

    if (subscriptionTxs.length > 0) {
        const latestSub = subscriptionTxs[0];
        const startDate = new Date(latestSub.created_at);
        // Assuming 1 month = 30 days for simplicity
        const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        subscriptionEnd = endDate.toISOString();
        isExpired = new Date() > endDate;
    }

    return {
        credits: totalCredits,
        subscriptionEnd,
        isExpired
    };
};

export const getPaymentMethods = () => {
    return [
        { id: 'qr', name: 'Chuyển khoản ngân hàng (QR Code)', icon: '🏦' },
        { id: 'card', name: 'Thẻ tín dụng / Ghi nợ Quốc tế', icon: '💳' },
    ];
};