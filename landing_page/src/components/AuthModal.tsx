import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebaseClient';
import { LogIn, UserPlus, Mail, Lock, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onBackToLanding: () => void;
}

export default function AuthModal({ onBackToLanding }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const initUserRecord = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password should be at least 6 characters.');
        setLoading(false);
        return;
      }
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await initUserRecord(userCred.user);
      } catch (err: any) {
        setError(err.message || 'Failed to create account.');
      }
    } else {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await initUserRecord(userCred.user);
      } catch (err: any) {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      await initUserRecord(userCred.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
        
        {/* Back navigation button */}
        <button
          onClick={onBackToLanding}
          className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home Page
        </button>

        {/* Logo and Header Title */}
        <div className="text-center mb-8">
          <img src="/favicon.png" className="mx-auto mb-3 h-12 w-12 shadow-lg shadow-blue-500/25" alt="SwarmAnalyst Logo" />
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            {isSignUp ? 'Create Your Account' : 'Welcome to SwarmAnalyst'}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {isSignUp 
              ? 'Sign up to start orchestrating query agent swarms.' 
              : 'Sign in to access your analytics sandbox and track usage.'}
          </p>
        </div>

        {/* Error notification alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-900/50 bg-rose-950/20 p-3.5 text-xs text-rose-400 animate-fadeIn">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <UserPlus className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-900 px-2.5 font-bold tracking-wider text-slate-500">Or continue with</span>
          </div>
        </div>

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full py-2.5 px-4 border border-slate-800 bg-slate-950/40 hover:bg-slate-950 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {/* Simple inline Google G SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38C17,15.28,15,16.5,12,16.5c-3,0-5.5-2.2-5.5-5.5s2.5-5.5,5.5-5.5c1.67,0,3.14,0.67,4.22,1.78l2.1-2.1C16.46,3.31,14.39,2.5,12,2.5c-5,0-9,4-9,9s4,9,9,9c5,0,8.75-3.5,8.75-8.75A6.81,6.81,0,0,0,21.35,11.1Z" fill="#FFF" />
                </g>
              </svg>
              <span>Continue with Gmail / Google</span>
            </>
          )}
        </button>

        {/* Switch Auth mode */}
        <p className="mt-8 text-center text-xs text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="font-bold text-blue-500 hover:text-blue-400 transition-colors underline cursor-pointer"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

      </div>
    </div>
  );
}
