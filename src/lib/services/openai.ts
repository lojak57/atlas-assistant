// Service that calls the OpenAI API endpoints
// Works in both client-side and server-side environments

import { browser } from '$app/environment';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export interface VisionAnalysisResult {
  text: string;
  json?: any;
}

export class OpenAIService {
  private fetchFn: typeof fetch;

  constructor(customFetch?: typeof fetch) {
    // Use the provided fetch function or fall back to global fetch
    this.fetchFn = customFetch || fetch;
  }

  /**
   * Generate a chat completion using OpenAI's API via server endpoint
   */
  async generateChatCompletion(messages: { role: string; content: string }[], options = {}): Promise<string> {
    try {
      const response = await this.fetchFn('/api/openai', {
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
      const response = await this.fetchFn('/api/openai', {
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
      const response = await this.fetchFn('/api/openai', {
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

  /**
   * Analyze an image using OpenAI's Vision API via server endpoint
   */
  async analyzeImage(imageFile: File, prompt: string, outputFormat: 'text' | 'json' = 'text'): Promise<VisionAnalysisResult> {
    try {
      // Create a FormData object to send the image file
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('prompt', prompt);
      formData.append('outputFormat', outputFormat);

      const response = await this.fetchFn('/api/receipt/parse', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to analyze image with OpenAI Vision');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image with OpenAI Vision');
    }
  }
}
