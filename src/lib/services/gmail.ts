import { google, gmail_v1 } from 'googleapis';
import type { GmailIntegration } from '$lib/types';
import { env } from '$env/dynamic/private';
import { ragService } from './index';

export interface GmailCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  labels: string[];
  attachments?: any[];
}

export class GmailService implements GmailIntegration {
  private auth: any = null;
  private gmail: gmail_v1.Gmail | null = null;
  private userEmail: string | null = null;
  isConnected = false;

  /**
   * Connect to Gmail API using OAuth tokens
   */
  async connect(tokens?: GmailTokens): Promise<boolean> {
    try {
      // Create OAuth2 client
      this.auth = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );

      // Set credentials if provided
      if (tokens) {
        this.auth.setCredentials(tokens);
      } else {
        // For testing purposes only - in production, always use OAuth
        console.warn('No tokens provided, Gmail integration will be limited');
      }

      // Initialize Gmail API client
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });

      // Test the connection by getting user profile
      if (tokens) {
        const profile = await this.gmail.users.getProfile({ userId: 'me' });
        this.userEmail = profile.data.emailAddress || null;
        console.log('Connected to Gmail as:', this.userEmail);
      }

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Gmail:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from Gmail API
   */
  async disconnect(): Promise<void> {
    this.auth = null;
    this.gmail = null;
    this.userEmail = null;
    this.isConnected = false;
    console.log('Disconnected from Gmail');
  }

  /**
   * Get OAuth URL for Gmail authorization
   */
  getAuthUrl(state: string): string {
    if (!this.auth) {
      this.auth = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GmailTokens> {
    if (!this.auth) {
      this.auth = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );
    }

    const { tokens } = await this.auth.getToken(code);
    return tokens;
  }

  /**
   * Send an email
   */
  async sendEmail(to: string, subject: string, body: string, options?: { cc?: string, bcc?: string, attachments?: any[] }): Promise<boolean> {
    if (!this.gmail || !this.isConnected) {
      throw new Error('Not connected to Gmail');
    }

    try {
      // Construct email headers
      const headers = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0'
      ];

      // Add CC and BCC if provided
      if (options?.cc) headers.push(`Cc: ${options.cc}`);
      if (options?.bcc) headers.push(`Bcc: ${options.bcc}`);

      // Construct email body
      const email = headers.join('\r\n') + '\r\n\r\n' + body;

      // Encode the email
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });

      console.log(`Email sent to ${to} with subject "${subject}"`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * List emails from inbox
   */
  async listEmails(maxResults: number = 10, query: string = ''): Promise<EmailMessage[]> {
    if (!this.gmail || !this.isConnected) {
      throw new Error('Not connected to Gmail');
    }

    try {
      // List messages matching query
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      });

      const messages = response.data.messages || [];
      const emails: EmailMessage[] = [];

      // Get details for each message
      for (const message of messages) {
        if (message.id) {
          const email = await this.getEmail(message.id);
          emails.push(email);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error listing emails:', error);
      throw new Error('Failed to list emails');
    }
  }

  /**
   * Get a specific email by ID
   */
  async getEmail(messageId: string): Promise<EmailMessage> {
    if (!this.gmail || !this.isConnected) {
      throw new Error('Not connected to Gmail');
    }

    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      // Extract email details from headers
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const to = headers.find(h => h.name?.toLowerCase() === 'to')?.value || '';
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      // Extract email body
      let body = '';
      if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload?.parts) {
        // Find text/plain or text/html part
        const textPart = message.payload.parts.find(part =>
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );

        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      return {
        id: message.id || messageId,
        threadId: message.threadId || '',
        from,
        to,
        subject,
        snippet: message.snippet || '',
        body,
        date,
        labels: message.labelIds || []
      };
    } catch (error) {
      console.error(`Error getting email ${messageId}:`, error);
      throw new Error('Failed to get email');
    }
  }

  /**
   * Add email to RAG knowledge base
   */
  async addEmailToKnowledgeBase(messageId: string): Promise<void> {
    if (!this.gmail || !this.isConnected) {
      throw new Error('Not connected to Gmail');
    }

    try {
      // Get email details
      const email = await this.getEmail(messageId);

      // Format email content for knowledge base
      const content = `
        From: ${email.from}
        To: ${email.to}
        Subject: ${email.subject}
        Date: ${email.date}

        ${email.body}
      `;

      // Add to knowledge base
      await ragService.addToKnowledgeBase(
        content,
        `gmail:email:${messageId}`,
        {
          type: 'email',
          messageId,
          subject: email.subject,
          from: email.from,
          date: email.date
        }
      );

      console.log(`Added email ${messageId} to knowledge base`);
    } catch (error) {
      console.error(`Error adding email ${messageId} to knowledge base:`, error);
      throw new Error('Failed to add email to knowledge base');
    }
  }

  /**
   * Add multiple emails to RAG knowledge base
   */
  async addEmailsToKnowledgeBase(query: string = '', maxResults: number = 10): Promise<void> {
    if (!this.gmail || !this.isConnected) {
      throw new Error('Not connected to Gmail');
    }

    try {
      // List emails matching query
      const emails = await this.listEmails(maxResults, query);

      // Add each email to knowledge base
      for (const email of emails) {
        await this.addEmailToKnowledgeBase(email.id);
      }

      console.log(`Added ${emails.length} emails to knowledge base`);
    } catch (error) {
      console.error('Error adding emails to knowledge base:', error);
      throw new Error('Failed to add emails to knowledge base');
    }
  }
}
