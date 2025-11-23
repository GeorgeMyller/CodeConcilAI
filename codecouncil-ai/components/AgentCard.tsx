
import React from 'react';
import { AgentDefinition, AgentResult, AnalysisStatus } from '../types';
import ReactMarkdown from 'react-markdown';

interface AgentCardProps {
  definition: AgentDefinition;
  result?: AgentResult;
}

const AgentCard: React.FC<AgentCardProps> = ({ definition, result }) => {
  const status = result?.status || AnalysisStatus.IDLE;

  // Visual states configuration
  const config = {
    [AnalysisStatus.IDLE]: {
      border: 'border-slate-800',
      bg: 'bg-slate-900/40',
      iconColor: 'text-slate-600',
      statusText: 'STANDBY'
    },
    [AnalysisStatus.ANALYZING]: {
      border: 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      bg: 'bg-slate-900',
      iconColor: 'text-cyan-400',
      statusText: 'PROCESSING'
    },
    [AnalysisStatus.COMPLETED]: {
      border: 'border-emerald-500/30',
      bg: 'bg-slate-900/60',
      iconColor: 'text-emerald-400',
      statusText: 'COMPLETE'
    },
    [AnalysisStatus.ERROR]: {
      border: 'border-red-500/30',
      bg: 'bg-red-900/10',
      iconColor: 'text-red-400',
      statusText: 'FAILURE'
    }
  };

  const currentStyle = config[status];

  return (
    <div className={`agent-card flex flex-col h-full rounded-xl border ${currentStyle.border} ${currentStyle.bg} transition-all duration-500 overflow-hidden group`}>
      
      {/* Agent Header */}
      <div className="agent-card-header px-5 py-4 border-b border-slate-800/50 flex items-start justify-between bg-slate-950/30">
        <div className="flex gap-3">
          <div className={`p-2 rounded-lg bg-slate-800/50 text-xl ${currentStyle.iconColor} ring-1 ring-white/5`}>
            {definition.icon}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-200 text-sm tracking-wide">
                {definition.role.toUpperCase()}
                </h3>
                {definition.tools && definition.tools.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400" title="Google Search Grounding Active">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </span>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 no-print">
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                status === AnalysisStatus.ANALYZING 
                ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/30 animate-pulse' 
                : status === AnalysisStatus.COMPLETED
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/30'
                : 'border-slate-700 text-slate-600'
            }`}>
            {currentStyle.statusText}
            </div>
        </div>
      </div>

      {/* Content Viewport */}
      <div className="agent-card-content-container flex-1 overflow-hidden relative bg-[#0B1120]">
        
        {/* IDLE STATE */}
        {status === AnalysisStatus.IDLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 p-6 text-center">
            <div className="w-12 h-12 mb-3 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center opacity-50">
                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
            </div>
            <p className="text-xs font-mono">Agent ready for deployment.</p>
            <p className="text-[10px] mt-2 max-w-[200px] opacity-60">{definition.description}</p>
          </div>
        )}
        
        {/* ANALYZING STATE (Terminal Effect) */}
        {status === AnalysisStatus.ANALYZING && (
          <div className="absolute inset-0 p-5 font-mono text-xs text-cyan-500/80 bg-[#090e1a]">
             <div className="flex flex-col gap-2">
                <p>&gt; Initializing neural context...</p>
                <p className="text-cyan-300">&gt; Reading codebase...</p>
                <p>&gt; Identifying patterns...</p>
                <p>&gt; Checking knowledge base...</p>
                {definition.tools && <p className="text-yellow-500/70">&gt; querying external tools...</p>}
                <p className="mt-2 animate-pulse">_</p>
             </div>
             {/* Scanning line effect */}
             <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {status === AnalysisStatus.COMPLETED && result && (
          <div className="agent-card-scroll-area absolute inset-0 overflow-y-auto custom-scrollbar p-5 bg-[#0B1120]">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-a:text-cyan-400 prose-strong:text-slate-200 prose-code:text-cyan-300 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{result.response}</ReactMarkdown>
            </div>
            
            {/* Citations Footer */}
            {result.citations && result.citations.length > 0 && (
              <div className="citations-area mt-6 pt-4 border-t border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-yellow-500">✦</span> Referenced Sources
                </p>
                <div className="space-y-2">
                  {result.citations.slice(0, 3).map((url, i) => (
                    <a 
                        key={i}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="citation-link flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors group/link"
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-slate-500 group-hover/link:text-cyan-400">
                            {i + 1}
                        </div>
                        <span className="text-xs text-slate-400 truncate flex-1 group-hover/link:text-cyan-400 transition-colors">
                            {url}
                        </span>
                        <svg className="w-3 h-3 text-slate-600 group-hover/link:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* ERROR STATE */}
        {status === AnalysisStatus.ERROR && result && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <div className="text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-lg">
                    <div className="text-lg mb-2">⚠️ Connection Failure</div>
                    <p className="text-xs opacity-80">{result.response}</p>
                </div>
            </div>
        )}
      </div>

      {/* Footer Metadata */}
      {status === AnalysisStatus.COMPLETED && result?.executionTimeMs && (
         <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-between text-[10px] text-slate-600 font-mono no-print">
            <span>LATENCY: {result.executionTimeMs}ms</span>
            <span>TOKENS: OPTIMIZED</span>
         </div>
      )}
    </div>
  );
};

export default AgentCard;
