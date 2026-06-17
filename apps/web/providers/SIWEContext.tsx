import { createContext, useContext } from 'react';
import { useState } from 'react';

interface SIWESession {
  nonce?: string;
  address?: string;
}

const SIWEContext = createContext<SIWESession>({});

export const SIWEProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<SIWESession>({});

  return (
    <SIWEContext.Provider value={{ ...session, requestNonce: async () => {}, signMessage: async () => {}, verifySignature: async () => {} }}>
      {children}
    </SIWEContext.Provider>
  );
};

export const useSIWESession = () => useContext(SIWEContext);