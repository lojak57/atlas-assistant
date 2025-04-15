import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateOAuthState, storeOAuthState } from '$lib/utils/auth';
import { gmailService } from '$lib/services';

export const GET: RequestHandler = async ({ url, cookies }) => {
  // Generate a state parameter to prevent CSRF attacks
  const state = generateOAuthState();
  
  // Store the state in a cookie
  const stateCookie = storeOAuthState(state);
  
  // Get the OAuth URL from the Gmail service
  const oauthUrl = gmailService.getAuthUrl(state);
  
  // Set the cookie and redirect to the OAuth URL
  return new Response(null, {
    status: 302,
    headers: {
      'Location': oauthUrl,
      'Set-Cookie': stateCookie
    }
  });
};
