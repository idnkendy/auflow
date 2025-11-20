
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { PricingPlan, Transaction } from '../types';
import * as paymentService from '../services/paymentService';
import Spinner from './Spinner';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400 bg-gray-200 rounded-full p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const QRCodeIcon = () => (
    <svg className="w-32 h-32 text-gray-800 bg-white p-2 rounded-lg mx-auto" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M128 256a128 128 0 1 1 128-128 128 128 0 0 1-128 128Z"/>
        <path fill="#fff" d="M128 0a128 128 0 0 0 0 256V0Z"/>
        <path fill="currentColor" d="M188 68v40h-40V68ZM88 68v40H48V68ZM68 48H48v20h20Zm20 0V28H68v20Zm100 0h20v20h-20Zm-20 20V48h20v20Zm0 0h20v20h-20Zm-20-20H88v20h80ZM68 88H48v20h20Zm20 0V68H68v20Zm-20 20H48v20h20Zm0 20H48v20h20Zm0 20H48v20h20Zm0 20H48v20h20Zm20-20H68v20h20Zm20 0H88v20h20Zm-20-20H68v20h20Zm100 80v-20h20v20Zm-20-20v-20h20v20Zm0-20v-20h20v20Zm0-20v-20h20v20Zm-20 60v-20h20v20Zm0-20v-20h20v20Zm-20 0v-20h20v20Zm-20 0v-20h20v20Zm-20 0v-20h20v20Zm0-20v-20h20v20Zm20 20v20h20v-20Zm40 0v20h20v-20Zm-60-60H88v20h20Zm20 0h20v20h-20Zm0 20H88v20h40Zm0 20h20v20h-20Zm-20 20H88v20h20Zm100-20h-20v20h20Zm-20-20h-20v20h20Zm0-20h-20v20h20Z"/>
    </svg>
);

const subscriptions: PricingPlan[] = [
    {
        id: 'sub_basic',
        name: 'Cơ Bản',
        price: 199000,
        currency: 'đ/tháng',
        features: ['50 lượt tạo ảnh/tháng', '5 lượt tạo video/tháng', 'Chất lượng tiêu chuẩn', 'Hỗ trợ qua email'],
        type: 'subscription',
        description: 'Lý tưởng cho người mới bắt đầu và các dự án nhỏ.'
    },
    {
        id: 'sub_advanced',
        name: 'Nâng Cao',
        price: 599000,
        currency: 'đ/tháng',
        features: ['250 lượt tạo ảnh/tháng', '25 lượt tạo video/tháng', 'Chất lượng cao (HD & Full HD)', 'Ưu tiên hàng đợi xử lý', 'Hỗ trợ ưu tiên qua Zalo'],
        type: 'subscription',
        highlight: true,
        description: 'Dành cho kiến trúc sư và nhà thiết kế chuyên nghiệp.'
    },
    {
        id: 'sub_vip',
        name: 'VIP',
        price: 1000000,
        currency: 'đ/tháng',
        features: ['Không giới hạn tạo ảnh', '50 lượt tạo video', 'Chất lượng cao nhất (2K & 4K)', 'Hàng đợi xử lý riêng', 'Hỗ trợ chuyên biệt 24/7', 'Truy cập sớm tính năng mới'],
        type: 'subscription',
        description: 'Giải pháp toàn diện cho các studio và doanh nghiệp lớn.'
    }
];

const creditPacks: PricingPlan[] = [
    {
        id: 'cred_starter',
        name: 'Gói Khởi động',
        price: 50000,
        currency: 'đ',
        features: ['100 Credits', 'Không hết hạn', 'Dùng cho mọi tính năng'],
        type: 'credit',
        credits: 100,
        description: 'Dành cho nhu cầu phát sinh.'
    },
    {
        id: 'cred_pro',
        name: 'Gói Chuyên nghiệp',
        price: 200000,
        currency: 'đ',
        features: ['500 Credits', 'Tiết kiệm 20%', 'Không hết hạn'],
        type: 'credit',
        credits: 500,
        highlight: true,
        description: 'Gói phổ biến nhất cho Freelancer.'
    },
    {
        id: 'cred_studio',
        name: 'Gói Studio',
        price: 800000,
        currency: 'đ',
        features: ['2500 Credits', 'Tiết kiệm 35%', 'Không hết hạn', 'Hỗ trợ 1-1 setup'],
        type: 'credit',
        credits: 2500,
        description: 'Dành cho team và dự án lớn.'
    }
];

