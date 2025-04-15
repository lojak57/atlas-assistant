import type { RAGEngine } from '$lib/types';
import { OpenAIService } from './openai';
import { SupabaseVectorService, type Document } from './supabase';

// RAG (Retrieval-Augmented Generation) engine implementation
export class RAGService implements RAGEngine {
  private openAIService: OpenAIService;
  private vectorService: SupabaseVectorService;

  constructor(customFetch?: typeof fetch) {
    this.openAIService = new OpenAIService(customFetch);
    this.vectorService = new SupabaseVectorService();
  }

  /**
   * Query the RAG engine with a question
   */
  async query(question: string, context?: any): Promise<string> {
    try {
      console.log(`RAG query: ${question}`, context);

      // 1. Convert the question to an embedding
      const embeddingResult = await this.openAIService.generateEmbedding(question);

      // 2. Search the vector database for relevant context
      let relevantDocuments: Document[] = [];
      try {
        relevantDocuments = await this.vectorService.similaritySearch(embeddingResult.embedding, 5);
      } catch (error) {
        console.warn('Vector search failed, proceeding without context:', error);
      }

      // 3. Prepare context for the LLM
      const contextText = relevantDocuments.length > 0
        ? relevantDocuments.map(doc => doc.content).join('\n\n')
        : '';

      // 4. Prepare messages for the LLM
      const messages = [
        {
          role: 'system',
          content: `You are Atlas, a helpful AI assistant with access to various integrations like Notion, Gmail, GitHub, and iCloud.
          ${contextText ? 'Here is some relevant context that might help you answer the user\'s question:\n\n' + contextText : 'You don\'t have any specific context for this question yet.'}`
        },
        { role: 'user', content: question }
      ];

      // 5. Send the question + context to the LLM
      const response = await this.openAIService.generateChatCompletion(messages);

      return response;
    } catch (error) {
      console.error('Error in RAG query:', error);
      return `I'm sorry, I encountered an error while processing your question. Please try again later.`;
    }
  }

  /**
   * Add data to the knowledge base
   */
  async addToKnowledgeBase(data: string, source: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // 1. Generate embedding for the data
      const embeddingResult = await this.openAIService.generateEmbedding(data);

      // 2. Store the data and embedding in the vector database
      await this.vectorService.insertDocument({
        content: data,
        embedding: embeddingResult.embedding,
        source,
        metadata
      });

      console.log(`Added data to knowledge base from source: ${source}`);
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      throw new Error('Failed to add data to knowledge base');
    }
  }

  /**
   * Add multiple data items to the knowledge base
   */
  async addMultipleToKnowledgeBase(dataItems: string[], source: string, metadata?: Record<string, any>[]): Promise<void> {
    try {
      // 1. Generate embeddings for all data items
      const embeddingResults = await this.openAIService.generateEmbeddings(dataItems);

      // 2. Store all data items and embeddings in the vector database
      const documents = embeddingResults.map((result, index) => ({
        content: result.text,
        embedding: result.embedding,
        source,
        metadata: metadata?.[index] || {}
      }));

      await this.vectorService.insertDocuments(documents);

      console.log(`Added ${dataItems.length} items to knowledge base from source: ${source}`);
    } catch (error) {
      console.error('Error adding multiple items to knowledge base:', error);
      throw new Error('Failed to add multiple items to knowledge base');
    }
  }
}
