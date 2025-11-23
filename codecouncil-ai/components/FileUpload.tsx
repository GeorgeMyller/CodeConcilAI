import React, { useCallback } from 'react';
import { FileContent } from '../types';

interface FileUploadProps {
  onFilesSelected: (files: FileContent[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const filesArray: FileContent[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Skip binary files crudely by checking generic text types or extensions
      // For a demo, we assume text.
      const text = await file.text();
      filesArray.push({
        name: file.name,
        content: text,
        size: file.size
      });
    }

    onFilesSelected(filesArray);
  }, [onFilesSelected]);

  return (
    <div className="w-full p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-full">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-200">
            Upload Codebase Files
          </p>
          <p className="text-sm text-slate-400">
            Select .py, .js, .ts, .md, .java files to analyze
          </p>
        </div>
        <input
          type="file"
          multiple
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            disabled
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
          }`}
        >
          Select Files
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
