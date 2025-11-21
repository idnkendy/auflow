
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserStatus, Tool } from '../types';

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

// --- ICONS (SVG from design) ---
const LogoIcon = () => (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="size-6 text-primary">
        <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
    </svg>
);

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
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#302839] px-4 sm:px-10 md:px-20 lg:px-40 py-3 sticky top-0 bg-[#121212]/80 backdrop-blur-sm z-50">
            <div className="flex items-center gap-4 text-white cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <LogoIcon />
                <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Auflow</h2>
            </div>
            
            <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                <div className="flex items-center gap-9">
                    <button onClick={() => handleNavClick(Tool.ArchitecturalRendering)} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Tính năng</button>
                    {!session && onNavigateToPricing && (
                        <button onClick={onNavigateToPricing} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Bảng giá</button>
                    )}
                    {session && (
                        <button onClick={onGoToGallery} className="text-white/80 hover:text-white text-sm font-medium leading-normal">Thư viện</button>
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
            <button className="md:hidden text-white" onClick={() => session ? onOpenProfile?.() : onAuthNavigate('login')}>
                <span className="material-symbols-outlined">menu</span>
            </button>
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
                        <LogoIcon />
                        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Auflow</h2>
                    </div>
                    <p className="text-gray-400 text-sm">Tương lai của thiết kế kiến trúc và nội thất, được hỗ trợ bởi trí tuệ nhân tạo.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-white">Sản phẩm</h3>
                    <button onClick={onStart} className="text-gray-400 hover:text-white text-left text-sm">Tính năng</button>
                    {onNavigateToPricing && (
                        <button onClick={onNavigateToPricing} className="text-gray-400 hover:text-white text-left text-sm">Bảng giá</button>
                    )}
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
