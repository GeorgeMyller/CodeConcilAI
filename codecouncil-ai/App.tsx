
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AGENTS } from './constants';
import { FileContent, AgentResult, AnalysisStatus, OutputLanguage, AgentRole, UserProfile, AuditSession } from './types';
import FileUpload from './components/FileUpload';
import RepoInput from './components/RepoInput';
import AgentCard from './components/AgentCard';
import ExportActions from './components/ExportActions';
import Login from './components/Login';
import { runAgentAnalysis } from './services/geminiService';
import { Backend } from './services/backend';
import KeyStore from './services/keyStore';

const LANG_CONFIG: Record<OutputLanguage, { label: string, flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  pt: { label: 'Português', flag: '🇧🇷' },
  fr: { label: 'Français', flag: '🇫🇷' }
};

type Tier = 'startup' | 'enterprise';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [results, setResults] = useState<Record<string, AgentResult>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'github'>('upload');
  const [language, setLanguage] = useState<OutputLanguage>('en');
  const [selectedTier, setSelectedTier] = useState<Tier>('enterprise');
  
  // Backend State
  const [history, setHistory] = useState<AuditSession[]>([]);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
        // Try to restore session from "Backend" (LocalStorage)
        try {
            const userData = await Backend.auth.login();
            
            if (userData) {
                setUser(userData);
                loadHistory();
            }
        } catch (e) {
            console.log("No active session found.");
        }
    };
    checkSession();
  }, []);

  const loadHistory = async () => {
    const data = await Backend.db.getHistory();
    setHistory(data);
  };

  // Initialize results state
  useEffect(() => {
    resetResults();
  }, []);

  const resetResults = () => {
    const initialResults: Record<string, AgentResult> = {};
    AGENTS.forEach(agent => {
      initialResults[agent.role] = {
        role: agent.role,
        response: '',
        status: AnalysisStatus.IDLE
      };
    });
    setResults(initialResults);
  };

  // Force English for Startup tier
  useEffect(() => {
    if (selectedTier === 'startup') {
        setLanguage('en');
    }
  }, [selectedTier]);

  // Filter active agents based on Tier
  const activeAgents = useMemo(() => {
    if (selectedTier === 'startup') {
        // Startup tier gets Architect, QA, and Product only
        return AGENTS.filter(a => [AgentRole.ARCHITECT, AgentRole.QA, AgentRole.PRODUCT].includes(a.role));
    }
    return AGENTS;
  }, [selectedTier]);

  const handleFilesSelected = (uploadedFiles: FileContent[]) => {
    if (inputMode === 'github') {
        setFiles(uploadedFiles);
    } else {
        setFiles(prev => [...prev, ...uploadedFiles]);
    }
  };

  /**
   * Manually trigger the Key Selection Dialog.
   * Used for "Top-Up" or "Change Key" actions.
   */
  const handleUpdateKey = async () => {
    if (!user) return;

    try {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            
            // If successful, ensure user is marked as unlimited
            const upgradedUser = await Backend.billing.upgradeToUnlimited(user.id);
            setUser(upgradedUser);
            
            // Feedback to user
            alert("✅ API Key Connected Successfully!\n\nYou are now using your personal Google Cloud API Key. No platform credits will be consumed.");
        } else {
        const key = window.prompt('Enter your Google Gemini API Key (kept locally in this browser).');
        if (!key) return;
        KeyStore.set(key.trim());
        const upgradedUser = await Backend.billing.upgradeToUnlimited(user.id);
        setUser(upgradedUser);
        alert("✅ API Key saved locally. You are now in BYOK mode.");
        }
    } catch (e) {
        console.error("Key update cancelled or failed", e);
    }
  };

  const startAnalysis = useCallback(async () => {
    if (files.length === 0 || !user) return;
    
    // 1. Check Credits via Backend
    const cost = Backend.billing.getCosts()[selectedTier];
    const canAfford = user.isUnlimited || user.credits >= cost;
    
    if (!canAfford) {
      const confirmUpgrade = window.confirm(
          `Trial credits exhausted (Cost: ${cost}, Balance: ${user.credits}).\n\n` +
          `To continue, you must connect your own Gemini API Key.\n\n` +
          `Proceed to connect Key?`
      );

      if (confirmUpgrade) {
          await handleUpdateKey();
          // We don't auto-resume here to ensure the user sees the success message
          // and manually clicks "Deploy" again with confidence.
          return;
      } else {
          return;
      }
    }

    // 2. Process Transaction (only deduct if NOT unlimited)
    if (!user.isUnlimited) {
        const success = await Backend.billing.processTransaction(user.id, cost);
        if (!success) {
          alert("Transaction failed unexpectedly. Please try again.");
          return;
        }
        // Update local user state to reflect new balance
        const updatedUser = await Backend.auth.login();
        setUser(updatedUser);
    }

    setIsProcessing(true);

    // Set all active agents to analyzing
    setResults(prev => {
      const next = { ...prev };
      activeAgents.forEach(agent => {
        next[agent.role] = { ...next[agent.role], status: AnalysisStatus.ANALYZING };
      });
      return next;
    });

    const finalResults: Record<string, AgentResult> = { ...results };

    const promises = activeAgents.map(async (agent) => {
      const start = Date.now();
      const result = await runAgentAnalysis(files, agent, language);
      const duration = Date.now() - start;

      const agentResult: AgentResult = {
          role: agent.role,
          response: result.text,
          citations: result.citations,
          status: result.text.startsWith('Error') ? AnalysisStatus.ERROR : AnalysisStatus.COMPLETED,
          executionTimeMs: duration
      };

      setResults(prev => ({
        ...prev,
        [agent.role]: agentResult
      }));
      
      finalResults[agent.role] = agentResult;
    });

    await Promise.all(promises);

    // 3. Save to Backend History
    await Backend.db.saveAudit({
      tier: selectedTier,
      filesCount: files.length,
      results: finalResults
    });
    
    await loadHistory();
    setIsProcessing(false);

  }, [files, language, activeAgents, user, selectedTier, results]);

  const reset = () => {
    setFiles([]);
    resetResults();
  };

  const handleLogout = () => {
      Backend.auth.logout();
      setUser(null);
  };

  const handleLoadSession = (session: AuditSession) => {
      setResults(session.results);
      const agentCount = Object.keys(session.results).length;
      setSelectedTier(agentCount > 3 ? 'enterprise' : 'startup');
      setView('dashboard');
  };

  if (!user) {
      return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 print:bg-white print:text-black">
      
      {/* ======================== */}
      {/* MAIN APPLICATION UI      */}
      {/* ======================== */}
      <div className="print:hidden flex flex-col min-h-screen">
        <nav className="border-b border-slate-800/60 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                C
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-100">
                CodeCouncil <span className="text-indigo-400">AI</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                 <button 
                    onClick={() => setView('dashboard')}
                    className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Command Room
                 </button>
                 <button 
                    onClick={() => setView('history')}
                    className={`text-sm font-medium transition-colors ${view === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Archives
                 </button>
              </div>

              {/* Status / Credits / Key Manager */}
              {user.isUnlimited ? (
                 <button 
                    onClick={handleUpdateKey}
                    className="group flex items-center gap-2 px-3 py-1.5 bg-amber-900/10 border border-amber-500/50 rounded-md hover:bg-amber-900/20 hover:border-amber-500 transition-all cursor-pointer"
                    title="Click to change API Key"
                 >
                    <span className="text-amber-500 text-xs">⚡</span>
                    <div className="flex flex-col items-start leading-none">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-amber-500 tracking-wider">PERSONAL KEY</span>
                            <span className="text-[8px] bg-amber-500 text-black px-1 rounded font-bold">ACTIVE</span>
                        </div>
                        <span className="text-[8px] text-amber-500/70 group-hover:text-amber-400 group-hover:underline">Click to Change Key</span>
                    </div>
                 </button>
              ) : (
                 <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md flex items-center gap-2">
                    <span className="text-green-500 text-xs">⚡</span>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-bold text-slate-300 tracking-wider">{user.credits} CR</span>
                        <span className="text-[8px] text-slate-500">TRIAL QUOTA</span>
                    </div>
                 </div>
              )}
              
              {/* User Profile */}
              <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                 <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-200">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                 </div>
                 <button onClick={handleLogout} className="group relative">
                    <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-9 h-9 rounded-full border border-slate-700 group-hover:border-slate-500 transition-colors"
                    />
                    <div className="absolute top-full right-0 mt-2 w-32 py-1 bg-slate-900 border border-slate-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <span className="block px-4 py-2 text-xs text-red-400 hover:bg-slate-800 text-center">Sign Out</span>
                    </div>
                 </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          
          {view === 'dashboard' ? (
             <>
             <div className="text-center mb-12 animate-fade-in-up">
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                 Hire a Senior Engineering Team<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-blue-500">in 30 Seconds</span>
               </h1>
               <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
                 CodeCouncil AI provides an on-demand swarm of specialized agents. 
                 Architecture reviews, security audits, and product roadmaps—delivered instantly.
               </p>
             </div>
   
             <div className="max-w-5xl mx-auto mb-16">
               <div className="service-command-center bg-[#0F1629] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm relative">
                 <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-800">
                     <button 
                       onClick={() => setSelectedTier('startup')}
                       disabled={isProcessing}
                       className={`p-6 text-left transition-all border-r border-slate-800 relative ${
                           selectedTier === 'startup' ? 'bg-slate-800/50' : 'bg-transparent hover:bg-slate-800/30'
                       }`}
                     >
                       <div className="flex justify-between items-start mb-2">
                           <h3 className={`font-bold text-lg ${selectedTier === 'startup' ? 'text-white' : 'text-slate-400'}`}>Startup Audit</h3>
                           {selectedTier === 'startup' && <span className="text-green-400 text-xs font-mono border border-green-900 bg-green-900/20 px-2 py-0.5 rounded">SELECTED</span>}
                       </div>
                       <p className="text-sm text-slate-400 mb-4">Essential validation for MVPs and prototypes.</p>
                       <div className="flex justify-between items-end">
                            <ul className="text-xs text-slate-500 space-y-1 font-mono">
                                <li>✓ Architect, QA, Product Agents</li>
                                <li>✓ English Only</li>
                            </ul>
                            <span className="text-xs font-bold text-yellow-500 border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 rounded">50 CR</span>
                       </div>
                     </button>
   
                     <button 
                       onClick={() => setSelectedTier('enterprise')}
                       disabled={isProcessing}
                       className={`p-6 text-left transition-all relative ${
                           selectedTier === 'enterprise' ? 'bg-slate-800/50' : 'bg-transparent hover:bg-slate-800/30'
                       }`}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <h3 className={`font-bold text-lg ${selectedTier === 'enterprise' ? 'text-indigo-300' : 'text-slate-400'}`}>Enterprise Deep Dive</h3>
                           {selectedTier === 'enterprise' && <span className="text-indigo-400 text-xs font-mono border border-indigo-900 bg-indigo-900/20 px-2 py-0.5 rounded">SELECTED</span>}
                       </div>
                       <p className="text-sm text-slate-400 mb-4">Full compliance, security, and market grounding.</p>
                       <div className="flex justify-between items-end">
                            <ul className="text-xs text-slate-500 space-y-1 font-mono">
                                <li>✓ Full 6-Agent Swarm</li>
                                <li>✓ Multi-Language Support</li>
                            </ul>
                            <span className="text-xs font-bold text-yellow-500 border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 rounded">150 CR</span>
                       </div>
                     </button>
                 </div>
   
                 <div className="border-b border-slate-800 p-4 bg-[#131b2e] flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                     <button
                       onClick={() => setInputMode('upload')}
                       className={`px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                         inputMode === 'upload' 
                           ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                           : 'text-slate-400 hover:text-slate-200'
                       }`}
                     >
                       <span>📁</span> Upload Files
                     </button>
                     <button
                       onClick={() => setInputMode('github')}
                       className={`px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                         inputMode === 'github' 
                           ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                           : 'text-slate-400 hover:text-slate-200'
                       }`}
                     >
                       <span>🐙</span> GitHub Repo
                     </button>
                   </div>
   
                   <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-widest hidden md:block">Output</span>
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                         {(Object.keys(LANG_CONFIG) as OutputLanguage[]).map((lang) => {
                           const isLocked = selectedTier === 'startup' && lang !== 'en';
                           return (
                           <button 
                             key={lang}
                             onClick={() => !isLocked && setLanguage(lang)}
                             disabled={isLocked}
                             title={isLocked ? "Upgrade to Enterprise for Multi-language" : LANG_CONFIG[lang].label}
                             className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                               language === lang 
                               ? 'bg-indigo-900/50 text-white border border-indigo-500/30 shadow-sm' 
                               : isLocked
                                   ? 'text-slate-700 cursor-not-allowed opacity-50'
                                   : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                             }`}
                           >
                             <span className="text-base grayscale-[0.5]">{LANG_CONFIG[lang].flag}</span>
                             <span className="uppercase text-xs font-bold">{lang}</span>
                             {isLocked && <span className="text-[8px] text-slate-600">🔒</span>}
                           </button>
                         )})}
                      </div>
                   </div>
                 </div>
   
                 <div className="p-6 md:p-8 bg-gradient-to-b from-slate-900/50 to-slate-900/80">
                   {inputMode === 'upload' ? (
                      <FileUpload onFilesSelected={handleFilesSelected} disabled={isProcessing} />
                   ) : (
                      <RepoInput onFilesLoaded={handleFilesSelected} disabled={isProcessing} />
                   )}
                   
                   {files.length > 0 && (
                     <div className="mt-8 flex flex-col items-center animate-fade-in">
                       <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-400 mb-6 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-green-500"></span>
                         {files.length} files staged for analysis
                       </div>
   
                       <div className="flex gap-4">
                         <button
                           onClick={startAnalysis}
                           disabled={isProcessing}
                           className={`group relative px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-indigo-500/25 overflow-hidden ${
                             isProcessing 
                               ? 'bg-slate-800 cursor-wait opacity-70' 
                               : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                           }`}
                         >
                           <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></div>
                           <span className="relative flex items-center gap-2 text-lg">
                             {isProcessing ? (
                               <>
                                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 Provisioning Team...
                               </>
                             ) : (
                               <>
                                 🚀 Deploy {selectedTier === 'startup' ? 'Startup' : 'Enterprise'} Workforce
                               </>
                             )}
                           </span>
                         </button>
                         
                         {!isProcessing && (
                            <button
                            onClick={reset}
                            className="px-6 py-4 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                          >
                            Clear Context
                          </button>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>
   
             {(files.length > 0 || Object.values(results).some((r: AgentResult) => r.status !== AnalysisStatus.IDLE)) && (
                <div className="mb-6 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400 text-sm font-mono uppercase tracking-widest">
                     <div className="h-px w-8 bg-slate-800"></div>
                     Live Agent Feed
                     <div className="h-px w-8 bg-slate-800"></div>
                   </div>
                   
                   <ExportActions results={results} />
                </div>
             )}
   
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {activeAgents.map((agent) => (
                 <div key={agent.role} className="h-[450px]">
                   <AgentCard 
                     definition={agent} 
                     result={results[agent.role]} 
                   />
                 </div>
               ))}
             </div>
             </>
          ) : (
             <div className="max-w-4xl mx-auto animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-3">
                   <span className="text-indigo-400">Archive</span> / Audit Logs
                </h2>
                
                {history.length === 0 ? (
                    <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
                        <p className="text-slate-500">No audits found in the archives.</p>
                        <button onClick={() => setView('dashboard')} className="mt-4 text-indigo-400 hover:text-indigo-300">Start your first analysis</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(session => (
                            <div key={session.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                            session.tier === 'enterprise' 
                                            ? 'border-indigo-500/30 text-indigo-400 bg-indigo-900/20' 
                                            : 'border-green-500/30 text-green-400 bg-green-900/20'
                                        }`}>
                                            {session.tier}
                                        </span>
                                        <span className="text-slate-300 font-mono text-sm">{new Date(session.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-500 text-sm">
                                        Analyzed {session.filesCount} files • {Object.keys(session.results).length} Agents engaged
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleLoadSession(session)}
                                    className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 group-hover:text-white group-hover:border-indigo-500/50 transition-all text-sm font-medium"
                                >
                                    Review Report
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}

        </main>

        <footer className="border-t border-slate-800 bg-[#050911] py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-500 text-sm">
            <div>
               <h4 className="text-slate-200 font-bold mb-4 text-lg">CodeCouncil AI</h4>
               <p>Your on-demand AI engineering workforce. Audits, compliance, and architecture reviews in seconds.</p>
            </div>
            <div>
               <h4 className="text-slate-200 font-bold mb-4">Capabilities</h4>
               <ul className="space-y-2">
                  <li>• Architecture Review</li>
                  <li>• Security & Compliance Audit</li>
                  <li>• Market Viability Analysis</li>
               </ul>
            </div>
            <div>
               <h4 className="text-slate-200 font-bold mb-4">System Status</h4>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Gemini 2.5 Flash: Active</span>
               </div>
               <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2 h-2 rounded-full ${user.isUnlimited ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                  <div className="flex flex-col">
                      <span>Billing: {user.isUnlimited ? 'Personal Key (BYOK)' : 'Platform Quota'}</span>
                      <button 
                        onClick={handleUpdateKey}
                        className="text-[10px] text-slate-400 hover:text-white underline text-left mt-0.5"
                      >
                          {user.isUnlimited ? 'Update/Change Key' : 'Switch to Personal Key'}
                      </button>
                  </div>
               </div>
            </div>
          </div>
        </footer>
      </div>

      <div className="hidden print:block max-w-none mx-auto pt-8 px-8 bg-white text-black">
         <div className="mb-12 pb-6 border-b-2 border-black flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">CODECOUNCIL</h1>
              <h2 className="text-xl text-gray-600">Automated Technical Dossiê</h2>
            </div>
            <div className="text-right text-sm text-gray-500">
               <p>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
               <p>{files.length} Files Analyzed</p>
               <p>Tier: {selectedTier === 'enterprise' ? 'Enterprise Deep Dive' : 'Startup Audit'}</p>
               <p>Language: {LANG_CONFIG[language].label}</p>
            </div>
         </div>

         <div className="space-y-12">
          {Object.values(results).filter((r: AgentResult) => r.status === AnalysisStatus.COMPLETED).length === 0 ? (
             <div className="text-center text-gray-500 italic py-20">
                No analysis results to display. Please deploy the swarm before printing.
             </div>
          ) : (
             Object.values(results)
               .filter((r: AgentResult) => r.status === AnalysisStatus.COMPLETED)
               .map((res: AgentResult) => {
                 const agentDef = AGENTS.find(a => a.role === res.role);
                 return (
                   <article key={res.role} className="break-inside-avoid mb-12">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
                        <span className="text-3xl grayscale">{agentDef?.icon}</span>
                        <div>
                           <h3 className="text-xl font-bold uppercase tracking-wider text-black">{res.role}</h3>
                           <p className="text-xs text-gray-500 font-mono">{agentDef?.description}</p>
                        </div>
                      </div>
                      
                      <div className="prose prose-sm max-w-none prose-headings:text-black prose-p:text-gray-800 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded border-l-4 border-gray-100 pl-6">
                        <ReactMarkdown>{res.response}</ReactMarkdown>
                      </div>

                      {res.citations && res.citations.length > 0 && (
                         <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">References</h4>
                            <ul className="list-decimal list-inside text-xs text-blue-600">
                              {res.citations.map((cite, i) => (
                                <li key={i} className="truncate">
                                   <a href={cite} target="_blank" rel="noreferrer" className="hover:underline">{cite}</a>
                                </li>
                              ))}
                            </ul>
                         </div>
                      )}
                   </article>
                 )
             })
          )}
         </div>
         
         <div className="mt-20 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>Report generated by CodeCouncil AI - Powered by Google Gemini 2.5</p>
         </div>
      </div>

    </div>
  );
};

export default App;
