import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext<{ isAuthenticated: boolean; login: (signature: string) => void; logout: () => void }>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated);

  useEffect(() => {
    const signature = localStorage.getItem('authSignature');
    if (signature) {
      auth.login(signature);
      setIsAuthenticated(true);
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login: auth.login, logout: auth.logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);