import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { generateOAuthState, storeOAuthState } from '$lib/utils/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
  // Generate a state parameter to prevent CSRF attacks
  const state = generateOAuthState();
  
  // Store the state in a cookie
  const stateCookie = storeOAuthState(state);
  
  // Construct the OAuth URL
  const clientId = env.NOTION_CLIENT_ID;
  const redirectUri = env.NOTION_REDIRECT_URI;
  const oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  
  // Set the cookie and redirect to the OAuth URL
  return new Response(null, {
    status: 302,
    headers: {
      'Location': oauthUrl,
      'Set-Cookie': stateCookie
    }
  });
};
