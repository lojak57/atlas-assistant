// Client-side service that calls the server API endpoints

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export class OpenAIService {
  /**
   * Generate a chat completion using OpenAI's API via server endpoint
   */
  async generateChatCompletion(messages: { role: string; content: string }[], options = {}): Promise<string> {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'chat',
          data: { messages, options }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response from OpenAI');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  /**
   * Generate embeddings for a text using OpenAI's API via server endpoint
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'embedding',
          data: { text }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate embedding from OpenAI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding from OpenAI');
    }
  }

  /**
   * Generate embeddings for multiple texts using OpenAI's API via server endpoint
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'embeddings',
          data: { texts }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate embeddings from OpenAI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings from OpenAI');
    }
  }
}
