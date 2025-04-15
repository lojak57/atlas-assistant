// Common types for the application

export interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp?: Date;
}

import type { NotionPage, NotionDatabase } from '../services/notion';
import type { EmailMessage, GmailTokens } from '../services/gmail';
import type { GitHubRepository, GitHubFile, GitHubIssue } from '../services/github';
import type { iCloudCredentials, iCloudFile, iCloudEmail } from '../services/icloud';

export interface NotionIntegration {
  isConnected: boolean;
  connect: (accessToken?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  listDatabases: () => Promise<NotionDatabase[]>;
  queryDatabase: (databaseId: string, filter?: any, sorts?: any[]) => Promise<NotionPage[]>;
  createPage: (databaseId: string, properties: Record<string, any>, content?: any[]) => Promise<NotionPage>;
  updatePage: (pageId: string, properties: Record<string, any>) => Promise<NotionPage>;
  getPageContent: (pageId: string) => Promise<any>;
  addPageToKnowledgeBase: (pageId: string) => Promise<void>;
  addDatabaseToKnowledgeBase: (databaseId: string) => Promise<void>;
  updateBoard: (boardId: string, data: any) => Promise<any>;
}

export interface GmailIntegration {
  isConnected: boolean;
  connect: (tokens?: GmailTokens) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getAuthUrl: (state: string) => string;
  getTokensFromCode: (code: string) => Promise<GmailTokens>;
  sendEmail: (to: string, subject: string, body: string, options?: { cc?: string, bcc?: string, attachments?: any[] }) => Promise<boolean>;
  listEmails: (maxResults?: number, query?: string) => Promise<EmailMessage[]>;
  getEmail: (messageId: string) => Promise<EmailMessage>;
  addEmailToKnowledgeBase: (messageId: string) => Promise<void>;
  addEmailsToKnowledgeBase: (query?: string, maxResults?: number) => Promise<void>;
}

export interface GitHubIntegration {
  isConnected: boolean;
  connect: (accessToken?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getAuthUrl: (state: string) => string;
  getAccessTokenFromCode: (code: string) => Promise<string>;
  listRepositories: (perPage?: number, page?: number) => Promise<GitHubRepository[]>;
  getRepository: (owner: string, repo: string) => Promise<GitHubRepository>;
  listFiles: (owner: string, repo: string, path?: string) => Promise<GitHubFile[]>;
  getFileContent: (owner: string, repo: string, path: string) => Promise<GitHubFile>;
  listIssues: (owner: string, repo: string, state?: 'open' | 'closed' | 'all') => Promise<GitHubIssue[]>;
  getRepositoryContext: (repoName: string) => Promise<any>;
  addRepositoryToKnowledgeBase: (repoName: string, maxFiles?: number) => Promise<void>;
}

export interface iCloudIntegration {
  isConnected: boolean;
  connect: (credentials?: iCloudCredentials) => Promise<boolean>;
  disconnect: () => Promise<void>;
  listFiles: (path?: string) => Promise<iCloudFile[]>;
  getFileContent: (fileId: string) => Promise<string>;
  listEmails: (folder?: string, limit?: number) => Promise<iCloudEmail[]>;
  getEmail: (emailId: string) => Promise<iCloudEmail>;
  addFileToKnowledgeBase: (fileId: string) => Promise<void>;
  addEmailToKnowledgeBase: (emailId: string) => Promise<void>;
}

export interface RAGEngine {
  query: (question: string, context?: any) => Promise<string>;
  addToKnowledgeBase: (data: string, source: string, metadata?: Record<string, any>) => Promise<void>;
  addMultipleToKnowledgeBase: (dataItems: string[], source: string, metadata?: Record<string, any>[]) => Promise<void>;
}
