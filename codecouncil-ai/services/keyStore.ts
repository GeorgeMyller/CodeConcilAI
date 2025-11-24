const KEY_NAME = 'cc_api_key_v1';

export const KeyStore = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY_NAME);
    } catch {
      return null;
    }
  },
  set(key: string) {
    try {
      localStorage.setItem(KEY_NAME, key);
    } catch {
      // ignore storage failures
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY_NAME);
    } catch {
      // ignore
    }
  }
};

export default KeyStore;
