import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyOAuthState, clearOAuthState, generateToken, setAuthCookie } from '$lib/utils/auth';
import { gmailService } from '$lib/services';

export const GET: RequestHandler = async ({ url, cookies }) => {
  // Get the authorization code and state from the URL
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Verify the state parameter to prevent CSRF attacks
  if (!state || !verifyOAuthState(cookies.get('oauth_state'), state)) {
    return json({ error: 'Invalid state parameter' }, { status: 400 });
  }
  
  // Clear the state cookie
  const clearStateCookie = clearOAuthState();
  
  // If no code was provided, return an error
  if (!code) {
    return json({ error: 'No authorization code provided' }, { 
      status: 400,
      headers: {
        'Set-Cookie': clearStateCookie
      }
    });
  }
  
  try {
    // Exchange the authorization code for tokens
    const tokens = await gmailService.getTokensFromCode(code);
    
    // Connect to Gmail using the tokens
    await gmailService.connect(tokens);
    
    // Generate a JWT token for the user
    const token = generateToken({
      userId: 'gmail_user', // In a real app, you would get the user ID from the Gmail API
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date
    });
    
    // Set the authentication cookie
    const authCookie = setAuthCookie(token);
    
    // Redirect to the app with success message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/?integration=gmail&status=success',
        'Set-Cookie': [clearStateCookie, authCookie].join(', ')
      }
    });
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    
    // Redirect to the app with error message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/?integration=gmail&status=error&message=' + encodeURIComponent(error instanceof Error ? error.message : 'Unknown error'),
        'Set-Cookie': clearStateCookie
      }
    });
  }
};
