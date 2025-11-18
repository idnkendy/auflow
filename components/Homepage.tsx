
import React from 'react';

interface HomepageProps {
  onStart: () => void;
  onAuthNavigate: (mode: 'login' | 'signup') => void;
}

const StyleIcon = () => ( <svg className="h-10 w-10 text-teal-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.0391 16.2109C27.6172 17.0312 29.6094 18.9844 30.7031 21.5625C31.7969 24.1406 31.9141 27.1094 30.9375 29.8828C29.9609 32.6562 27.9297 34.9219 25.1953 36.1719C22.4609 37.4219 19.3359 37.5391 16.5234 36.4844C13.7109 35.4297 11.5234 33.3203 10.4297 30.6641C9.33594 28.0078 9.41406 25.0391 10.625 22.3438C11.8359 19.6484 14.1016 17.5 16.9141 16.3281C19.7266 15.1562 22.8906 15.1484 25.0391 16.2109Z" stroke="currentColor" strokeWidth="2"/><path d="M15.5859 22.4219C16.9141 21.6016 18.6328 21.4062 20.1953 21.9141C21.7578 22.4219 23.0469 23.5938 23.7891 25.1172C24.5312 26.6406 24.6484 28.3984 24.1016 29.9609C23.5547 31.5234 22.3828 32.7734 20.8203 33.4375" stroke="currentColor" strokeWidth="2"/><path d="M13 3C11.3438 4.19531 10.0391 5.625 9.14062 7.25M17.8906 5.15625C18.6719 6.48438 19.1484 7.94531 19.2969 9.46875M23 3C23.8359 4.89062 24.0391 6.94531 23.5547 8.92188M28 4.25C27.6172 6.55469 26.6406 8.70312 25.1953 10.5312M15.5 12.0312C14 11.25 12.2812 10.8594 10.5 10.9688" stroke="currentColor" strokeWidth="2"/></svg> );
const VisulizationIcon = () => ( <svg className="h-10 w-10 text-teal-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M33 13V27M7 13V27M13 7H27M13 33H27M20 7V13M20 27V33M7 20H13M27 20H33M20 13L7 7L20 1L33 7L20 13Z" stroke="currentColor" strokeWidth="2"/><path d="M20 27L7 21V7L20 13V27Z" stroke="currentColor" strokeWidth="2"/><path d="M20 27L33 21V7L20 13V27Z" stroke="currentColor" strokeWidth="2"/></svg> );
const LayoutsIcon = () => ( <svg className="h-10 w-10 text-teal-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 29C24.9706 29 29 24.9706 29 20C29 15.0294 24.9706 11 20 11C15.0294 11 11 15.0294 11 20C11 24.9706 15.0294 29 20 29Z" stroke="currentColor" strokeWidth="2"/><path d="M20 11V3M20 37V29M29 20H37M3 20H11M13.2217 13.2217L7.56445 7.56445M32.4355 32.4355L26.7783 26.7783M13.2217 26.7783L7.56445 32.4355M32.4355 7.56445L26.7783 13.2217" stroke="currentColor" strokeWidth="2"/></svg> );
const InstagramIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"></path></svg>);
const FacebookIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z"></path></svg>);
const TwitterIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482c-4.11- .205-7.748-2.17-10.175-5.17a4.93 4.93 0 001.524 6.572 4.903 4.903 0 01-2.228-.616c-.002.018-.002.037-.002.055a4.925 4.925 0 003.946 4.827 4.996 4.996 0 01-2.223.084 4.926 4.926 0 004.6 3.42 9.86 9.86 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63a9.935 9.935 0 002.44-2.548z"></path></svg>);

const Homepage: React.FC<HomepageProps> = ({ onStart, onAuthNavigate }) => {
    return (
        <div style={{ backgroundColor: 'rgb(229, 231, 235)' }} className="text-gray-800 font-sans antialiased">
            <Header onStart={onStart} onAuthNavigate={onAuthNavigate} />
            <main>
                <Hero onStart={onStart} />
                <div className="bg-gray-200">
                    <Features onStart={onStart} />
                    <Gallery />
                    <Testimonials />
                </div>
            </main>
            <Footer />
        </div>
    );
};

const Header: React.FC<HomepageProps> = ({ onStart, onAuthNavigate }) => {
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="bg-gray-800 shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <svg className="w-8 h-8 mr-2 text-teal-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 90L50 10L90 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M30 90L50 50L70 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-white text-xl font-bold">Auflow</span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="text-gray-300 hover:text-white transition cursor-pointer">Home</a>
                    <button onClick={onStart} className="text-gray-300 hover:text-white transition bg-transparent border-none p-0">Features</button>
                    <a href="#gallery" onClick={(e) => handleScroll(e, 'gallery')} className="text-gray-300 hover:text-white transition cursor-pointer">Gallery</a>
                    <a href="#testimonials" onClick={(e) => handleScroll(e, 'testimonials')} className="text-gray-300 hover:text-white transition cursor-pointer">Testimonials</a>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => onAuthNavigate('login')} className="text-gray-300 hover:text-white transition hidden sm:block">Login</button>
                    <button onClick={() => onAuthNavigate('signup')} className="bg-transparent border border-white text-white py-2 px-4 rounded-md hover:bg-white hover:text-gray-800 transition">Sign Up</button>
                </div>
            </nav>
        </header>
    );
};

