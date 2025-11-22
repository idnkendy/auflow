
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { PricingPlan, Transaction } from '../types';
import * as paymentService from '../services/paymentService';
import Spinner from './Spinner';
import Checkout from './Checkout'; // Import Checkout component

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 md:h-20 md:w-20 text-gray-400 bg-gray-200 rounded-full p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

interface UserProfileProps {
    session: Session;
    initialTab?: 'profile' | 'plans' | 'history';
    onTabChange: (tab: 'profile' | 'plans' | 'history') => void;
    onPurchaseSuccess?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ session, initialTab = 'profile', onTabChange, onPurchaseSuccess }) => {
    // Changed default to 'profile'
    const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'history'>(initialTab === 'plans' ? 'profile' : initialTab);
    
    // History State
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        // Fallback to profile if plans is requested but hidden
        setActiveTab(initialTab === 'plans' ? 'profile' : initialTab);
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

    // Mock Profile Data
    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.full_name || "Người dùng Auflow";
    const joinDate = new Date(session.user.created_at).toLocaleDateString('vi-VN');

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-100px)]">
            {/* Sidebar */}
            <div className="lg:w-1/4 bg-surface dark:bg-dark-bg rounded-xl shadow-sm border border-border-color dark:border-gray-700 p-6 flex flex-col items-center text-center h-fit flex-shrink-0">
                <div className="mb-4">
                    <UserIcon />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white">{userName}</h2>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 truncate max-w-full">{userEmail}</p>
                
                {/* Mobile: Horizontal Scroll, Desktop: Vertical Stack */}
                <div className="w-full flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                    {/* Hidden Plans Button */}
                    {/* <button 
                        onClick={() => handleTabClick('plans')}
                        className={`flex-shrink-0 w-auto lg:w-full text-left px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'plans' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Gói cước & Thanh toán
                    </button> */}

                    <button 
                        onClick={() => handleTabClick('profile')}
                        className={`flex-shrink-0 w-auto lg:w-full text-left px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Thông tin tài khoản
                    </button>
                    
                    <button 
                        onClick={() => handleTabClick('history')}
                        className={`flex-shrink-0 w-auto lg:w-full text-left px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'history' ? 'bg-accent text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Lịch sử giao dịch
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="lg:w-3/4 bg-surface dark:bg-dark-bg rounded-xl shadow-sm border border-border-color dark:border-gray-700 p-4 sm:p-6 lg:p-8 overflow-y-auto scrollbar-hide flex-grow h-full">
                
                {/* === TAB: PLANS (Hidden) === */}
                {/* {activeTab === 'plans' && (
                    <div className="animate-fade-in h-full">
                        <Checkout />
                    </div>
                )} */}

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
                                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Mã giao dịch</th>
                                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Dịch vụ</th>
                                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Số tiền</th>
                                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Ngày</th>
                                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionHistory.map((tx) => (
                                            <tr key={tx.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 font-mono whitespace-nowrap">{tx.transaction_code || tx.id.substring(0, 8)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{tx.plan_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
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
