import React from 'react';
import { useSIWESession } from '../hooks/useSIWESession';

const LoginButton = () => {
  const { requestNonce, signMessage, verifySignature } = useSIWESession();

  const handleLogin = async () => {
    try {
      await requestNonce();
      // Assume wallet is connected and prompt for signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [`I am signing my one-time nonce: ${session.nonce}`, session.address],
      });
      await verifySignature(signature);
      // Handle successful login
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <button onClick={handleLogin}>Sign in with Ethereum</button>;
};

export default LoginButton;