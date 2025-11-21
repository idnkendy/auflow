
import React from 'react';
import { PricingPlan } from '../types';

// --- ICONS ---
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const LogoIcon = () => (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="size-6 text-[#7f13ec]">
        <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
    </svg>
);

// --- DATA ---
const plans: PricingPlan[] = [
    {
        id: 'plan_starter',
        name: 'Starter',
        price: 299000,
        currency: 'đ',
        features: [
            'Tổng 3,000 Credits',
            'Gói tiêu chuẩn',
            'Hạn sử dụng: 1 Tháng',
            'Truy cập tất cả công cụ AI',
            'Render tốc độ tiêu chuẩn'
        ],
        type: 'subscription',
        credits: 3000,
        durationMonths: 1,
        description: 'Gói trải nghiệm cho người mới bắt đầu.'
    },
    {
        id: 'plan_pro',
        name: 'Pro',
        price: 599000,
        currency: 'đ',
        features: [
            'Tổng 7,000 Credits',
            '(6,000 Gốc + 1,000 Tặng)',
            'Tăng thêm ~17% Credits',
            'Hạn sử dụng: 2 Tháng',
            'Truy cập tất cả công cụ AI',
            'Render tốc độ cao'
        ],
        type: 'subscription',
        credits: 7000,
        highlight: true,
        durationMonths: 2,
        description: 'Lựa chọn tốt nhất cho Kiến trúc sư & Freelancer.'
    },
    {
        id: 'plan_ultra',
        name: 'Ultra',
        price: 1999000,
        currency: 'đ',
        features: [
            'Tổng 25,000 Credits',
            '(20,000 Gốc + 5,000 Tặng)',
            'Tăng thêm 25% Credits',
            'Hạn sử dụng: 3 Tháng',
            'Chi phí rẻ nhất/credit',
            'Hỗ trợ ưu tiên 24/7',
            'Tính năng Early Access'
        ],
        type: 'subscription',
        credits: 25000,
        durationMonths: 3,
        description: 'Giải pháp tối ưu cho Studio và Doanh nghiệp.'
    }
];

interface PublicPricingProps {
    onGoHome: () => void;
    onAuthNavigate: (mode: 'login' | 'signup') => void;
}

const PublicPricing: React.FC<PublicPricingProps> = ({ onGoHome, onAuthNavigate }) => {
    return (
        <div className="bg-[#121212] font-display text-[#EAEAEA] min-h-screen flex flex-col">
            <style>{`
                .gradient-button {
                    background-image: linear-gradient(to right, #8A2BE2, #DA70D6);
                }
                .gradient-button:hover {
                    opacity: 0.9;
                }
            `}</style>

            {/* HEADER */}
            <header className="flex items-center justify-between px-4 sm:px-10 md:px-20 py-4 sticky top-0 bg-[#121212]/80 backdrop-blur-sm z-50 border-b border-[#302839]">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
                    <LogoIcon />
                    <h2 className="text-white text-xl font-bold">Auflow</h2>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => onAuthNavigate('login')} className="text-white/80 hover:text-white text-sm font-medium">Đăng nhập</button>
                    <button 
                        onClick={() => onAuthNavigate('signup')}
                        className="hidden sm:flex bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                        Đăng ký miễn phí
                    </button>
                </div>
            </header>

            <main className="flex-grow px-4 sm:px-10 py-16 max-w-[1200px] mx-auto w-full">
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Bảng giá đơn giản, minh bạch</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Chọn gói cước phù hợp với nhu cầu sáng tạo của bạn. Không phí ẩn, hủy bất cứ lúc nào.
                    </p>
                </div>

                {/* PRICING GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id}
                            className={`relative flex flex-col h-full p-8 rounded-2xl transition-all duration-300 border ${
                                plan.highlight 
                                    ? 'bg-[#191919] border-[#7f13ec] shadow-2xl shadow-[#7f13ec]/20 transform md:-translate-y-4' 
                                    : 'bg-[#191919]/50 border-[#302839] hover:border-[#7f13ec]/50'
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-gradient-to-r from-[#8A2BE2] to-[#DA70D6] text-white text-xs uppercase font-bold px-4 py-1.5 rounded-full shadow-lg">
                                        Phổ biến nhất
                                    </span>
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm min-h-[40px]">{plan.description}</p>
                            </div>

                            <div className="text-center mb-6">
                                <div className="flex justify-center items-baseline">
                                    <span className="text-4xl font-bold text-white">{new Intl.NumberFormat('vi-VN').format(plan.price)}</span>
                                    <span className="text-lg text-gray-400 ml-1">{plan.currency}</span>
                                </div>
                                <div className="mt-4 inline-block bg-[#2a1a35] text-[#DA70D6] px-4 py-2 rounded-lg border border-[#DA70D6]/30">
                                    <span className="block text-xs uppercase tracking-wide opacity-80">Nhận ngay</span>
                                    <span className="text-xl font-bold">{new Intl.NumberFormat('vi-VN').format(plan.credits || 0)} Credits</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => onAuthNavigate('signup')}
                                className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ${
                                    plan.highlight 
                                        ? 'gradient-button text-white shadow-lg' 
                                        : 'bg-white text-black hover:bg-gray-200'
                                }`}
                            >
                                {plan.highlight ? 'Bắt đầu ngay' : 'Chọn gói này'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ SECTION */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Câu hỏi thường gặp</h2>
                    <div className="space-y-4">
                        <div className="bg-[#191919] p-6 rounded-xl border border-[#302839]">
                            <h3 className="font-bold text-white mb-2">Credits dùng để làm gì?</h3>
                            <p className="text-gray-400 text-sm">Credits là đơn vị tiền tệ để sử dụng các công cụ AI. Ví dụ: Tạo 1 ảnh tốn 10 credits, tạo video tốn 50 credits. Bạn chỉ bị trừ credits khi AI tạo ra kết quả thành công.</p>
                        </div>
                        <div className="bg-[#191919] p-6 rounded-xl border border-[#302839]">
                            <h3 className="font-bold text-white mb-2">Credits có cộng dồn không?</h3>
                            <p className="text-gray-400 text-sm">Có. Khi bạn mua thêm gói mới, số credits sẽ được cộng dồn vào tài khoản hiện tại của bạn và hạn sử dụng sẽ được gia hạn theo gói mới nhất.</p>
                        </div>
                        <div className="bg-[#191919] p-6 rounded-xl border border-[#302839]">
                            <h3 className="font-bold text-white mb-2">Tôi có thể hủy gói không?</h3>
                            <p className="text-gray-400 text-sm">Đây là gói mua một lần (One-time purchase) theo tháng, không tự động gia hạn (Subscription). Bạn không cần lo lắng về việc bị trừ tiền tự động.</p>
                        </div>
                        <div className="bg-[#191919] p-6 rounded-xl border border-[#302839]">
                            <h3 className="font-bold text-white mb-2">Có gói dùng thử miễn phí không?</h3>
                            <p className="text-gray-400 text-sm">Có! Mỗi tài khoản mới đăng ký sẽ được tặng ngay 50 Credits để trải nghiệm đầy đủ các tính năng.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="mt-16 border-t border-[#302839] py-12 px-4 bg-[#121212]">
                <div className="max-w-[1200px] mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <LogoIcon />
                        <h2 className="text-white text-xl font-bold">Auflow</h2>
                    </div>
                    <p className="text-gray-500 text-sm">© 2025 Auflow AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicPricing;
