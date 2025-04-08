import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export class OpenAIService {
  /**
   * Generate a chat completion using OpenAI's API
   */
  async generateChatCompletion(messages: { role: string; content: string }[], options = {}): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 1000,
        ...options
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  /**
   * Generate embeddings for a text using OpenAI's API
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return {
        embedding: response.data[0].embedding,
        text
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding from OpenAI');
    }
  }

  /**
   * Generate embeddings for multiple texts using OpenAI's API
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      });

      return response.data.map((item, index) => ({
        embedding: item.embedding,
        text: texts[index]
      }));
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings from OpenAI');
    }
  }
}
