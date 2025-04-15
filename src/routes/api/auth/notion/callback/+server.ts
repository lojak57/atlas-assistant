import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyOAuthState, clearOAuthState, generateToken, setAuthCookie } from '$lib/utils/auth';

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
    // Exchange the authorization code for an access token
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.NOTION_REDIRECT_URI
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
    }

    // Extract the access token and other relevant information
    const { access_token, workspace_id, owner } = data;

    // Generate a JWT token for the user
    const token = generateToken({
      userId: owner.user.id,
      provider: 'notion',
      accessToken: access_token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Set the authentication cookie
    const authCookie = setAuthCookie(token);

    // Redirect to the app with success message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/?integration=notion&status=success',
        'Set-Cookie': [clearStateCookie, authCookie].join(', ')
      }
    });
  } catch (error) {
    console.error('Error in Notion OAuth callback:', error);

    // Redirect to the app with error message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/?integration=notion&status=error&message=' + encodeURIComponent(error instanceof Error ? error.message : 'Unknown error'),
        'Set-Cookie': clearStateCookie
      }
    });
  }
};
