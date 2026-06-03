import { createHmac } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(input: string) {
  return createHmac('sha256', SECRET).update(input).digest('base64url');
}

export function signJwt(payload: Record<string, unknown>, expiresInMinutes = 15) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInMinutes * 60,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export interface JwtPayload {
  sub?: string;
  type?: string;
  address?: string;
  iat?: number;
  exp?: number;
}

export function verifyJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const header = parts[0];
  const payload = parts[1];
  const signature = parts[2];
  if (!header || !payload || !signature) throw new Error('Invalid token');
  const expected = sign(`${header}.${payload}`);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) throw new Error('Invalid signature');
  if (!actualBytes.every((value, index) => value === expectedBytes[index])) throw new Error('Invalid signature');
  const body = JSON.parse(base64UrlDecode(payload)) as JwtPayload;
  if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) throw new Error('Expired token');
  return body;
}

