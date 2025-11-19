
import React, { useState } from 'react';
import { PricingPlan } from '../types';
import * as paymentService from '../services/paymentService';
import Spinner from './Spinner';
import { supabase } from '../services/supabaseClient';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const QRCodeIcon = () => (
    <svg className="w-40 h-40 text-gray-800 bg-white p-2 rounded-lg" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
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

const Checkout: React.FC = () => {
    const [billingMode, setBillingMode] = useState<'subscription' | 'credits'>('subscription');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const handleBuyClick = async (plan: PricingPlan) => {
        setSelectedPlan(plan);
        setIsProcessing(true);
        setPaymentStatus('idle');
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'guest';

            // Use payment service
            // In a real app, you would likely open a modal or redirect here first
            // For this demo, we simulate a direct QR/Card process
            const result = await paymentService.processPayment(userId, plan, 'qr');
            setPaymentStatus('success');
            setStatusMessage(result.message);
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

    return (
        <div className="pb-10">
            <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-2 text-center">Thanh toán & Nâng cấp</h2>
            <p className="text-text-secondary dark:text-gray-300 mb-8 text-center max-w-2xl mx-auto">Chọn gói cước phù hợp nhất với nhu cầu thiết kế của bạn.</p>

            {/* Toggle Switch */}
            <div className="flex justify-center mb-10">
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
                        Mua Credits (Trả trước)
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-start">
                {activePlans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative flex flex-col h-full p-8 rounded-xl transition-all duration-300 border ${
                            plan.highlight 
                                ? 'bg-accent/5 dark:bg-accent/10 border-accent shadow-xl shadow-accent/10 scale-105 z-10' 
                                : 'bg-main-bg/50 dark:bg-dark-bg/50 border-border-color dark:border-gray-700 hover:border-accent/50'
                        }`}
                    >
                        {plan.highlight && (
                            <span className="absolute top-0 right-8 -mt-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                PHỔ BIẾN NHẤT
                            </span>
                        )}
                        <h3 className="text-2xl font-bold text-text-primary dark:text-white">{plan.name}</h3>
                        <p className="text-text-secondary dark:text-gray-300 mt-2 text-sm h-10">{plan.description}</p>
                        <div className="my-6">
                            <span className="text-4xl font-bold text-text-primary dark:text-white">{new Intl.NumberFormat('vi-VN').format(plan.price)}</span>
                            <span className="text-lg font-medium text-text-secondary dark:text-gray-400 ml-1">{plan.currency}</span>
                        </div>
                        
                        <ul className="space-y-3 text-text-secondary dark:text-gray-200 mb-8 flex-grow text-sm">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <CheckIcon />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <button 
                            onClick={() => handleBuyClick(plan)}
                            disabled={isProcessing}
                            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 ${
                                plan.highlight 
                                    ? 'bg-accent hover:bg-accent-600 text-white shadow-lg shadow-accent/30' 
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                        >
                            {billingMode === 'subscription' ? 'Đăng ký ngay' : 'Mua ngay'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Payment Info / QR Section (Static for reference) */}
            <div className="bg-main-bg/50 dark:bg-dark-bg/50 rounded-2xl shadow-lg p-8 border border-border-color dark:border-gray-700 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                <div className="flex-shrink-0 text-center">
                    <p className="text-text-secondary dark:text-gray-300 mb-2 text-sm font-medium">Quét mã để thanh toán thủ công (nếu cần)</p>
                    <QRCodeIcon />
                </div>
                <div className="w-full max-w-md">
                     <h3 className="text-xl font-bold text-text-primary dark:text-white mb-4">Thông tin chuyển khoản trực tiếp</h3>
                     <div className="space-y-2 text-base">
                        <p className="text-text-secondary dark:text-gray-300 flex justify-between"><span>Ngân hàng:</span> <span className="font-semibold text-text-primary dark:text-gray-100">MB Bank</span></p>
                        <p className="text-text-secondary dark:text-gray-300 flex justify-between"><span>Chủ tài khoản:</span> <span className="font-semibold text-text-primary dark:text-gray-100">NGUYEN VAN A</span></p>
                        <p className="text-text-secondary dark:text-gray-300 flex justify-between"><span>Số tài khoản:</span> <span className="font-semibold text-text-primary dark:text-gray-100 font-mono">0123456789</span></p>
                     </div>
                     <div className="mt-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-sm">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">Nội dung chuyển khoản:</p>
                        <p className="text-text-primary dark:text-yellow-200 font-mono mt-1">[SĐT] [Mã gói]</p>
                     </div>
                </div>
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
                                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Đang xử lý thanh toán...</h3>
                                <p className="text-text-secondary dark:text-gray-400 text-sm">Vui lòng không tắt trình duyệt.</p>
                            </div>
                        ) : paymentStatus === 'success' ? (
                            <div>
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Thành công!</h3>
                                <p className="text-text-secondary dark:text-gray-300 mb-6">{statusMessage}</p>
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
                                <p className="text-text-secondary dark:text-gray-300 mb-6">{statusMessage}</p>
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

export default Checkout;
