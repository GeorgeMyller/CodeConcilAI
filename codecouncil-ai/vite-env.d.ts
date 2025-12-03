/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  aistudio?: {
    openSelectKey: () => Promise<void>;
  };
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
        prompt: () => void;
      };
    };
  };
}
