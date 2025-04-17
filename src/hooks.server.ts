import type { Handle } from '@sveltejs/kit';

// This hook runs on every request to the server
export const handle: Handle = async ({ event, resolve }) => {
  // Set a longer timeout for specific API routes
  if (event.url.pathname.startsWith('/api/receipt/parse') || 
      event.url.pathname.startsWith('/api/openai')) {
    // Set a custom header that Vercel can use to extend the function timeout
    event.setHeaders({
      'x-vercel-function-timeout': '60'
    });
  }

  // Continue with the request
  return await resolve(event);
};
