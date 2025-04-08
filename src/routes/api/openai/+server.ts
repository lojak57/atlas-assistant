import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'chat':
        const { messages, options } = data;
        const completion = await openai.chat.completions.create({
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
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text
        });
        return json({ 
          embedding: embeddingResponse.data[0].embedding,
          text 
        });

      case 'embeddings':
        const { texts } = data;
        const embeddingsResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts
        });
        return json(
          embeddingsResponse.data.map((item, index) => ({
            embedding: item.embedding,
            text: texts[index]
          }))
        );

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    return json({ error: 'Failed to process OpenAI request' }, { status: 500 });
  }
};
