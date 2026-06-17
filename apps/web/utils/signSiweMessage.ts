import * as SIWE from 'siwe';

export const signSiweMessage = async (message: SIWE.Message, privateKey: string): Promise<string> => {
  return await message.sign(privateKey);
};