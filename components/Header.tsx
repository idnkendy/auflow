
import React, { useState, useRef, useEffect } from 'react';
import { UserStatus } from '../types';
import { User } from '@supabase/supabase-js';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 100-10 5 5 0 000 10z" />
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const GalleryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CoinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

// Logo from Homepage
const LogoIcon = () => (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#7f13ec]">
        <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fill-rule="evenodd"></path>
    </svg>
);


interface HeaderProps {
  onGoHome: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  onSignOut: () => void;
  onOpenGallery?: () => void;
  onUpgrade?: () => void;
  onOpenProfile?: () => void;
  userStatus?: UserStatus | null;
  user?: User | null;
  onToggleNav?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onThemeToggle, theme, onSignOut, onOpenGallery, onUpgrade, onOpenProfile, userStatus, user, onToggleNav }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
     <header className="bg-[#121212]/80 backdrop-blur-md shadow-sm sticky top-0 z-40 transition-colors duration-300 px-4 sm:px-6 lg:px-8 border-b border-[#302839]">
        <nav className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
                {/* Hamburger for Mobile */}
                <button 
                    onClick={onToggleNav} 
                    className="md:hidden text-gray-400 hover:text-white focus:outline-none p-1 rounded-md hover:bg-[#302839]"
                >
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </button>

                <div className="flex items-center cursor-pointer group" onClick={onGoHome} title="Trang chủ">
                    <LogoIcon />
                    <span className="text-white text-xl font-bold tracking-tight ml-2 hidden sm:inline">Auflow</span>
                </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-6">
                {/* Status Display - External */}
                {!isDropdownOpen && userStatus && (
                    <div className="flex items-center gap-3">
                         {/* Credits */}
                        <div 
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#2a1a35] text-[#DA70D6] rounded-full text-sm font-semibold border border-[#DA70D6]/30 cursor-pointer hover:bg-[#3a2a45] transition-colors" 
                            onClick={() => setIsDropdownOpen(true)}
                            title="Số dư Credits"
                        >
                            <CoinIcon />
                            <span>{userStatus.credits}</span>
                        </div>
                    </div>
                )}

                <button 
                    onClick={onThemeToggle} 
                    className="p-2 rounded-full text-gray-400 hover:bg-[#302839] hover:text-white transition-all" 
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                
                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8A2BE2] to-[#DA70D6] flex items-center justify-center text-white shadow-md ring-2 ring-[#191919]">
                            <span className="text-xs font-bold">{user?.email?.[0].toUpperCase()}</span>
                        </div>
                        <ChevronDownIcon />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-72 bg-[#191919] rounded-xl shadow-2xl border border-[#302839] py-1 z-50 animate-fade-in origin-top-right">
                            <div className="px-5 py-4 border-b border-[#302839] bg-[#202020]">
                                {user ? (
                                    <div className="mb-3">
                                        <p className="text-sm font-bold text-white truncate">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-white mb-2">Tài khoản</p>
                                )}
                                
                                {/* Credit Display - Internal */}
                                {userStatus && (
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-center justify-between text-sm text-[#DA70D6] font-semibold bg-[#2a1a35] px-3 py-2 rounded-lg border border-[#DA70D6]/30">
                                             <div className="flex items-center gap-2">
                                                 <CoinIcon />
                                                 <span>Credits</span>
                                             </div>
                                             <span>{userStatus.credits}</span>
                                        </div>
                                        
                                        {userStatus.subscriptionEnd ? (
                                            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
                                                userStatus.isExpired 
                                                ? 'bg-red-900/20 text-red-400 border-red-800/50' 
                                                : 'bg-blue-900/20 text-blue-400 border-blue-800/50'
                                            }`}>
                                                <ClockIcon />
                                                {userStatus.isExpired ? (
                                                    <span className="font-bold">Gói tháng đã hết hạn</span>
                                                ) : (
                                                    <span>VIP đến: {new Date(userStatus.subscriptionEnd).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                )}
                                            </div>
                                        ) : (
                                             <div className="text-xs text-gray-400 px-1">
                                                Chưa đăng ký gói VIP
                                             </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="py-1">
                                {onOpenProfile && (
                                    <button 
                                        onClick={() => { onOpenProfile(); setIsDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#302839] hover:text-white flex items-center gap-3"
                                    >
                                        <ProfileIcon /> Gói cước & Hồ sơ
                                    </button>
                                )}

                                {onOpenGallery && (
                                    <button 
                                        onClick={() => { onOpenGallery(); setIsDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#302839] hover:text-white flex items-center gap-3"
                                    >
                                        <GalleryIcon /> Thư viện của tôi
                                    </button>
                                )}
                            </div>
                            
                            <div className="border-t border-[#302839] my-1"></div>
                            
                            <button 
                                onClick={onSignOut}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#302839] flex items-center gap-3 rounded-b-lg"
                            >
                                <LogoutIcon /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    </header>
  );
};

export default Header;
