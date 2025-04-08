import type { EmbeddingResult } from './openai';

// Client-side service that calls the server API endpoints

export interface Document {
  id?: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  source?: string;
}

export class SupabaseVectorService {
  private tableName = 'documents';

  /**
   * Initialize the vector store by creating the necessary tables and extensions
   */
  async initializeVectorStore(): Promise<void> {
    try {
      // This is a placeholder. In a real implementation, you would:
      // 1. Create the pgvector extension if it doesn't exist
      // 2. Create the documents table with the necessary columns
      // 3. Create indexes for vector similarity search
      console.log('Vector store initialized');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw new Error('Failed to initialize vector store');
    }
  }

  /**
   * Insert a document with its embedding into the vector store via server endpoint
   */
  async insertDocument(document: Document): Promise<string> {
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'insert_document',
          data: {
            content: document.content,
            embedding: document.embedding,
            metadata: document.metadata || {},
            source: document.source || 'unknown'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to insert document into vector store');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error inserting document:', error);
      throw new Error('Failed to insert document into vector store');
    }
  }

  /**
   * Insert multiple documents with their embeddings into the vector store via server endpoint
   */
  async insertDocuments(documents: Document[]): Promise<string[]> {
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'insert_documents',
          data: { documents }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to insert documents into vector store');
      }

      const data = await response.json();
      return data.ids;
    } catch (error) {
      console.error('Error inserting documents:', error);
      throw new Error('Failed to insert documents into vector store');
    }
  }

  /**
   * Search for similar documents using vector similarity via server endpoint
   */
  async similaritySearch(embedding: number[], limit = 5): Promise<Document[]> {
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'similarity_search',
          data: {
            embedding,
            limit,
            threshold: 0.7
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for similar documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching for similar documents:', error);
      throw new Error('Failed to search for similar documents');
    }
  }

  /**
   * Delete a document from the vector store via server endpoint
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_document',
          data: { id }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document from vector store');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document from vector store');
    }
  }

  /**
   * Delete all documents from the vector store via server endpoint
   */
  async deleteAllDocuments(): Promise<void> {
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_all_documents'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete all documents from vector store');
      }
    } catch (error) {
      console.error('Error deleting all documents:', error);
      throw new Error('Failed to delete all documents from vector store');
    }
  }
}
