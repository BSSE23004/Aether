import { NextApiRequest, NextApiResponse } from 'next';
import * as SIWE from 'siwe';

const verifySignature = async (req: NextApiRequest, res: NextApiResponse) => {
  const signature = req.body.signature;
  try {
    const message = new SIWE.Message(JSON.parse(req.body.message));
    const isValid = await message.verify(signature);
    if (isValid) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error verifying signature' });
  }
};

export default verifySignature;