import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// This endpoint provides configuration to the client
// without exposing sensitive environment variables
export const GET: RequestHandler = async () => {
  return json({
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      redirectUri: env.GITHUB_REDIRECT_URI
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      redirectUri: env.GOOGLE_REDIRECT_URI
    },
    app: {
      url: env.APP_URL
    }
  });
};
