
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserStatus, Tool } from '../types';
import { Logo } from './common/Logo';

interface HomepageProps {
  onStart: () => void;
  onAuthNavigate: (mode: 'login' | 'signup') => void;
  session?: Session | null;
  onGoToGallery?: () => void;
  onUpgrade?: () => void;
  onOpenProfile?: () => void;
  userStatus?: UserStatus | null;
  onNavigateToTool?: (tool: Tool) => void;
  onNavigateToPricing?: () => void;
}

// --- MAIN COMPONENT ---
const Homepage: React.FC<HomepageProps> = (props) => {
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
            
            <div className="relative flex h-auto min-h-screen w-full flex-col">
                <div className="layout-container flex h-full grow flex-col">
                    <Header {...props} />
                    
                    <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
                            <main className="flex flex-col gap-16 md:gap-24 mt-10 md:mt-16">
                                <Hero onStart={props.onStart} onNavigateToTool={props.onNavigateToTool} />
                                <Gallery />
                                <FeatureShowcase onStart={props.onStart} onNavigateToTool={props.onNavigateToTool} />
                                <CTA onStart={props.onStart} />
                            </main>
                            <Footer onStart={props.onStart} onNavigateToPricing={props.onNavigateToPricing} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HEADER ---
const Header: React.FC<HomepageProps> = ({ onStart, onAuthNavigate, session, onGoToGallery, onOpenProfile, userStatus, onNavigateToTool, onNavigateToPricing }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleNavClick = (tool?: Tool) => {
        if (tool && onNavigateToTool) {
            onNavigateToTool(tool);
        } else {
            onStart();
        }
        setIsMobileMenuOpen(false);
    };

    const expirationDate = userStatus?.subscriptionEnd 
        ? new Date(userStatus.subscriptionEnd).toLocaleDateString('vi-VN') 
        : 'Vĩnh viễn';

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#302839] px-4 sm:px-10 md:px-20 lg:px-40 py-3 sticky top-0 bg-[#121212]/80 backdrop-blur-sm z-50">
            <div className="flex items-center gap-4 text-white cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Logo className="w-10 h-10 text-primary" />
                <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Auflow</h2>
            </div>
            
            {/* DESKTOP MENU */}
            <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                <div className="flex items-center gap-9">
                    <button onClick={() => handleNavClick(Tool.ArchitecturalRendering)} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Tính năng</button>
                    
                    {session && (
                        <>
                            <button onClick={onGoToGallery} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Thư viện</button>
                            <button onClick={() => onOpenProfile?.()} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Giftcode</button>
                        </>
                    )}
                    {!session && (
                        <button onClick={() => onAuthNavigate('login')} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Đăng nhập</button>
                    )}
                </div>

                {session ? (
                    <div className="relative" ref={dropdownRef}>
                        <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {userStatus && (
                                <span className="text-xs font-bold text-[#DA70D6] bg-[#2a1a35] px-3 py-1 rounded-full border border-[#DA70D6]/30 hidden lg:block">
                                    {userStatus.credits} Credits
                                </span>
                            )}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8A2BE2] to-[#DA70D6] flex items-center justify-center text-white font-bold shadow-lg">
                                {session.user.email?.[0].toUpperCase()}
                            </div>
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-4 w-64 bg-[#191919] rounded-xl shadow-2xl border border-[#302839] py-2 z-50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#302839]">
                                    <p className="text-sm font-bold text-white truncate">
                                        {session.user.user_metadata?.full_name || 'Người dùng'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                                    {userStatus && (
                                        <p className="text-xs text-gray-400 mt-2">Hết hạn: <span className="text-[#DA70D6] font-semibold">{expirationDate}</span></p>
                                    )}
                                </div>
                                <button onClick={() => { onOpenProfile?.(); setIsDropdownOpen(false); }} className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-[#302839] hover:text-white transition-colors">
                                    Hồ sơ cá nhân
                                </button>
                                <button onClick={handleSignOut} className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-[#302839] transition-colors">
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button 
                        onClick={() => onAuthNavigate('signup')}
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 gradient-button text-white text-sm font-bold leading-normal tracking-[0.015em] transition-opacity"
                    >
                        <span className="truncate">Dùng thử miễn phí</span>
                    </button>
                )}
            </div>

            {/* MOBILE HAMBURGER */}
            <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(true)}>
                <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col p-6 animate-fade-in md:hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Logo className="w-10 h-10 text-primary" />
                            <h2 className="text-white text-2xl font-bold">Auflow</h2>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2">
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-6 text-lg font-medium flex-1 overflow-y-auto">
                        <button onClick={() => handleNavClick(Tool.ArchitecturalRendering)} className="text-left text-white/90 py-2 border-b border-[#302839]">Tính năng</button>
                        
                        {session ? (
                            <>
                                <button onClick={() => { onGoToGallery?.(); setIsMobileMenuOpen(false); }} className="text-left text-white/90 py-2 border-b border-[#302839]">Thư viện của tôi</button>
                                <button onClick={() => { onOpenProfile?.(); setIsMobileMenuOpen(false); }} className="text-left text-white/90 py-2 border-b border-[#302839]">Giftcode</button>
                                <button onClick={() => { onOpenProfile?.(); setIsMobileMenuOpen(false); }} className="text-left text-white/90 py-2 border-b border-[#302839]">Hồ sơ cá nhân</button>
                                <div className="mt-auto pt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A2BE2] to-[#DA70D6] flex items-center justify-center text-white font-bold">
                                            {session.user.email?.[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white">{session.user.email}</p>
                                            {userStatus && (
                                                <>
                                                    <p className="text-xs text-[#DA70D6]">{userStatus.credits} Credits</p>
                                                    <p className="text-xs text-gray-400">Hết hạn: {expirationDate}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={handleSignOut} className="w-full py-3 text-red-400 bg-[#302839] rounded-lg font-semibold">Đăng xuất</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { onAuthNavigate('login'); setIsMobileMenuOpen(false); }} className="text-left text-white/90 py-2 border-b border-[#302839]">Đăng nhập</button>
                                <button 
                                    onClick={() => { onAuthNavigate('signup'); setIsMobileMenuOpen(false); }} 
                                    className="mt-4 w-full py-3 gradient-button text-white font-bold rounded-lg"
                                >
                                    Dùng thử miễn phí
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

// --- HERO SECTION ---
const Hero: React.FC<{onStart: () => void, onNavigateToTool?: (tool: Tool) => void}> = ({ onStart, onNavigateToTool }) => {
    return (
        <div className="@container">
            <div className="@[480px]:p-0">
                <div 
                    className="flex min-h-[60vh] md:min-h-[70vh] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center text-center px-4 py-10 @[480px]:px-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(18, 18, 18, 0.6) 0%, rgba(18, 18, 18, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDuJVxJMLh56F5z4P44jRoSHcdM5w3lJPzCnkWe0-McR6c0hW7u21d6OubJX3x4WG9fetzYLjNuwucYtpHBfs54dmpw6n5sRVXD3NvfemF0lEJyulka9SidVTcoi3s1Iko71iWIXKibTZEf07a1IKOVx3C3SJqD5xPzI_XQie_oGe0ey7pFUdUtasVufndxwHuHSwiqrm-R5DNl2arwTcB49TBXM6CgJ292rewaoTLXS-sOdiZ5i5qyIM8yGYaTXwOxEEulCMSAIHlN")'
                    }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl">
                        <h1 className="text-white text-4xl font-bold leading-tight tracking-tighter @[480px]:text-6xl @[480px]:font-bold @[480px]:leading-tight">
                            Tương lai của Thiết kế Kiến trúc là đây
                        </h1>
                        <h2 className="text-[#EAEAEA] text-lg font-normal leading-normal @[480px]:text-xl @[480px]:font-normal @[480px]:leading-normal">
                            Tạo ra các ý tưởng kiến trúc và thiết kế nội thất tuyệt đẹp chỉ trong vài giây với AI.
                        </h2>
                    </div>
                    <button 
                        onClick={onStart}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 @[480px]:h-14 @[480px]:px-8 gradient-button text-white text-base font-bold leading-normal tracking-[0.015em] @[480px]:text-lg transition-opacity"
                    >
                        <span className="truncate">Bắt đầu ngay</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- GALLERY SECTION ---
const Gallery = () => {
    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-white text-3xl font-bold leading-tight tracking-tight px-4 text-center">Khám phá Sáng tạo từ AI</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                <div className="group relative col-span-2 row-span-2 overflow-hidden rounded-xl cursor-pointer">
                    <img alt="Modern minimalist interior" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA19aRDxDU95a9KRAABOaXVyi6Ua-lDchfK0VuaaWODCeI6STnJmSKXb3nbMiH6nh8bu62abuZhBLOdzwuhANyVWfLN5yzDUaTdmkqbQ7NjiAIeWxcAIfk2iFOJiHHEcr4EIQx7EhUIoDUMp6peNcm3kx9MFFpTAz34pb9pTfshlDMxvloBJajRQDxUnyej-jIRhsil6i_OXQKjcj4T9PY90eGPRNx8FGrq5DuG0gWtpjNkQrcUX3zQ3mOvycEgoWkux0JIJ-ZuB2RO"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <p className="absolute bottom-4 left-4 text-white text-lg font-bold leading-tight">Căn hộ Minimalist</p>
                </div>
                <div className="group relative overflow-hidden rounded-xl cursor-pointer">
                    <img alt="Biophilic office" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 aspect-[3/4]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwQBY5Jo6SuRs1SNtIrSkOXUDD7i_Jl1YhFtxbmbHp7YXqdPZg5z5wUAQNzlWsVATo8YEUhw94IDdQX8u3R_pH2o82HJQXqPBBEgUJPhgatIHC8npqlzhPpJuK93Pc-o-42A3Xwgv_4NaTh-opu91yvUOFTvFhhZ8uc_d31s_wKkNAILsgkoFk_EC8yz6InVaeswp9mMk08y3wwgCF-hRXsy4Y-Wabua6ZXdV40NuSOCITDHwQ70otLcKsav42nyCTWv-6fHDzjPkU"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <p className="absolute bottom-4 left-4 text-white text-base font-bold leading-tight w-4/5 line-clamp-3">Văn phòng Xanh</p>
                </div>
                <div className="group relative overflow-hidden rounded-xl cursor-pointer">
                    <img alt="Luxury hotel lobby" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 aspect-[3/4]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChNp4CTyGcoETa3aQ6sNBkNmdIyTVq2Y-8RFEDblG63HZMcRAOeStN1BqKDbUBNJElzrYbPhC1I9dXWv29UHCY0EKAdSW82rtCuQDKfa93i3A8Vl8veItjoIl_1R_ixSE5nx65zYlB_24oHkMofsqvgcsU0OeXjbxihzWdglk-CwbNJMPszKLCehMsJ6eWqUD1DWerxsSdS342uOrXtWNTs8KxnlnCA9gb8ZPAtWQUULl0gjnc9oPTjgXoyLw-CbvxQfJCoo6AtCoP"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <p className="absolute bottom-4 left-4 text-white text-base font-bold leading-tight w-4/5 line-clamp-3">Sảnh Khách sạn</p>
                </div>
                <div className="group relative col-span-2 overflow-hidden rounded-xl cursor-pointer">
                    <img alt="Modern residential villa" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 aspect-video" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnH6PNowtz_78fL1FuYMBkvsDfhslcVYF-k2gYUsUARVWSb7e9UrQVQTJhS16fiT46czvvPkSBr3vvyTVnrvAr23TdLzG4mQXD0YqiMvXSWjkJE95MzvDYuNiAX5Wo5KITrvx5qrPwrmfDCohLpBNwzXn54eFNc_AZ50sKDpCtRVZEykXzh83dLwgCx8VGyZk6Axole67ORsMOwyHdRyQK_5mrD1YgL1VcFDf3h1Xj013bp5Ebmr3NsrGNbVDQ6cyszWfyABGSW3q4"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <p className="absolute bottom-4 left-4 text-white text-lg font-bold leading-tight">Biệt thự Hiện đại</p>
                </div>
            </div>
        </section>
    );
};

// --- FEATURE SECTION ---
const FeatureShowcase: React.FC<{onStart: () => void, onNavigateToTool?: (tool: Tool) => void}> = ({ onStart, onNavigateToTool }) => {
    
    const handleFeatureClick = (tool: Tool) => {
        if (onNavigateToTool) {
            onNavigateToTool(tool);
        } else {
            onStart();
        }
    }

    return (
        <div className="flex flex-col gap-10 px-4 py-10 @container text-center items-center">
            <div className="flex flex-col gap-4 max-w-3xl">
                <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-bold @[480px]:leading-tight">
                    Hiện thực hóa ý tưởng qua 3 bước đơn giản
                </h1>
                <p className="text-[#EAEAEA] text-lg font-normal leading-normal">
                    Nền tảng trực quan của chúng tôi giúp bạn dễ dàng biến ý tưởng thành hiện thực. Từ một câu mô tả đơn giản đến bản thiết kế hoàn chỉnh, quy trình luôn liền mạch và nhanh chóng.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-0 w-full text-left">
                <div 
                    className="group relative flex flex-col gap-4 rounded-2xl border border-[#302839] bg-[#191919] p-8 transition-all duration-300 hover:border-[#7f13ec]/50 hover:shadow-2xl hover:shadow-[#7f13ec]/10 cursor-pointer"
                    onClick={() => handleFeatureClick(Tool.ArchitecturalRendering)}
                >
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7f13ec]/10 text-[#7f13ec] group-hover:bg-[#7f13ec] group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>edit_square</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-white text-xl font-bold leading-tight">1. Mô tả ý tưởng</h2>
                        <p className="text-[#ab9db9] text-base font-normal leading-relaxed">Bắt đầu với mô tả chi tiết, tải lên ảnh cảm hứng, hoặc đơn giản là chọn một phong cách bạn yêu thích.</p>
                    </div>
                </div>
                
                <div 
                    className="group relative flex flex-col gap-4 rounded-2xl border border-[#302839] bg-[#191919] p-8 transition-all duration-300 hover:border-[#7f13ec]/50 hover:shadow-2xl hover:shadow-[#7f13ec]/10 cursor-pointer"
                    onClick={() => handleFeatureClick(Tool.Renovation)}
                >
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7f13ec]/10 text-[#7f13ec] group-hover:bg-[#7f13ec] group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>auto_awesome</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-white text-xl font-bold leading-tight">2. AI Tạo phương án</h2>
                        <p className="text-[#ab9db9] text-base font-normal leading-relaxed">AI mạnh mẽ của chúng tôi sẽ phân tích và tạo ra các phương án thiết kế, biến thể đa dạng chỉ trong vài giây.</p>
                    </div>
                </div>
                
                <div 
                    className="group relative flex flex-col gap-4 rounded-2xl border border-[#302839] bg-[#191919] p-8 transition-all duration-300 hover:border-[#7f13ec]/50 hover:shadow-2xl hover:shadow-[#7f13ec]/10 cursor-pointer"
                    onClick={() => handleFeatureClick(Tool.Upscale)}
                >
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7f13ec]/10 text-[#7f13ec] group-hover:bg-[#7f13ec] group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>download_for_offline</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-white text-xl font-bold leading-tight">3. Tinh chỉnh và Xuất</h2>
                        <p className="text-[#ab9db9] text-base font-normal leading-relaxed">Tinh chỉnh chi tiết, điều chỉnh vật liệu, ánh sáng và xuất thiết kế cuối cùng của bạn ở độ phân giải cao 4K.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CTA SECTION ---
const CTA: React.FC<{onStart: () => void}> = ({ onStart }) => {
    return (
        <section className="bg-[#191919] rounded-xl p-8 md:p-16 flex flex-col items-center justify-center text-center gap-6 mx-4 border border-[#302839]">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-2xl text-white">Sẵn sàng chuyển đổi quy trình thiết kế của bạn?</h2>
            <p className="text-lg text-[#EAEAEA] max-w-xl">Tham gia cùng hàng ngàn kiến trúc sư đang kiến tạo tương lai. Không cần thẻ tín dụng để bắt đầu.</p>
            <div className="w-full max-w-lg flex flex-col sm:flex-row gap-4 mt-4">
                <button 
                    onClick={onStart}
                    className="w-full flex items-center justify-center rounded-lg h-14 px-8 gradient-button text-white text-base font-bold transition-opacity"
                >
                    Bắt đầu Sáng tạo
                </button>
            </div>
        </section>
    );
};

// --- FOOTER ---
const Footer: React.FC<{onStart: () => void, onNavigateToPricing?: () => void}> = ({ onStart, onNavigateToPricing }) => {
    return (
        <footer className="mt-24 border-t border-[#302839] py-12 px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                <div className="col-span-2 lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8 text-[#7f13ec]" />
                        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Auflow</h2>
                    </div>
                    <p className="text-gray-400 text-sm">Tương lai của thiết kế kiến trúc và nội thất, được hỗ trợ bởi trí tuệ nhân tạo.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-white">Sản phẩm</h3>
                    <button onClick={onStart} className="text-gray-400 hover:text-white text-left text-sm">Tính năng</button>
                    {/* Pricing Link Hidden in Footer */}
                    {/* {onNavigateToPricing && (
                        <button onClick={onNavigateToPricing} className="text-gray-400 hover:text-white text-left text-sm">Bảng giá</button>
                    )} */}
                    <button onClick={onStart} className="text-gray-400 hover:text-white text-left text-sm">Thư viện</button>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-white">Công ty</h3>
                    <a href="#" className="text-gray-400 hover:text-white text-sm">Về chúng tôi</a>
                    <a href="#" className="text-gray-400 hover:text-white text-sm">Tuyển dụng</a>
                    <a href="#" className="text-gray-400 hover:text-white text-sm">Liên hệ</a>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-white">Pháp lý</h3>
                    <a href="#" className="text-gray-400 hover:text-white text-sm">Chính sách bảo mật</a>
                    <a href="#" className="text-gray-400 hover:text-white text-sm">Điều khoản dịch vụ</a>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#302839] text-center text-gray-500 text-sm">
                <p>© 2025 Auflow AI. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Homepage;
