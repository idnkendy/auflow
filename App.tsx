
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { Tool, FileData, UserStatus } from './types';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import ImageEditor from './components/ImageEditor';
import ViewSync from './components/ViewSync';
import VirtualTour from './components/VirtualTour';
import Renovation from './components/Renovation';
import FloorPlan from './components/FloorPlan';
import UrbanPlanning from './components/UrbanPlanning';
import LandscapeRendering from './components/LandscapeRendering';
import MaterialSwapper from './components/MaterialSwapper';
import Staging from './components/Staging';
import Upscale from './components/Upscale';
import HistoryPanel from './components/HistoryPanel';
import InteriorGenerator from './components/InteriorGenerator';
import MoodboardGenerator from './components/MoodboardGenerator';
import PromptSuggester from './components/PromptSuggester';
import PromptEnhancer from './components/PromptEnhancer';
import AITechnicalDrawings from './components/AITechnicalDrawings';
import SketchConverter from './components/SketchConverter';
import LuBanRuler from './components/LuBanRuler';
import FengShui from './components/FengShui';
import UserProfile from './components/UserProfile';
import { initialToolStates, ToolStates } from './state/toolState';
import Homepage from './components/Homepage';
import AuthPage from './components/auth/AuthPage';
import Spinner from './components/Spinner';
import PublicPricing from './components/PublicPricing';
import { getUserStatus, deductCredits } from './services/paymentService';
import * as jobService from './services/jobService';

