import { NextApiRequest, NextApiResponse } from 'next';

const logout = async (req: NextApiRequest, res: NextApiResponse) => {
  // Clear session and return success response
  localStorage.removeItem('authSignature');
  res.status(200).json({ success: true });
};

export default logout;