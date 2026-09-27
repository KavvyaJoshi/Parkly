const KEY = 'parkly.token';

// localStorage can throw (private mode, blocked storage), so every access is guarded.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      // Storage unavailable: the session will last until the tab is closed.
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
