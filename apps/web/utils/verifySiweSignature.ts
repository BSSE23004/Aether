import * as SIWE from 'siwe';

export const verifySiweSignature = async (message: SIWE.Message, signature: string): Promise<boolean> => {
  return await message.verify(signature);
};