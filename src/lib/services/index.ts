// import { NotionService } from './notion'; // Removed for now
import { GmailService } from './gmail';
import { GitHubService } from './github';
import { iCloudService } from './icloud';
import { RAGService } from './rag';

// Export service instances
// export const notionService = new NotionService(); // Removed for now
export const gmailService = new GmailService();
export const githubService = new GitHubService();
export const icloudService = new iCloudService();

// Note: For server-side usage, create a new RAGService with the fetch function from the event
// For client-side usage, this instance will use the global fetch
export const ragService = new RAGService();

// Export service classes
export { GmailService, GitHubService, iCloudService, RAGService }; // NotionService removed