interface UserProfileProps {
    session: Session;
    initialTab?: 'profile' | 'plans' | 'history';
    onTabChange: (tab: 'profile' | 'plans' | 'history') => void;
    onPurchaseSuccess?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ session, initialTab = 'plans', onTabChange, onPurchaseSuccess }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'history'>(initialTab);
    
    // Payment State
    const [billingMode, setBillingMode] = useState<'subscription' | 'credits'>('subscription');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    
    // History State
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const history = await paymentService.getTransactionHistory();
            setTransactionHistory(history);
        } catch (error) {
            console.error("Failed to load transactions", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleTabClick = (tab: 'profile' | 'plans' | 'history') => {
        setActiveTab(tab);
        onTabChange(tab);
    };

    const handleBuyClick = async (plan: PricingPlan) => {
        setSelectedPlan(plan);
        setIsProcessing(true);
        setPaymentStatus('idle');
        
        try {
            const result = await paymentService.processPayment(session.user.id, plan, 'qr');
            setPaymentStatus('success');
            setStatusMessage(result.message);
            
            // Trigger external refresh (update Header credits)
            if (onPurchaseSuccess) {
                onPurchaseSuccess();
            }
            // Refresh history list as well
            loadHistory();

        } catch (err: any) {
            setPaymentStatus('error');
            setStatusMessage(err.message || "Có lỗi xảy ra khi thanh toán.");
        } finally {
            setIsProcessing(false);
        }
    };

    const closeStatusModal = () => {
        setPaymentStatus('idle');
        setSelectedPlan(null);
    };

    const activePlans = billingMode === 'subscription' ? subscriptions : creditPacks;

    // Mock Profile Data
    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.full_name || "Người dùng Auflow";
    const joinDate = new Date(session.user.created_at).toLocaleDateString('vi-VN');

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Sidebar */}
            <div className="lg:w-1/4 bg-surface dark:bg-dark-bg rounded-xl shadow-sm border border-border-color dark:border-gray-700 p-6 flex flex-col items-center text-center h-fit">
                <div className="mb-4">
                    <UserIcon />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white">{userName}</h2>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">{userEmail}</p>
                
                <div className="w-full space-y-2">
                    <button 
                        onClick={() => handleTabClick('profile')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Thông tin tài khoản
                    </button>
                    
                    {/* DISABLED PLANS TAB IN SIDEBAR */}
                    {/* 
                    <button 
                        onClick={() => handleTabClick('plans')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'plans' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Gói cước & Thanh toán
                    </button>
                    */}
                    
                    <button 
                        onClick={() => handleTabClick('history')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Lịch sử giao dịch
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="lg:w-3/4 bg-surface dark:bg-dark-bg rounded-xl shadow-sm border border-border-color dark:border-gray-700 p-6 lg:p-8">
                
                {/* === TAB: PROFILE === */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Thông tin tài khoản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Họ và tên</label>
                                <input type="text" value={userName} disabled className="w-full bg-main-bg dark:bg-gray-800 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-300 opacity-70" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Email</label>
                                <input type="email" value={userEmail} disabled className="w-full bg-main-bg dark:bg-gray-800 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-300 opacity-70" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Ngày tham gia</label>
                                <input type="text" value={joinDate} disabled className="w-full bg-main-bg dark:bg-gray-800 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-300 opacity-70" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Gói hiện tại</label>
                                <div className="w-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-green-800 dark:text-green-300 font-semibold">
                                    Miễn phí (Free Tier)
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border-color dark:border-gray-700">
                            <h4 className="font-semibold text-text-primary dark:text-white mb-2">Bảo mật</h4>
                            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary dark:text-white rounded-lg transition-colors text-sm">
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                )}

                {/* === TAB: PLANS (MAINTENANCE MODE) === */}
                {activeTab === 'plans' && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-fade-in">
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Hệ thống thanh toán đang bảo trì</h3>
                        <p className="text-text-secondary dark:text-gray-400 max-w-md">Chúng tôi đang nâng cấp hệ thống thanh toán để phục vụ bạn tốt hơn. Vui lòng quay lại sau hoặc liên hệ hỗ trợ nếu bạn cần nạp credits gấp.</p>
                    </div>
                )}

                {/* === TAB: HISTORY === */}
                {activeTab === 'history' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Lịch sử giao dịch</h3>
                        
                        {isLoadingHistory ? (
                             <div className="flex justify-center py-10"><Spinner /></div>
                        ) : transactionHistory.length === 0 ? (
                             <p className="text-center text-text-secondary dark:text-gray-400 py-10">Bạn chưa có giao dịch nào.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-text-secondary dark:text-gray-400">
                                    <thead className="text-xs text-text-primary uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Mã giao dịch</th>
                                            <th scope="col" className="px-6 py-3">Dịch vụ</th>
                                            <th scope="col" className="px-6 py-3">Số tiền</th>
                                            <th scope="col" className="px-6 py-3">Ngày</th>
                                            <th scope="col" className="px-6 py-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionHistory.map((tx) => (
                                            <tr key={tx.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 font-mono">{tx.transaction_code || tx.id.substring(0, 8)}</td>
                                                <td className="px-6 py-4">{tx.plan_name}</td>
                                                <td className="px-6 py-4">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}</td>
                                                <td className="px-6 py-4">{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                                                        tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                    }`}>
                                                        {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
