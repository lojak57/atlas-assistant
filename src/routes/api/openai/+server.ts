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

        const visionCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',  // Updated to use gpt-4o which has vision capabilities
          messages: visionMessages,
          temperature: 0,
          max_tokens: 1000
        });

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
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    return json({ error: 'Failed to process OpenAI request' }, { status: 500 });
  }
};
