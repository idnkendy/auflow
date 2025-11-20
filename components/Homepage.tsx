
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserStatus, Tool, PricingPlan } from '../types';

interface HomepageProps {
  onStart: () => void;
  onAuthNavigate: (mode: 'login' | 'signup') => void;
  session?: Session | null;
  onGoToGallery?: () => void;
  onUpgrade?: () => void;
  onOpenProfile?: () => void;
  userStatus?: UserStatus | null;
  onNavigateToTool?: (tool: Tool) => void;
}

// --- ICONS ---
const LogoIcon = () => (
    <svg className="w-8 h-8 text-accent-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 90L50 10L90 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 90L50 50L70 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const ArrowRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const GalleryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const StarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>);
const ProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const CoinIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


// --- MAIN COMPONENT ---
const Homepage: React.FC<HomepageProps> = (props) => {
    return (
        <div className="bg-gray-950 text-white font-sans selection:bg-accent-500 selection:text-white">
            <Header {...props} />
            <main>
                <Hero onStart={props.onStart} onNavigateToTool={props.onNavigateToTool} />
                <Stats />
                <FeatureShowcase onStart={props.onStart} onNavigateToTool={props.onNavigateToTool} />
                <Gallery />
                <Testimonials />
                <CTA onStart={props.onStart} />
            </main>
            <Footer onNavigateToTool={props.onNavigateToTool} onStart={props.onStart} />
        </div>
    );
};

// --- HEADER ---
const Header: React.FC<HomepageProps> = ({ onStart, onAuthNavigate, session, onGoToGallery, onUpgrade, onOpenProfile, userStatus, onNavigateToTool }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const scrollToId = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleFeatureClick = () => {
        if (onNavigateToTool) {
            onNavigateToTool(Tool.ArchitecturalRendering);
        } else {
            onStart();
        }
    };

    return (
        <header 
            className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
                isScrolled 
                ? 'bg-gray-950/80 backdrop-blur-lg border-gray-800 py-3' 
                : 'bg-transparent border-transparent py-5'
            }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <LogoIcon />
                    <span className="text-xl font-bold tracking-tight">Auflow</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <button onClick={handleFeatureClick} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        Tính năng
                    </button>
                    <button 
                        onClick={() => session && onGoToGallery ? onGoToGallery() : scrollToId('gallery')} 
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        Thư viện
                    </button>
                </nav>

                <div className="flex items-center gap-4">
                    {session ? (
                         <div className="relative" ref={dropdownRef}>
                            <div className="flex items-center gap-3">
                                {/* Quick Stats for Desktop */}
                                {userStatus && (
                                    <div className="hidden lg:flex items-center gap-3 mr-2">
                                         <div className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                                            <CoinIcon /> {userStatus.credits}
                                         </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:border-accent-500 hover:text-white hover:bg-gray-700 transition-all"
                                >
                                    <UserIcon />
                                </button>
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-4 w-72 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 py-2 z-50 animate-fade-in overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-700 bg-gray-800/50">
                                        <p className="text-sm font-bold text-white truncate">
                                            {session.user.user_metadata?.full_name || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mb-3">{session.user.email}</p>
                                        
                                        {userStatus && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs bg-gray-950 p-2 rounded border border-gray-700">
                                                    <span className="text-gray-400">Credits:</span>
                                                    <span className="text-yellow-400 font-bold">{userStatus.credits}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="py-1">
                                        {onOpenProfile && (
                                            <button onClick={() => { onOpenProfile(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                                                <ProfileIcon /> Hồ sơ cá nhân
                                            </button>
                                        )}
                                        {onUpgrade && (
                                            <button onClick={() => { onUpgrade(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                                                <StarIcon /> Nâng cấp gói
                                            </button>
                                        )}
                                        {onGoToGallery && (
                                             <button onClick={() => { onGoToGallery(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                                                <GalleryIcon /> Thư viện của tôi
                                            </button>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                                        <LogoutIcon /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button onClick={() => onAuthNavigate('login')} className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2">Đăng nhập</button>
                            <button onClick={() => onAuthNavigate('signup')} className="text-sm font-bold bg-white text-gray-950 hover:bg-gray-200 px-5 py-2.5 rounded-full transition-colors shadow-lg shadow-white/10">
                                Đăng ký
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// --- HERO SECTION ---
const Hero: React.FC<{onStart: () => void, onNavigateToTool?: (tool: Tool) => void}> = ({ onStart, onNavigateToTool }) => {
    const handleStart = () => {
        if (onNavigateToTool) {
            onNavigateToTool(Tool.ArchitecturalRendering);
        } else {
            onStart();
        }
    };

    return (
        <section className="relative pt-40 pb-24 lg:pt-52 lg:pb-36 overflow-hidden">
            {/* Enhanced Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-accent-600/20 rounded-full blur-[120px] opacity-50 mix-blend-screen"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[50rem] h-[50rem] bg-blue-700/20 rounded-full blur-[150px] opacity-40 mix-blend-screen"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800/40 border border-gray-700/50 text-accent-300 text-xs font-semibold mb-8 backdrop-blur-md animate-fade-in-up shadow-inner shadow-white/5">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                    </span>
                    Trí tuệ nhân tạo Kiến trúc 2025
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] animate-fade-in-up delay-100 text-white">
                    Thiết kế không gian <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-blue-400 to-purple-500">trong tầm tay</span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200 font-light">
                    Nền tảng AI mạnh mẽ giúp biến phác thảo thành kiệt tác 3D, cải tạo nội thất tức thì và quy hoạch đô thị với tốc độ chưa từng có.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up delay-300">
                    <button 
                        onClick={handleStart}
                        className="h-14 px-8 rounded-full bg-accent-600 hover:bg-accent-500 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] flex items-center gap-2 group"
                    >
                        Bắt đầu miễn phí
                        <span className="group-hover:translate-x-1 transition-transform"><ArrowRightIcon /></span>
                    </button>
                </div>

                {/* Hero Image Mockup */}
                <div className="mt-20 relative max-w-6xl mx-auto animate-fade-in-up delay-500">
                    <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-3 shadow-2xl backdrop-blur-xl">
                         {/* Abstract decorative UI header */}
                         <div className="flex gap-2 mb-3 px-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                         </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-900">
                             <img 
                                src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2400&auto=format&fit=crop" 
                                alt="App Interface" 
                                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                        </div>

                        <div className="absolute -bottom-6 -right-6 bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-700 hidden md:flex items-center gap-4 animate-bounce-slow z-20">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <CheckCircleIcon />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Render Speed</p>
                                <p className="text-lg font-bold text-white">~12s</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- STATS ---
const Stats = () => (
    <section className="border-y border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                {[
                    { label: 'Kiến trúc sư', value: '1K+' },
                    { label: 'Ảnh đã tạo', value: '100K+' },
                    { label: 'Công cụ AI', value: '10+' },
                    { label: 'Tốc độ', value: '4x' },
                ].map((stat, i) => (
                    <div key={i} className="group cursor-default">
                        <h3 className="text-4xl font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">{stat.value}</h3>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- FEATURES (BENTO GRID STYLE) ---
const FeatureShowcase: React.FC<{onStart: () => void, onNavigateToTool?: (tool: Tool) => void}> = ({ onStart, onNavigateToTool }) => {
    const handleNavigate = (tool: Tool) => {
        if (onNavigateToTool) {
            onNavigateToTool(tool);
        } else {
            onStart();
        }
    };

    return (
        <section id="features" className="py-32 relative bg-gray-950">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Hệ sinh thái AI toàn diện</h2>
                    <p className="text-gray-400 text-xl font-light">Không chỉ là tạo ảnh. Auflow là trợ lý đắc lực cho mọi giai đoạn thiết kế của bạn.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[300px]">
                    
                    {/* Feature 1: Large Render */}
                    <div 
                        className="md:col-span-4 row-span-2 bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden relative group cursor-pointer hover:border-gray-700 transition-all"
                        onClick={() => handleNavigate(Tool.ArchitecturalRendering)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/90 z-10"></div>
                        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop" alt="Render" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80" />
                        
                        <div className="absolute bottom-0 left-0 p-8 z-20">
                            <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-accent-600/30">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Render Kiến trúc</h3>
                            <p className="text-gray-300 max-w-lg text-lg">Chuyển đổi bản vẽ CAD, SketchUp hoặc phác thảo tay thành hình ảnh 3D chân thực trong vài giây.</p>
                        </div>
                    </div>

                    {/* Feature 2: Renovation */}
                    <div 
                        className="md:col-span-2 bg-gray-900 rounded-3xl border border-gray-800 p-8 relative group cursor-pointer hover:border-gray-700 transition-all hover:-translate-y-1"
                        onClick={() => handleNavigate(Tool.Renovation)}
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-600/30">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Cải tạo AI</h3>
                        <p className="text-gray-400 text-sm">Chụp ảnh hiện trạng và để AI đề xuất phương án mới ngay lập tức.</p>
                         <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                         </div>
                    </div>

                    {/* Feature 3: Video */}
                    <div 
                        className="md:col-span-2 bg-gray-900 rounded-3xl border border-gray-800 p-8 relative group cursor-pointer hover:border-gray-700 transition-all hover:-translate-y-1"
                        onClick={() => handleNavigate(Tool.VideoGeneration)}
                    >
                         <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-600/30">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Video AI</h3>
                        <p className="text-gray-400 text-sm">Tạo video diễn họa, walkthrough từ ảnh tĩnh đơn giản.</p>
                    </div>

                     {/* Feature 4: Urban */}
                    <div 
                        className="md:col-span-6 bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden relative group cursor-pointer hover:border-gray-700 transition-all flex flex-col md:flex-row"
                        onClick={() => handleNavigate(Tool.UrbanPlanning)}
                    >
                         <div className="p-8 md:w-1/2 flex flex-col justify-center z-20">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-green-600/30">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Quy hoạch & Cảnh quan lớn</h3>
                            <p className="text-gray-400 text-lg mb-6">Xử lý các dự án quy mô lớn. Từ bản vẽ phân lô đến phối cảnh chim bay của cả khu đô thị.</p>
                            <span className="text-green-400 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">Khám phá ngay <ArrowRightIcon /></span>
                        </div>
                        <div className="md:w-1/2 relative">
                             <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                             <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="Urban" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

// --- GALLERY (MASONRY) ---
const Gallery = () => {
    const images = [
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80",
    ];
    return (
        <section id="gallery" className="pb-32 bg-gray-950">
            <div className="container mx-auto px-6">
                 <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Thư viện cảm hứng</h2>
                    <p className="text-gray-400">Những tác phẩm được tạo ra bởi cộng đồng Auflow.</p>
                </div>
                
                <div className="columns-2 md:columns-3 gap-6 space-y-6">
                    {images.map((src, index) => (
                        <div key={index} className="break-inside-avoid rounded-2xl overflow-hidden relative group cursor-pointer">
                            <img src={src} alt="Gallery" className="w-full h-auto transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <div>
                                     <span className="text-white text-sm font-bold block mb-1">Modern Villa</span>
                                     <span className="text-gray-300 text-xs">Generated by User</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- TESTIMONIALS ---
const Testimonials = () => (
    <section className="py-24 border-t border-gray-900 bg-gray-950">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { name: "KTS. Minh Hoàng", role: "Studio MH", text: "Auflow đã thay đổi hoàn toàn cách tôi present ý tưởng cho khách hàng. Nhanh và quá đẹp." },
                    { name: "Ngọc Anh", role: "Freelancer", text: "Công cụ cải tạo AI cực kỳ thông minh. Khách hàng của tôi rất thích các phương án visual này." },
                    { name: "Tuấn Phạm", role: "Construction Co.", text: "Tiết kiệm 70% thời gian render. Chất lượng 4K không thua gì các phần mềm chuyên dụng." }
                ].map((item, i) => (
                    <div key={i} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 relative hover:border-gray-700 transition-colors">
                        <div className="text-accent-600 text-5xl absolute top-4 left-6 font-serif opacity-20">"</div>
                        <p className="text-gray-300 mb-6 relative z-10 pt-2 leading-relaxed">{item.text}</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                            <div>
                                <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                <span className="text-gray-500 text-xs">{item.role}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- CTA ---
const CTA: React.FC<{onStart: () => void}> = ({ onStart }) => (
    <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-900/20"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-600/30 blur-[120px] rounded-full"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Sẵn sàng hiện thực hóa ý tưởng?</h2>
            <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto">Tham gia cùng hàng ngàn kiến trúc sư và nhà thiết kế đang sử dụng Auflow mỗi ngày.</p>
            <button onClick={onStart} className="px-10 py-5 bg-white text-gray-950 font-bold rounded-full text-lg hover:bg-gray-100 transition-colors shadow-2xl shadow-white/10">
                Bắt đầu miễn phí ngay
            </button>
        </div>
    </section>
);

// --- FOOTER ---
const Footer: React.FC<{onNavigateToTool?: (tool: Tool) => void, onStart: () => void}> = ({ onNavigateToTool, onStart }) => {
    const handleLinkClick = (tool: Tool) => {
        if (onNavigateToTool) {
            onNavigateToTool(tool);
        } else {
            onStart();
        }
    };

    return (
        <footer className="border-t border-gray-800 bg-gray-950 pt-20 pb-10 text-sm">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <LogoIcon />
                            <span className="text-white font-bold text-xl">Auflow</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">Nền tảng AI Kiến trúc hàng đầu Việt Nam. Giúp KTS và Nhà thiết kế làm việc hiệu quả hơn.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-base">Sản phẩm</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><button onClick={() => handleLinkClick(Tool.ArchitecturalRendering)} className="hover:text-white transition-colors text-left">Render 3D</button></li>
                            <li><button onClick={() => handleLinkClick(Tool.Renovation)} className="hover:text-white transition-colors text-left">Cải tạo AI</button></li>
                            <li><button onClick={() => handleLinkClick(Tool.VideoGeneration)} className="hover:text-white transition-colors text-left">Video Generator</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-base">Tài nguyên</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Cộng đồng</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn</a></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-white font-bold mb-6 text-base">Liên hệ</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">support@auflow.com</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Hà Nội, Việt Nam</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-600 flex flex-col md:flex-row justify-between items-center">
                    <p>© 2025 Auflow Inc. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-400">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-400">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Homepage;
