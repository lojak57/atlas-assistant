import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gmailService, githubService, icloudService } from '$lib/services';
import { RAGService } from '$lib/services/rag';

export const POST: RequestHandler = async ({ request, fetch }) => {
  // Create a new RAG service with the server-side fetch function
  const ragService = new RAGService(fetch);
  try {
    const { message } = await request.json();

    if (!message) {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    // Process the message to determine intent and route to the appropriate service
    // This is a simple implementation that will be enhanced over time

    // Check if the message contains keywords related to specific integrations
    const lowerMessage = message.toLowerCase();

    // Track which integrations are mentioned
    const mentionsNotion = lowerMessage.includes('notion');
    const mentionsGmail = lowerMessage.includes('gmail') || lowerMessage.includes('email');
    const mentionsGitHub = lowerMessage.includes('github') || lowerMessage.includes('repository') || lowerMessage.includes('code');
    const mentionsiCloud = lowerMessage.includes('icloud');

    // Add context about which integrations are connected
    let integrationContext = 'Currently connected integrations: ';
    const connectedIntegrations = [];

    // Notion integration removed for now
    if (gmailService.isConnected) connectedIntegrations.push('Gmail');
    if (githubService.isConnected) connectedIntegrations.push('GitHub');
    if (icloudService.isConnected) connectedIntegrations.push('iCloud');

    integrationContext += connectedIntegrations.length > 0
      ? connectedIntegrations.join(', ')
      : 'None';

    // Use the RAG service to generate a response
    const response = await ragService.query(message, {
      integrationContext,
      mentionsNotion,
      mentionsGmail,
      mentionsGitHub,
      mentionsiCloud
    });

    return json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return json({ error: 'Failed to process message' }, { status: 500 });
  }
};
