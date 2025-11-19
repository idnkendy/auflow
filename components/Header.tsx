
import React, { useState, useRef, useEffect } from 'react';
import { UserStatus } from '../types';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 100-10 5 5 0 000 10z" />
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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


interface HeaderProps {
  onGoHome: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  onSignOut: () => void;
  onOpenGallery?: () => void;
  onUpgrade?: () => void;
  onOpenProfile?: () => void;
  userStatus?: UserStatus | null;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onThemeToggle, theme, onSignOut, onOpenGallery, onUpgrade, onOpenProfile, userStatus }) => {
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
     <header className="bg-surface dark:bg-dark-bg shadow-md sticky top-0 z-40 transition-colors duration-300 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center py-3">
            <div className="flex items-center cursor-pointer" onClick={onGoHome} title="Back to Homepage">
                <svg className="w-8 h-8 mr-2 text-accent-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 90L50 10L90 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 90L50 50L70 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-text-primary dark:text-white text-xl font-bold">Auflow</span>
            </div>
            <div className="flex items-center space-x-4">
                {/* Status Display - External (Visible only when dropdown is closed) */}
                {!isDropdownOpen && userStatus && (
                    <div className="flex items-center gap-2">
                         {/* Credits */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-semibold border border-yellow-200 dark:border-yellow-700/50 animate-fade-in cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsDropdownOpen(true)}>
                            <CoinIcon />
                            <span>{userStatus.credits} Credits</span>
                        </div>

                        {/* Subscription Date */}
                         {userStatus.subscriptionEnd && (
                            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border animate-fade-in cursor-pointer hover:opacity-80 transition-opacity ${
                                userStatus.isExpired 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50' 
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                            }`} onClick={() => setIsDropdownOpen(true)}>
                                <ClockIcon />
                                <span>
                                    {userStatus.isExpired 
                                        ? 'Hết hạn' 
                                        : `Hạn: ${new Date(userStatus.subscriptionEnd).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <button onClick={onThemeToggle} className="p-2 rounded-full text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                
                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-text-secondary dark:text-gray-300 hover:ring-2 hover:ring-accent transition-all focus:outline-none"
                        title="Tài khoản"
                    >
                        <UserIcon />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-sm font-bold text-text-primary dark:text-white mb-2">Tài khoản của tôi</p>
                                {/* Credit Display - Internal */}
                                {userStatus && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm text-yellow-700 dark:text-yellow-400 font-semibold bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-md border border-yellow-200 dark:border-yellow-800/50">
                                             <div className="flex items-center gap-2">
                                                 <CoinIcon />
                                                 <span>Credits khả dụng</span>
                                             </div>
                                             <span>{userStatus.credits}</span>
                                        </div>
                                        
                                        {userStatus.subscriptionEnd ? (
                                            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border ${
                                                userStatus.isExpired 
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' 
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                                            }`}>
                                                <ClockIcon />
                                                {userStatus.isExpired ? (
                                                    <span className="font-bold">Gói tháng đã hết hạn</span>
                                                ) : (
                                                    <span>Hết hạn: {new Date(userStatus.subscriptionEnd).toLocaleDateString('vi-VN')}</span>
                                                )}
                                            </div>
                                        ) : (
                                             <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                                Chưa đăng ký gói tháng
                                             </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="py-1">
                                {onOpenProfile && (
                                    <button 
                                        onClick={() => {
                                            onOpenProfile();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <ProfileIcon />
                                        Hồ sơ cá nhân
                                    </button>
                                )}

                                {onUpgrade && (
                                    <button 
                                        onClick={() => {
                                            onUpgrade();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <StarIcon />
                                        Nâng cấp gói (Upgrade)
                                    </button>
                                )}

                                {onOpenGallery && (
                                    <button 
                                        onClick={() => {
                                            onOpenGallery();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <GalleryIcon />
                                        Thư viện của tôi
                                    </button>
                                )}
                            </div>
                            
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            
                            <button 
                                onClick={onSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                            >
                                <LogoutIcon />
                                Đăng xuất
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
