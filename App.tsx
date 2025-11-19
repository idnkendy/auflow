
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
import { getUserStatus } from './services/paymentService';

const App: React.FC = () => {
  const [view, setView] = useState<'homepage' | 'auth' | 'app'>('homepage');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.ArchitecturalRendering);
  const [toolStates, setToolStates] = useState<ToolStates>(initialToolStates);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  // Check for pending tab focus to auto-login after email verification
  useEffect(() => {
    const handleFocus = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
            setSession(currentSession);
            setView('app');
        }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    setLoadingSession(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      if (session && view === 'auth') {
          setView('app');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  // Define fetchUserStatus using useCallback to be stable
  const fetchUserStatus = useCallback(async () => {
    if (session?.user) {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('homepage');
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
          // Default to 'plans' tab when upgrading
          handleToolStateChange(Tool.Pricing, { activeTab: 'plans' });
      }
  }
  
  const handleOpenProfile = () => {
      if (session) {
          setView('app');
          setActiveTool(Tool.Pricing);
          // Default to 'profile' tab when clicking profile
          handleToolStateChange(Tool.Pricing, { activeTab: 'profile' });
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
        // Reset other options to ensure a clean state
        selectedPerspective: 'default',
        selectedAtmosphere: 'default',
        selectedFraming: 'none',
        sceneType: 'exterior'
     });
    setActiveTool(Tool.ViewSync);
  };

  const renderTool = () => {
    switch (activeTool) {
      case Tool.FloorPlan:
        return <FloorPlan 
            state={toolStates.FloorPlan}
            onStateChange={(newState) => handleToolStateChange(Tool.FloorPlan, newState)}
        />;
      case Tool.Renovation:
        return <Renovation 
            state={toolStates.Renovation}
            onStateChange={(newState) => handleToolStateChange(Tool.Renovation, newState)}
        />;
      case Tool.ArchitecturalRendering:
        return <ImageGenerator 
            state={toolStates.ArchitecturalRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.ArchitecturalRendering, newState)}
            onSendToViewSync={handleSendToViewSync} 
        />;
      case Tool.InteriorRendering:
        return <InteriorGenerator
            state={toolStates.InteriorRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.InteriorRendering, newState)}
            onSendToViewSync={handleSendToViewSync} 
        />;
      case Tool.UrbanPlanning:
        return <UrbanPlanning
            state={toolStates.UrbanPlanning}
            onStateChange={(newState) => handleToolStateChange(Tool.UrbanPlanning, newState)}
            onSendToViewSync={handleSendToViewSync}
        />;
      case Tool.LandscapeRendering:
        return <LandscapeRendering
            state={toolStates.LandscapeRendering}
            onStateChange={(newState) => handleToolStateChange(Tool.LandscapeRendering, newState)}
            onSendToViewSync={handleSendToViewSync}
        />;
      case Tool.AITechnicalDrawings:
        return <AITechnicalDrawings
            state={toolStates.AITechnicalDrawings}
            onStateChange={(newState) => handleToolStateChange(Tool.AITechnicalDrawings, newState)}
        />;
      case Tool.SketchConverter:
        return <SketchConverter
            state={toolStates.SketchConverter}
            onStateChange={(newState) => handleToolStateChange(Tool.SketchConverter, newState)}
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
        />;
      case Tool.ViewSync:
        return <ViewSync 
            state={toolStates.ViewSync}
            onStateChange={(newState) => handleToolStateChange(Tool.ViewSync, newState)}
        />;
      case Tool.VirtualTour:
        return <VirtualTour
            state={toolStates.VirtualTour}
            onStateChange={(newState) => handleToolStateChange(Tool.VirtualTour, newState)}
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
        />;
      case Tool.Staging:
        return <Staging 
            state={toolStates.Staging}
            onStateChange={(newState) => handleToolStateChange(Tool.Staging, newState)}
        />;
      case Tool.Upscale:
        return <Upscale 
            state={toolStates.Upscale}
            onStateChange={(newState) => handleToolStateChange(Tool.Upscale, newState)}
        />;
      case Tool.Moodboard:
        return <MoodboardGenerator 
            state={toolStates.Moodboard}
            onStateChange={(newState) => handleToolStateChange(Tool.Moodboard, newState)}
        />;
      case Tool.VideoGeneration:
        return <VideoGenerator 
            state={toolStates.VideoGeneration}
            onStateChange={(newState) => handleToolStateChange(Tool.VideoGeneration, newState)}
        />;
      case Tool.ImageEditing:
        return <ImageEditor 
            state={toolStates.ImageEditing}
            onStateChange={(newState) => handleToolStateChange(Tool.ImageEditing, newState)}
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
        />;
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-main-bg dark:bg-gray-900 flex items-center justify-center">
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
            />
        );
    }
    return (
        <div className="min-h-screen bg-main-bg dark:bg-gray-900 font-sans flex flex-col transition-colors duration-300">
            <Header 
                onGoHome={handleGoHome} 
                onThemeToggle={handleThemeToggle} 
                theme={theme} 
                onSignOut={handleSignOut} 
                onOpenGallery={handleOpenGallery} 
                onUpgrade={handleUpgrade} 
                onOpenProfile={handleOpenProfile} 
                userStatus={userStatus}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6 flex-grow">
                <Navigation activeTool={activeTool} setActiveTool={setActiveTool} />
                <main className="flex-1 bg-surface dark:bg-dark-bg p-6 sm:p-8 rounded-lg shadow-sm overflow-auto">
                    {renderTool()}
                </main>
            </div>
        </div>
    );
  }

  if (view === 'auth') {
    return <AuthPage onGoHome={() => setView('homepage')} initialMode={authMode} />;
  }
  
  return <Homepage onStart={handleStartDesigning} onAuthNavigate={handleAuthNavigate} />;
};

export default App;