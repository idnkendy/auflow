import React from 'react';

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

interface HeaderProps {
  onGoHome: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onThemeToggle, theme, onSignOut }) => {
  return (
     <header className="bg-surface dark:bg-dark-bg shadow-md sticky top-0 z-40 transition-colors duration-300">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={onGoHome} title="Back to Homepage">
                <svg className="w-8 h-8 mr-2 text-accent-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 90L50 10L90 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 90L50 50L70 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-text-primary dark:text-white text-xl font-bold">Auflow</span>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={onThemeToggle} className="p-2 rounded-full text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <button onClick={onSignOut} className="text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition hidden sm:block">Sign Out</button>
                <button className="bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-600 transition">Upgrade</button>
            </div>
        </nav>
    </header>
  );
};

export default Header;