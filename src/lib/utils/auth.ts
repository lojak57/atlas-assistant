import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export interface TokenPayload {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Generate a JWT token for authentication
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Generate a random state string for OAuth
 */
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Store OAuth state in a cookie
 */
export function storeOAuthState(state: string): string {
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

/**
 * Verify OAuth state from cookie
 */
export function verifyOAuthState(cookieHeader: string | null, state: string): boolean {
  if (!cookieHeader) return false;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['oauth_state'] === state;
}

/**
 * Clear OAuth state cookie
 */
export function clearOAuthState(): string {
  return 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Set authentication token in a cookie
 */
export function setAuthCookie(token: string): string {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

/**
 * Get authentication token from cookie
 */
export function getAuthTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['auth_token'] || null;
}

/**
 * Clear authentication token cookie
 */
export function clearAuthCookie(): string {
  return 'auth_token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
