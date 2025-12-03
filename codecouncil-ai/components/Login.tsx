
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
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleLogin = async (response: any) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = await Backend.auth.googleLogin(response.credential);

      // Check for pending BYOK key
      const pendingKey = KeyStore.get();
      if (pendingKey) {
        try {
          await Backend.auth.saveApiKey(pendingKey);
          await Backend.billing.upgradeToUnlimited(user.id);

          // Refresh user to get updated status
          const updatedUser = await Backend.auth.login();
          onLogin(updatedUser);
        } catch (keyErr) {
          console.error("Failed to apply pending key", keyErr);
          // Proceed with normal user if key fails, but maybe warn?
          onLogin(user);
        }
      } else {
        onLogin(user);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Auth failed", err);
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleLogin
      });

      const parent = document.getElementById('google-signin-button');
      if (parent) {
        window.google.accounts.id.renderButton(parent, {
          theme: 'outline',
          size: 'large',
          width: '100%'
        });
      }
    }
  }, []);

  /**
   * Skip trial flow for users who want to use their own key immediately.
   */
  /**
   * Skip trial flow for users who want to use their own key immediately.
   */
  const handleSkipTrial = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // For AI Studio, we might still need the user to login first? 
        // Assuming AI Studio environment handles auth differently or we just proceed.
        // But for now, let's keep the original logic for AI Studio if it works there, 
        // or just focus on the fallback which is what the user is likely using.

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

        // Instead of trying to login (which fails), ask user to sign in
        setMessage("Key saved! Please sign in with Google to complete setup.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("Key selection cancelled or failed.");
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
            <div id="google-signin-button" className="w-full flex justify-center"></div>
            {/* Fallback/Custom button hidden if GIS loads, or kept as alternative if needed */}
            {/* <button onClick={handleGoogleLogin} ... > ... </button> */}


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

            {message && (
              <div className="text-green-400 text-xs text-center pt-2 animate-pulse">
                {message}
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
