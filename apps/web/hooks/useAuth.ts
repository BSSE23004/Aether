import { useState } from 'react';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (signature: string) => {
    // Store session in local storage or context
    localStorage.setItem('authSignature', signature);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear session and redirect to login page
    localStorage.removeItem('authSignature');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};

export default useAuth;