import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthContext } from './AuthContext.js';
import { authService } from '../services/auth.service.js';
import { setUnauthorizedHandler } from '../services/api.js';
import { tokenStorage } from '../services/tokenStorage.js';

/**
 * Holds the logged-in user. `status` is:
 *  - 'loading'          while a saved session is being restored
 *  - 'authenticated'    when `user` is set
 *  - 'unauthenticated'  otherwise
 * `endReason` records why the last session ended: 'logout' (user chose to) or 'expired'.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'unauthenticated'));
  const [endReason, setEndReason] = useState(null);

  const endSession = useCallback((reason) => {
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
    setEndReason(reason);
  }, []);

  const logout = useCallback(() => endSession('logout'), [endSession]);

  // Any authenticated request that comes back 401 means the session is over.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Restore a saved session on first load.
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let cancelled = false;
    authService
      .getMe()
      .then(({ user: me }) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        // Only drop the token if the server rejected it, not on a network blip.
        if (err.status === 401) tokenStorage.clear();
        setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(({ token, user: nextUser }) => {
    tokenStorage.set(token);
    setUser(nextUser);
    setStatus('authenticated');
    setEndReason(null);
    return nextUser;
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authService.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession(await authService.register(details)),
    [startSession],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      endReason,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
    }),
    [user, status, endReason, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