const App: React.FC = () => {
  const [view, setView] = useState<'homepage' | 'auth' | 'app' | 'pricing'>('homepage');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.ArchitecturalRendering);
  const [toolStates, setToolStates] = useState<ToolStates>(initialToolStates);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark mode
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Check for pending tab focus to auto-login after email verification
  useEffect(() => {
    const handleFocus = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
            setSession(currentSession);
            if (view !== 'app') setView('app');
        }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [view]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Logic xác thực quan trọng: Xử lý OAuth redirect và session persistence
  useEffect(() => {
    const initSession = async () => {
        setLoadingSession(true);
        // supabase.auth.getSession() automatically parses the URL hash for session data
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
            setSession(initialSession);
            // Force view to 'app' if session exists, fixing white screen on redirect
            setView('app'); 
        }
        setLoadingSession(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          // If we just got a session and we were loading or on auth, go to app
          setView('app');
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []); 

  // Define fetchUserStatus using useCallback to be stable
  const fetchUserStatus = useCallback(async () => {
    if (session?.user) {
      // Check for stale jobs and refund if necessary before getting status
      await jobService.cleanupStaleJobs(session.user.id);
      
      const status = await getUserStatus(session.user.id);
      setUserStatus(status);
    } else {
      setUserStatus(null);
    }
  }, [session]);

  // Fetch credits when session changes or active tool changes
  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus, activeTool]); 
  
  const handleDeductCredits = async (amount: number, description?: string): Promise<string> => {
      if (!session?.user) throw new Error("Vui lòng đăng nhập để sử dụng.");
      const logId = await deductCredits(session.user.id, amount, description);
      await fetchUserStatus(); // Refresh UI
      return logId;
  };

  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleAuthNavigate = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setView('auth');
  };

  const handleStartDesigning = () => {
    if (session) {
        setView('app');
    } else {
        handleAuthNavigate('login');
    }
  };

  // New handler to navigate to specific tool from Homepage
  const handleNavigateToTool = (tool: Tool) => {
      setActiveTool(tool);
      if (session) {
          setView('app');
      } else {
          handleAuthNavigate('login');
      }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('homepage');
    setSession(null);
  };
  
  const handleGoHome = () => {
    setView('homepage');
  }

  const handleOpenGallery = () => {
      if (session) {
          setView('app');
          setActiveTool(Tool.History);
      }
  }

  const handleToolStateChange = <T extends keyof ToolStates>(
    tool: T,
    newState: Partial<ToolStates[T]>
  ) => {
    setToolStates(prev => ({
      ...prev,
      [tool]: {
        ...prev[tool],
        ...newState,
      },
    }));
  };

  const handleUpgrade = () => {
      if (session) {
          setView('app');
          setActiveTool(Tool.Pricing);
          handleToolStateChange(Tool.Pricing, { activeTab: 'plans' });
      } else {
          // If not logged in, go to public pricing page
          setView('pricing');
      }
  }
  
  const handleOpenProfile = () => {
      if (session) {
          setView('app');
          setActiveTool(Tool.Pricing);
          // Updated: Default to 'plans' when opening profile from header
          handleToolStateChange(Tool.Pricing, { activeTab: 'plans' });
      }
  }

  const handleSendToViewSync = (image: FileData) => {
     handleToolStateChange(Tool.ViewSync, {
        sourceImage: image,
        resultImages: [], // Clear previous results
        error: null,
        customPrompt: '', // Clear any old prompt
     });
    setActiveTool(Tool.ViewSync);
  };
  
  const handleSendToViewSyncWithPrompt = (image: FileData, prompt: string) => {
     handleToolStateChange(Tool.ViewSync, {
        sourceImage: image,
        customPrompt: prompt, // Set the prompt from suggester
        resultImages: [],
        error: null,
        selectedPerspective: 'default',
        selectedAtmosphere: 'default',
        selectedFraming: 'none',
        sceneType: 'exterior'
     });
    setActiveTool(Tool.ViewSync);
  };
  
  const userCredits = userStatus?.credits || 0;

  const renderTool = () => {
    switch (activeTool) {
      case Tool.FloorPlan:
        return <FloorPlan 
            state={toolStates.FloorPlan}
            onStateChange={(newState) => handleToolStateChange(Tool.FloorPlan, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.Renovation:
        return <Renovation 
            state={toolStates.Renovation}
            onStateChange={(newState) => handleToolStateChange(Tool.Renovation, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.ArchitecturalRendering:
        return <ImageGenerator 
            state={toolStates.ArchitecturalRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.ArchitecturalRendering, newState)}
            onSendToViewSync={handleSendToViewSync} 
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.InteriorRendering:
        return <InteriorGenerator
            state={toolStates.InteriorRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.InteriorRendering, newState)}
            onSendToViewSync={handleSendToViewSync} 
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.UrbanPlanning:
        return <UrbanPlanning
            state={toolStates.UrbanPlanning}
            onStateChange={(newState) => handleToolStateChange(Tool.UrbanPlanning, newState)}
            onSendToViewSync={handleSendToViewSync}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.LandscapeRendering:
        return <LandscapeRendering
            state={toolStates.LandscapeRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.LandscapeRendering, newState)}
            onSendToViewSync={handleSendToViewSync}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.AITechnicalDrawings:
        return <AITechnicalDrawings
            state={toolStates.AITechnicalDrawings}
            onStateChange={(newState) => handleToolStateChange(Tool.AITechnicalDrawings, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.SketchConverter:
        return <SketchConverter
            state={toolStates.SketchConverter}
            onStateChange={(newState) => handleToolStateChange(Tool.SketchConverter, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.LuBanRuler:
        return <LuBanRuler
            state={toolStates.LuBanRuler}
            onStateChange={(newState) => handleToolStateChange(Tool.LuBanRuler, newState)}
        />;
      case Tool.FengShui:
        return <FengShui
            state={toolStates.FengShui}
            onStateChange={(newState) => handleToolStateChange(Tool.FengShui, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.ViewSync:
        return <ViewSync 
            state={toolStates.ViewSync}
            onStateChange={(newState) => handleToolStateChange(Tool.ViewSync, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.VirtualTour:
        return <VirtualTour
            state={toolStates.VirtualTour}
            onStateChange={(newState) => handleToolStateChange(Tool.VirtualTour, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.PromptSuggester:
        return <PromptSuggester
            state={toolStates.PromptSuggester}
            onStateChange={(newState) => handleToolStateChange(Tool.PromptSuggester, newState)}
            onSendToViewSyncWithPrompt={handleSendToViewSyncWithPrompt}
        />;
       case Tool.PromptEnhancer:
        return <PromptEnhancer
            state={toolStates.PromptEnhancer}
            onStateChange={(newState) => handleToolStateChange(Tool.PromptEnhancer, newState)}
        />;
      case Tool.MaterialSwap:
        return <MaterialSwapper 
            state={toolStates.MaterialSwap}
            onStateChange={(newState) => handleToolStateChange(Tool.MaterialSwap, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.Staging:
        return <Staging 
            state={toolStates.Staging}
            onStateChange={(newState) => handleToolStateChange(Tool.Staging, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.Upscale:
        return <Upscale 
            state={toolStates.Upscale}
            onStateChange={(newState) => handleToolStateChange(Tool.Upscale, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.Moodboard:
        return <MoodboardGenerator 
            state={toolStates.Moodboard}
            onStateChange={(newState) => handleToolStateChange(Tool.Moodboard, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.VideoGeneration:
        return <VideoGenerator 
            state={toolStates.VideoGeneration}
            onStateChange={(newState) => handleToolStateChange(Tool.VideoGeneration, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.ImageEditing:
        return <ImageEditor 
            state={toolStates.ImageEditing}
            onStateChange={(newState) => handleToolStateChange(Tool.ImageEditing, newState)}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
      case Tool.History:
        return <HistoryPanel />;
      case Tool.Pricing:
        return session ? (
            <UserProfile 
                session={session} 
                initialTab={toolStates.Pricing.activeTab || 'plans'} 
                onTabChange={(tab) => handleToolStateChange(Tool.Pricing, { activeTab: tab })}
                onPurchaseSuccess={fetchUserStatus}
            /> 
        ) : null;
      default:
        return <ImageGenerator 
            state={toolStates.ArchitecturalRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.ArchitecturalRendering, newState)}
            onSendToViewSync={handleSendToViewSync}
            userCredits={userCredits}
            onDeductCredits={handleDeductCredits}
        />;
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  if (session) {
    if (view === 'homepage') {
        return (
            <Homepage 
                onStart={() => setView('app')} 
                onAuthNavigate={() => setView('app')} 
                session={session} 
                onGoToGallery={handleOpenGallery}
                onUpgrade={handleUpgrade}
                onOpenProfile={handleOpenProfile}
                userStatus={userStatus}
                onNavigateToTool={handleNavigateToTool}
            />
        );
    }
    return (
        <div className="min-h-screen bg-[#121212] font-display text-[#EAEAEA] flex flex-col transition-colors duration-300">
            <Header 
                onGoHome={handleGoHome} 
                onThemeToggle={handleThemeToggle} 
                theme={theme} 
                onSignOut={handleSignOut} 
                onOpenGallery={handleOpenGallery} 
                onUpgrade={handleUpgrade} 
                onOpenProfile={handleOpenProfile} 
                userStatus={userStatus}
                user={session.user}
                onToggleNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
            />
            <div className="relative flex flex-col md:flex-row flex-grow h-[calc(100vh-64px)] overflow-hidden">
                {/* Navigation Sidebar - Responsive */}
                <Navigation 
                    activeTool={activeTool} 
                    setActiveTool={(tool) => {
                        setActiveTool(tool);
                        setIsMobileNavOpen(false); // Close on select mobile
                    }} 
                    isMobileOpen={isMobileNavOpen}
                    onCloseMobile={() => setIsMobileNavOpen(false)}
                />
                
                {/* Main Content Area */}
                <main className="flex-1 bg-[#191919]/90 backdrop-blur-md md:m-6 md:ml-0 md:rounded-2xl shadow-lg border-t md:border border-[#302839] overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8 relative z-0">
                    {renderTool()}
                </main>
            </div>
        </div>
    );
  }

  if (view === 'auth') {
    return <AuthPage onGoHome={() => setView('homepage')} initialMode={authMode} />;
  }

  if (view === 'pricing') {
      return <PublicPricing onGoHome={() => setView('homepage')} onAuthNavigate={handleAuthNavigate} />;
  }
  
  return <Homepage onStart={handleStartDesigning} onAuthNavigate={handleAuthNavigate} onNavigateToPricing={() => setView('pricing')} />;
};

export default App;
