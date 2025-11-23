
import { FileContent } from '../types';

interface GithubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

interface GithubTreeResponse {
  sha: string;
  url: string;
  tree: GithubTreeItem[];
  truncated: boolean;
}

export const parseRepoUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  } catch (e) {
    return null;
  }
};

export const fetchRepoContents = async (
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<FileContent[]> => {
  // 1. Get the Tree (Recursive)
  // Note: Using public API, rate limits apply (60/hr). 
  // In a real production app, you'd need a backend proxy with a token.
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  const treeResponse = await fetch(treeUrl);
  if (!treeResponse.ok) {
     // Try 'master' if main fails
     if (branch === 'main') {
         return fetchRepoContents(owner, repo, 'master');
     }
     throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`);
  }

  const treeData: GithubTreeResponse = await treeResponse.json();
  
  // 2. Filter for relevant files (Code files, max 15 to avoid rate limits/size limits in demo)
  const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.md', '.json', '.html', '.css'];
  
  const codeFiles = treeData.tree
    .filter(item => item.type === 'blob')
    .filter(item => relevantExtensions.some(ext => item.path.endsWith(ext)))
    .filter(item => !item.path.includes('package-lock.json')) // Ignore huge lock files
    .filter(item => !item.path.includes('yarn.lock'))
    .slice(0, 20); // Limit to 20 files for browser performance and rate limits

  // 3. Fetch content for each file
  const files: FileContent[] = [];

  await Promise.all(codeFiles.map(async (item) => {
    try {
      // Use the blob URL to get content (base64 encoded usually)
      const blobResponse = await fetch(item.url);
      const blobData = await blobResponse.json();
      
      let content = '';
      if (blobData.encoding === 'base64') {
        content = atob(blobData.content.replace(/\n/g, ''));
      } else {
        content = blobData.content;
      }

      files.push({
        name: item.path,
        content: content,
        size: item.size || 0
      });
    } catch (e) {
      console.warn(`Failed to fetch content for ${item.path}`, e);
    }
  }));

  return files;
};