const Hero: React.FC<{onStart: () => void}> = ({onStart}) => (
     <section id="home" className="relative text-white">
        <div className="absolute inset-0">
            <img src="https://scontent-hkg1-2.xx.fbcdn.net/v/t39.30808-6/482275892_1720323115559272_5103524246548298239_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=fYWzB-nsoI4Q7kNvwHTq6Vd&_nc_oc=AdnBPfRJPOMY5tQAUmpKdMi4AMtmtYgEdc_jrEG6gEj0IAxfR7oR5zlwpg6rKtlIoi4&_nc_zt=23&_nc_ht=scontent-hkg1-2.xx&_nc_gid=0492PVVx4X6KDj_GLr3DyA&oh=00_Afj99PGbAVNBSErFB4i6NEno5ZCDQtnoamuPFP4uc5CJnQ&oe=6921FB2D" alt="Luxury tropical villas with thatched roofs and a garden" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="relative container mx-auto px-6 py-40 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">DESIGN YOUR DREAM SPACE WITH AI</h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto">Unlock endless possibilities for architectural and landscape design</p>
            <button onClick={onStart} className="bg-teal-400 text-gray-900 font-bold py-4 px-10 rounded-md text-lg hover:bg-teal-500 transition transform hover:scale-105">
                START DESIGNING
            </button>
        </div>
    </section>
);

const Features: React.FC<{onStart: () => void}> = ({onStart}) => (
    <section id="features" className="py-20">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12 uppercase tracking-wider">AI-POWERED FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div onClick={onStart} className="bg-gray-100 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="inline-block p-4 bg-gray-200 rounded-full mb-4"><StyleIcon /></div>
                    <h3 className="text-xl font-bold my-4">Style Recommendations:</h3>
                    <p className="text-gray-600">Discover personalized design palettes</p>
                </div>
                <div onClick={onStart} className="bg-gray-100 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="inline-block p-4 bg-gray-200 rounded-full mb-4"><VisulizationIcon /></div>
                    <h3 className="text-xl font-bold my-4">3D Visualization:</h3>
                    <p className="text-gray-600">See your ideas in interactive 3D</p>
                </div>
                 <div onClick={onStart} className="bg-gray-100 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="inline-block p-4 bg-gray-200 rounded-full mb-4"><LayoutsIcon /></div>
                    <h3 className="text-xl font-bold my-4">Smart Layouts</h3>
                    <p className="text-gray-600">Optimize your space effortlessly</p>
                </div>
            </div>
        </div>
    </section>
);

const Gallery: React.FC = () => {
    const images = [
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=60",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=60",
        "https://images.unsplash.com/photo-1615875605825-5eb9bb5c683b?auto=format&fit=crop&w=800&q=60",
        "https://images.unsplash.com/photo-1594023230311-3a59d287019c?auto=format&fit=crop&w=800&q=60"
    ];
    return (
        <section id="gallery" className="pb-20">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((src, index) => (
                        <div key={index} className="overflow-hidden rounded-lg shadow-md aspect-w-4 aspect-h-3">
                            <img src={src} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Testimonials: React.FC = () => (
    <section id="testimonials" className="pb-20">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12 uppercase tracking-wider">WHAT OUR CLIENTS SAY</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
                <div className="p-8 text-center">
                    <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Anna L." className="w-24 h-24 rounded-full mx-auto mb-4" />
                    <h4 className="font-bold mb-2">Anna L.</h4>
                    <p className="text-gray-600 italic">"Transformed my home in days!"</p>
                </div>
                <div className="p-8 text-center">
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Mark T." className="w-24 h-24 rounded-full mx-auto mb-4" />
                    <h4 className="font-bold mb-2">Mark T.</h4>
                    <p className="text-gray-600 italic">"User-friendly and so inspiring!"</p>
                </div>
                <div className="p-8 text-center">
                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sophia" className="w-24 h-24 rounded-full mx-auto mb-4" />
                    <h4 className="font-bold mb-2">Sophia</h4>
                    <p className="text-gray-600 italic">"I could not imagine designing without it!"</p>
                </div>
            </div>
             <button className="mt-12 bg-transparent border border-gray-400 text-gray-600 py-2 px-6 rounded-md hover:bg-gray-800 hover:text-white hover:border-gray-800 transition">
                VIEW MORE
            </button>
        </div>
    </section>
);

const Footer: React.FC = () => (
    <footer className="bg-gray-800 text-gray-300">
        <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                <div className="mb-6 md:mb-0">
                    <div className="flex items-center justify-center md:justify-start">
                        <svg className="w-8 h-8 mr-2 text-teal-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 90L50 10L90 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M30 90L50 50L70 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-white text-xl font-bold">Auflow</span>
                    </div>
                </div>
                <div className="flex space-x-8 mb-6 md:mb-0">
                    <a href="#" className="hover:text-white">About Us</a>
                    <a href="#" className="hover:text-white">Careers</a>
                    <a href="#" className="hover:text-white">Support</a>
                    <a href="#" className="hover:text-white">Terms</a>
                    <a href="#" className="hover:text-white">Privacy</a>
                </div>
                <div className="flex space-x-6">
                    <a href="#" className="hover:text-white"><InstagramIcon /></a>
                    <a href="#" className="hover:text-white"><FacebookIcon /></a>
                    <a href="#" className="hover:text-white"><TwitterIcon /></a>
                </div>
            </div>
            <div className="text-center text-gray-500 border-t border-gray-700 mt-8 pt-6 text-sm">
                © 2024 Auflow. All rights reserved.
            </div>
        </div>
    </footer>
);

export default Homepage;
