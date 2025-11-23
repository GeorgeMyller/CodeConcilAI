
import React, { useState } from 'react';
import { fetchRepoContents, parseRepoUrl } from '../services/githubService';
import { FileContent } from '../types';

interface RepoInputProps {
  onFilesLoaded: (files: FileContent[]) => void;
  disabled: boolean;
}

const RepoInput: React.FC<RepoInputProps> = ({ onFilesLoaded, disabled }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    const repoInfo = parseRepoUrl(url);
    
    if (!repoInfo) {
      setError("Invalid GitHub URL. Please use format: https://github.com/owner/repo");
      return;
    }

    setLoading(true);
    try {
      const files = await fetchRepoContents(repoInfo.owner, repoInfo.repo);
      if (files.length === 0) {
         setError("No compatible code files found in this repository.");
      } else {
         onFilesLoaded(files);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-purple-500/10 rounded-full">
          <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        
        <div className="space-y-1 w-full max-w-md">
          <p className="text-lg font-medium text-slate-200">
            Import from GitHub
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter a public repository URL to analyze
          </p>
          
          <div className="flex space-x-2">
            <input 
                type="text" 
                placeholder="https://github.com/username/repo"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={disabled || loading}
            />
            <button
                onClick={handleImport}
                disabled={disabled || loading || !url}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Fetching...' : 'Import'}
            </button>
          </div>
          
          {error && (
            <p className="text-red-400 text-xs mt-2 text-left">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoInput;
