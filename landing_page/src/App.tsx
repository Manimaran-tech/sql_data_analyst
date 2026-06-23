import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseClient';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';

type ViewMode = 'landing' | 'app';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync URL state to allow direct deep-linking of the web application sandbox
  useEffect(() => {
    const handleUrlState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('app') === 'true' || window.location.hash === '#app') {
        setViewMode('app');
        // Scroll back to top on switch
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setViewMode('landing');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    // Run on initial mount
    handleUrlState();

    // Listen for hash changes inside window
    window.addEventListener('hashchange', handleUrlState);
    return () => {
      window.removeEventListener('hashchange', handleUrlState);
    };
  }, []);

  // Update theme on root document
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'dark' || (theme === 'system' && mediaQuery.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const navigateToApp = () => {
    // Open in a new tab if supported, otherwise toggle in-line naturally
    const newWindow = window.open(`${window.location.origin}${window.location.pathname}?app=true`, '_blank');
    if (!newWindow) {
      // Fallback if browser blocks popups in the iframe sandbox
      setViewMode('app');
      window.history.pushState({}, '', `${window.location.pathname}?app=true`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToLanding = () => {
    setViewMode('landing');
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono text-xs">
        <div className="h-8 w-8 rounded bg-blue-600 animate-pulse mb-4"></div>
        Initializing Swarm Security Context...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-blue-500/25 selection:text-blue-700 dark:selection:bg-emerald-500/25 dark:selection:text-emerald-300 transition-colors duration-200">
      {viewMode === 'landing' ? (
        <LandingPage onViewWebsite={navigateToApp} theme={theme} setTheme={setTheme} user={user} />
      ) : user ? (
        <Dashboard onBackToLanding={navigateToLanding} theme={theme} setTheme={setTheme} user={user} />
      ) : (
        <AuthModal onBackToLanding={navigateToLanding} />
      )}
    </div>
  );
}

