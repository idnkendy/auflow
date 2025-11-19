
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
                    <button 
                        onClick={() => handleTabClick('plans')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'plans' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Gói cước & Thanh toán
                    </button>
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

                {/* === TAB: PLANS (CHECKOUT) === */}
                {activeTab === 'plans' && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Nâng cấp tài khoản</h3>
                            <p className="text-text-secondary dark:text-gray-300">Mở khóa toàn bộ sức mạnh AI và không giới hạn lượt tạo.</p>
                        </div>

                         {/* Toggle Switch */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-main-bg dark:bg-gray-800 p-1 rounded-full inline-flex shadow-inner">
                                <button
                                    onClick={() => setBillingMode('subscription')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${billingMode === 'subscription' ? 'bg-accent text-white shadow-md' : 'text-text-secondary dark:text-gray-400 hover:text-accent'}`}
                                >
                                    Thuê bao tháng
                                </button>
                                <button
                                    onClick={() => setBillingMode('credits')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${billingMode === 'credits' ? 'bg-accent text-white shadow-md' : 'text-text-secondary dark:text-gray-400 hover:text-accent'}`}
                                >
                                    Mua Credits
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                             {activePlans.map((plan) => (
                                <div 
                                    key={plan.id}
                                    className={`relative flex flex-col h-full p-6 rounded-xl transition-all duration-300 border ${
                                        plan.highlight 
                                            ? 'bg-accent/5 dark:bg-accent/10 border-accent shadow-lg shadow-accent/10 scale-[1.02] z-10' 
                                            : 'bg-main-bg/30 dark:bg-dark-bg border-border-color dark:border-gray-700 hover:border-accent/50'
                                    }`}
                                >
                                    {plan.highlight && (
                                        <span className="absolute top-0 right-6 -mt-3 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                            Phổ biến
                                        </span>
                                    )}
                                    <h3 className="text-xl font-bold text-text-primary dark:text-white">{plan.name}</h3>
                                    <div className="my-4">
                                        <span className="text-3xl font-bold text-text-primary dark:text-white">{new Intl.NumberFormat('vi-VN').format(plan.price)}</span>
                                        <span className="text-sm font-medium text-text-secondary dark:text-gray-400 ml-1">{plan.currency}</span>
                                    </div>
                                    <p className="text-text-secondary dark:text-gray-400 text-xs h-8 mb-4">{plan.description}</p>
                                    
                                    <ul className="space-y-2 text-text-secondary dark:text-gray-300 mb-6 flex-grow text-sm">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <CheckIcon />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <button 
                                        onClick={() => handleBuyClick(plan)}
                                        disabled={isProcessing}
                                        className={`w-full font-bold py-2 px-4 rounded-lg transition-colors text-sm ${
                                            plan.highlight 
                                                ? 'bg-accent hover:bg-accent-600 text-white shadow-md' 
                                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary dark:text-white'
                                        }`}
                                    >
                                        {billingMode === 'subscription' ? 'Đăng ký' : 'Mua ngay'}
                                    </button>
                                </div>
                            ))}
                        </div>

                         {/* Payment Info */}
                        <div className="mt-8 bg-main-bg/50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col md:flex-row items-center gap-8">
                             <div className="flex-shrink-0 text-center">
                                <QRCodeIcon />
                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Quét QR thanh toán nhanh</p>
                            </div>
                            <div className="flex-grow text-sm">
                                 <h4 className="font-bold text-text-primary dark:text-white mb-2 text-lg">Chuyển khoản ngân hàng</h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                    <p className="text-text-secondary dark:text-gray-300"><span className="font-semibold text-text-primary dark:text-gray-200">Ngân hàng:</span> MB Bank</p>
                                    <p className="text-text-secondary dark:text-gray-300"><span className="font-semibold text-text-primary dark:text-gray-200">STK:</span> 0123456789</p>
                                    <p className="text-text-secondary dark:text-gray-300"><span className="font-semibold text-text-primary dark:text-gray-200">Chủ TK:</span> NGUYEN VAN A</p>
                                    <p className="text-text-secondary dark:text-gray-300"><span className="font-semibold text-text-primary dark:text-gray-200">Nội dung:</span> [SĐT] [Mã gói]</p>
                                 </div>
                                 <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 italic">* Vui lòng ghi đúng nội dung chuyển khoản để hệ thống tự động kích hoạt.</p>
                            </div>
                        </div>
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

             {/* Processing / Result Modal */}
             {(isProcessing || paymentStatus !== 'idle') && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-gray-200 dark:border-gray-700">
                        {isProcessing ? (
                            <div className="py-8">
                                <div className="flex justify-center mb-4 text-accent">
                                   <Spinner />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Đang xử lý...</h3>
                                <p className="text-text-secondary dark:text-gray-400 text-sm">Vui lòng không tắt trình duyệt.</p>
                            </div>
                        ) : paymentStatus === 'success' ? (
                            <div>
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Thành công!</h3>
                                <p className="text-text-secondary dark:text-gray-300 mb-6 text-sm">{statusMessage}</p>
                                <button onClick={closeStatusModal} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    Hoàn tất
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Thất bại</h3>
                                <p className="text-text-secondary dark:text-gray-300 mb-6 text-sm">{statusMessage}</p>
                                <button onClick={closeStatusModal} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    Thử lại
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
