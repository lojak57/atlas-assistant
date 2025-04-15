import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { google } from 'googleapis';

// Initialize Google OAuth client (server-side only)
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'get_auth_url':
        const { state } = data;
        const scopes = [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.modify'
        ];
        
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes,
          state,
          prompt: 'consent'
        });
        
        return json({ authUrl });

      case 'get_tokens':
        const { code } = data;
        const { tokens } = await oauth2Client.getToken(code);
        return json({ tokens });

      case 'get_profile':
        const { tokens: profileTokens } = data;
        oauth2Client.setCredentials(profileTokens);
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        
        return json({ 
          email: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal
        });

      // Add more Gmail API operations as needed

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Gmail API:', error);
    return json({ error: 'Failed to process Gmail request' }, { status: 500 });
  }
};
