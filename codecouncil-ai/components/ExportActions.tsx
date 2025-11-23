
import React from 'react';
import { AgentResult, AnalysisStatus } from '../types';

interface ExportActionsProps {
  results: Record<string, AgentResult>;
}

const ExportActions: React.FC<ExportActionsProps> = ({ results }) => {
  // Check if we have any completed results to export
  const hasResults = Object.values(results).some((r: AgentResult) => r.status === AnalysisStatus.COMPLETED);

  if (!hasResults) return null;

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codecouncil-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let mdContent = `# CodeCouncil AI Audit Report\n`;
    mdContent += `**Date:** ${new Date().toLocaleString()}\n`;
    mdContent += `**Status:** Automated Analysis by CodeCouncil Swarm\n\n`;
    mdContent += `---\n\n`;

    Object.values(results).forEach((result: AgentResult) => {
      if (result.status === AnalysisStatus.COMPLETED) {
        mdContent += `## ${result.role.toUpperCase()}\n\n`;
        mdContent += `${result.response}\n\n`;
        
        if (result.citations && result.citations.length > 0) {
            mdContent += `### References\n`;
            result.citations.forEach((cite, i) => {
                mdContent += `- [${cite}](${cite})\n`;
            });
            mdContent += `\n`;
        }
        mdContent += `---\n\n`;
      }
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codecouncil-audit-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Temporarily set title to desired filename for the PDF
    const originalTitle = document.title;
    document.title = `CodeCouncil-Audit-Report-${new Date().toISOString().slice(0, 10)}`;
    
    window.print();
    
    // Restore original title
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="flex items-center gap-3 no-print animate-fade-in">
      <div className="h-8 w-px bg-slate-800 mx-2"></div>
      
      <button
        onClick={handleDownloadJSON}
        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 transition-all"
        title="Download raw JSON data"
      >
        <span className="text-yellow-500">{'{ }'}</span> JSON
      </button>

      <button
        onClick={handleDownloadMarkdown}
        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 transition-all"
        title="Download Markdown Report"
      >
        <span className="text-blue-400">M↓</span> Markdown
      </button>

      <button
        onClick={handleExportPDF}
        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-300 flex items-center gap-2 transition-all"
        title="Export as PDF"
      >
        <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Export PDF
      </button>
    </div>
  );
};

export default ExportActions;
