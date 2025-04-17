import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

// Initialize OpenAI client (server-side only)
// Use a dummy API key during build time to prevent errors
const isDevelopment = process.env.NODE_ENV === 'development';
const dummyApiKey = 'dummy-api-key-for-build-time';

// Only create the OpenAI client if we're not in a build environment
let openai: OpenAI;

// This is a function to get or create the OpenAI client
function getOpenAIClient() {
  // If we already have an instance, return it
  if (openai) return openai;

  // Otherwise create a new instance
  try {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || dummyApiKey
    });
    return openai;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    // Return a mock client for build time
    return {
      chat: { completions: { create: async () => ({ choices: [{ message: { content: 'Build time response' } }] }) } },
      embeddings: { create: async () => ({ data: [{ embedding: [] }] }) }
    } as unknown as OpenAI;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'chat':
        const { messages, options } = data;
        const completion = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          ...options
        });
        return json({
          response: completion.choices[0]?.message?.content || 'No response generated'
        });

      case 'embedding':
        const { text } = data;
        const embeddingResponse = await getOpenAIClient().embeddings.create({
          model: 'text-embedding-3-small',
          input: text
        });
        return json({
          embedding: embeddingResponse.data[0].embedding,
          text
        });

      case 'embeddings':
        const { texts } = data;
        const embeddingsResponse = await getOpenAIClient().embeddings.create({
          model: 'text-embedding-3-small',
          input: texts
        });
        return json(
          embeddingsResponse.data.map((item, index) => ({
            embedding: item.embedding,
            text: texts[index]
          }))
        );

      case 'vision':
        const { imageBase64, prompt, outputFormat = 'text' } = data;
        const visionMessages = [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ];

        // Set a timeout for the OpenAI API call to prevent function timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI API call timed out')), 25000); // 25 second timeout
        });

        // Make the actual API call
        const apiCallPromise = getOpenAIClient().chat.completions.create({
          model: 'gpt-4o',  // Updated to use gpt-4o which has vision capabilities
          messages: visionMessages,
          temperature: 0,
          max_tokens: 500  // reduced token limit for faster response
        });

        // Race the timeout against the API call
        const visionCompletion = await Promise.race([apiCallPromise, timeoutPromise]) as any;

        const content = visionCompletion.choices[0]?.message?.content || '';

        // If JSON output is requested, try to parse the content as JSON
        if (outputFormat === 'json') {
          try {
            // First try direct parsing
            let jsonData = JSON.parse(content);
            return json({ text: content, json: jsonData });
          } catch (e) {
            // If that fails, try to extract JSON from the text
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                const jsonData = JSON.parse(match[0]);
                return json({ text: content, json: jsonData });
              } catch (_) {}
            }
            // Return text only if JSON parsing fails
            return json({ text: content });
          }
        }

        // Default to returning text
        return json({ text: content });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in OpenAI API:', error);

    // Check if it's a timeout error
    if (error.message && error.message.includes('timed out')) {
      return json({
        error: 'The AI processing took too long. Please try again with simpler input.'
      }, { status: 408 });
    }

    // Check if it's an authentication error
    if (error.status === 401 || (error.message && error.message.includes('API key'))) {
      return json({
        error: 'Authentication error with the AI service. Please check your API configuration.'
      }, { status: 401 });
    }

    return json({
      error: `AI processing error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
};
