
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Backend } from '../services/backend';
import KeyStore from '../services/keyStore';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await Backend.auth.login();
      onLogin(user);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Auth failed", err);
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  /**
   * Skip trial flow for users who want to use their own key immediately.
   */
  const handleSkipTrial = async () => {
      setIsLoading(true);
      setError(null);

      try {
          if (window.aistudio) {
              await window.aistudio.openSelectKey();
              
              // Login and immediately upgrade
              const user = await Backend.auth.login();
              const upgradedUser = await Backend.billing.upgradeToUnlimited(user.id);
              onLogin(upgradedUser);
              
              setIsLoading(false);
          } else {
          // Fallback: prompt user for API key and store locally
          const key = window.prompt('Enter your Google Gemini API Key (kept locally in this browser).');
          if (!key) {
          setError("Key selection cancelled.");
          setIsLoading(false);
          return;
          }
          KeyStore.set(key.trim());

          // Login and upgrade to BYOK mode
          const user = await Backend.auth.login();
          const upgradedUser = await Backend.billing.upgradeToUnlimited(user.id);
          onLogin(upgradedUser);
          setIsLoading(false);
          }
      } catch (err: any) {
          setError("Key selection cancelled.");
          setIsLoading(false);
      }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -right-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#0F1629]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-slate-800/50">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/30 mx-auto mb-6">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">CodeCouncil AI</h1>
          <p className="text-slate-400 text-sm">Agent-as-a-Service Platform</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-200 text-center">
              Identify to access Command Room
            </h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-indigo-300 font-bold mb-1">FREE TRIAL INCLUDED</p>
                <p className="text-xs text-slate-400">
                  New accounts receive <strong>400 Credits</strong>.
                </p>
                <p className="text-[10px] text-slate-500 mt-2">
                   Enough for 5 Startup Audits or 1 Enterprise Deep Dive.
                </p>
            </div>
            <p className="text-xs text-slate-500 text-center px-4">
              To deploy your AI workforce, authenticate with Google. Once trial credits are exhausted, you will be prompted to connect your own Gemini API Key.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full group relative flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
                onClick={handleSkipTrial}
                disabled={isLoading}
                className="w-full text-center py-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
            >
                Have a Personal API Key? Skip trial.
            </button>
            
            {error && (
                <div className="text-red-400 text-xs text-center pt-2 animate-pulse">
                    {error}
                </div>
            )}
            
            <p className="text-[10px] text-slate-500 text-center pt-2">
              Secure authentication powered by Google Identity.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#0B1120] p-4 text-center border-t border-slate-800">
           <div className="flex justify-center gap-4 text-xs text-slate-600 font-mono">
              <span>SECURE ENCLAVE</span>
              <span>•</span>
              <span>v2.5.0-RC1</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
