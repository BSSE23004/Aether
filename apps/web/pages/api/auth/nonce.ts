import { NextApiRequest, NextApiResponse } from 'next';

const requestNonce = async (req: NextApiRequest, res: NextApiResponse) => {
  // Generate a nonce and store it in Redis or another secure storage
  const nonce = Math.random().toString(36).substring(2, 15);
  res.status(200).json({ nonce });
};

export default requestNonce;