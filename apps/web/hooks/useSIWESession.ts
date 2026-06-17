import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const useSIWESession = () => {
  const { login } = useAuth();
  const [session, setSession] = useState<{ nonce: string; address: string } | null>(null);

  const requestNonce = async () => {
    // Fetch nonce from backend
    const response = await fetch('/api/auth/nonce');
    const data = await response.json();
    setSession({ nonce: data.nonce, address: data.address });
  };

  const signMessage = async (signature: string) => {
    login(signature);
  };

  const verifySignature = async (signature: string) => {
    // Verify signature with backend
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature }),
    });
    if (response.ok) {
      login(signature);
    }
  };

  return { requestNonce, signMessage, verifySignature };
};

export default useSIWESession;