import { Client } from '@notionhq/client';
import type { NotionIntegration } from '$lib/types';
import { ragService } from './index';
import { env } from '$env/dynamic/private';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  properties: Record<string, any>;
}

export class NotionService implements NotionIntegration {
  private client: Client | null = null;
  private token: string | null = null;
  isConnected = false;

  /**
   * Connect to Notion API using an access token
   */
  async connect(accessToken?: string): Promise<boolean> {
    try {
      // Use provided token or fall back to environment variable
      this.token = accessToken || env.NOTION_API_KEY;

      if (!this.token) {
        console.error('No Notion access token provided');
        return false;
      }

      this.client = new Client({ auth: this.token });

      // Test the connection by getting the user's info
      const response = await this.client.users.me({});
      console.log('Connected to Notion as:', response.name);

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Notion:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from Notion API
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.token = null;
    this.isConnected = false;
    console.log('Disconnected from Notion');
  }

  /**
   * Get a list of databases the user has access to
   */
  async listDatabases(): Promise<NotionDatabase[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      const response = await this.client.search({
        filter: {
          property: 'object',
          value: 'database'
        }
      });

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title[0]?.plain_text || 'Untitled',
        url: db.url,
        properties: db.properties
      }));
    } catch (error) {
      console.error('Error listing Notion databases:', error);
      throw new Error('Failed to list Notion databases');
    }
  }

  /**
   * Query a Notion database
   */
  async queryDatabase(databaseId: string, filter?: any, sorts?: any[]): Promise<NotionPage[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
        sorts
      });

      return response.results.map((page: any) => ({
        id: page.id,
        title: this.extractPageTitle(page),
        url: page.url,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties
      }));
    } catch (error) {
      console.error(`Error querying Notion database ${databaseId}:`, error);
      throw new Error('Failed to query Notion database');
    }
  }

  /**
   * Create a new page in a database
   */
  async createPage(databaseId: string, properties: Record<string, any>, content?: any[]): Promise<NotionPage> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      const pageData: any = {
        parent: { database_id: databaseId },
        properties
      };

      if (content) {
        pageData.children = content;
      }

      const response = await this.client.pages.create(pageData);

      return {
        id: response.id,
        title: this.extractPageTitle(response),
        url: response.url,
        created_time: response.created_time,
        last_edited_time: response.last_edited_time,
        properties: response.properties
      };
    } catch (error) {
      console.error('Error creating Notion page:', error);
      throw new Error('Failed to create Notion page');
    }
  }

  /**
   * Update a page's properties
   */
  async updatePage(pageId: string, properties: Record<string, any>): Promise<NotionPage> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      const response = await this.client.pages.update({
        page_id: pageId,
        properties
      });

      return {
        id: response.id,
        title: this.extractPageTitle(response),
        url: response.url,
        created_time: response.created_time,
        last_edited_time: response.last_edited_time,
        properties: response.properties
      };
    } catch (error) {
      console.error(`Error updating Notion page ${pageId}:`, error);
      throw new Error('Failed to update Notion page');
    }
  }

  /**
   * Get page content
   */
  async getPageContent(pageId: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId
      });

      return response.results;
    } catch (error) {
      console.error(`Error getting Notion page content ${pageId}:`, error);
      throw new Error('Failed to get Notion page content');
    }
  }

  /**
   * Add page to RAG knowledge base
   */
  async addPageToKnowledgeBase(pageId: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      // Get page details
      const page = await this.client.pages.retrieve({ page_id: pageId });

      // Get page content
      const content = await this.getPageContent(pageId);

      // Extract text content from blocks
      const textContent = await this.extractTextFromBlocks(content);

      // Add page title
      const title = this.extractPageTitle(page);
      const fullContent = `Title: ${title}\n\n${textContent}`;

      // Add to knowledge base
      await ragService.addToKnowledgeBase(
        fullContent,
        `notion:page:${pageId}`,
        {
          type: 'notion_page',
          pageId,
          title,
          url: page.url
        }
      );

      console.log(`Added Notion page ${pageId} to knowledge base`);
    } catch (error) {
      console.error(`Error adding Notion page ${pageId} to knowledge base:`, error);
      throw new Error('Failed to add Notion page to knowledge base');
    }
  }

  /**
   * Add database to RAG knowledge base
   */
  async addDatabaseToKnowledgeBase(databaseId: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to Notion');
    }

    try {
      // Query all pages in the database
      const pages = await this.queryDatabase(databaseId);

      // Process each page
      for (const page of pages) {
        await this.addPageToKnowledgeBase(page.id);
      }

      console.log(`Added Notion database ${databaseId} to knowledge base`);
    } catch (error) {
      console.error(`Error adding Notion database ${databaseId} to knowledge base:`, error);
      throw new Error('Failed to add Notion database to knowledge base');
    }
  }

  /**
   * Update a board (database)
   */
  async updateBoard(boardId: string, data: any): Promise<any> {
    return this.updatePage(boardId, data);
  }

  /**
   * Helper method to extract page title
   */
  private extractPageTitle(page: any): string {
    // Try to find a title property
    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;

    if (titleProperty?.title?.[0]?.plain_text) {
      return titleProperty.title[0].plain_text;
    }

    // Fall back to page ID if no title found
    return `Untitled (${page.id})`;
  }

  /**
   * Helper method to extract text from blocks
   */
  private async extractTextFromBlocks(blocks: any[]): Promise<string> {
    let text = '';

    for (const block of blocks) {
      if (block.type === 'paragraph') {
        const paragraphText = block.paragraph.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (paragraphText) {
          text += paragraphText + '\n\n';
        }
      } else if (block.type === 'heading_1') {
        const headingText = block.heading_1.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (headingText) {
          text += '# ' + headingText + '\n\n';
        }
      } else if (block.type === 'heading_2') {
        const headingText = block.heading_2.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (headingText) {
          text += '## ' + headingText + '\n\n';
        }
      } else if (block.type === 'heading_3') {
        const headingText = block.heading_3.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (headingText) {
          text += '### ' + headingText + '\n\n';
        }
      } else if (block.type === 'bulleted_list_item') {
        const itemText = block.bulleted_list_item.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (itemText) {
          text += '- ' + itemText + '\n';
        }
      } else if (block.type === 'numbered_list_item') {
        const itemText = block.numbered_list_item.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (itemText) {
          text += '1. ' + itemText + '\n';
        }
      } else if (block.type === 'to_do') {
        const itemText = block.to_do.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (itemText) {
          text += `- [${block.to_do.checked ? 'x' : ' '}] ` + itemText + '\n';
        }
      } else if (block.type === 'quote') {
        const quoteText = block.quote.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (quoteText) {
          text += '> ' + quoteText + '\n\n';
        }
      } else if (block.type === 'code') {
        const codeText = block.code.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');

        if (codeText) {
          text += '```' + block.code.language + '\n' + codeText + '\n```\n\n';
        }
      } else if (block.type === 'image') {
        const caption = block.image.caption
          ?.map((rt: any) => rt.plain_text)
          .join('') || 'Image';

        text += `[Image: ${caption}]\n\n`;
      } else if (block.has_children) {
        // Recursively process child blocks
        try {
          const childBlocks = await this.client?.blocks.children.list({
            block_id: block.id
          });

          if (childBlocks?.results) {
            text += await this.extractTextFromBlocks(childBlocks.results) + '\n';
          }
        } catch (error) {
          console.error(`Error getting child blocks for ${block.id}:`, error);
        }
      }
    }

    return text;
  }
}
