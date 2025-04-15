import { Octokit } from '@octokit/rest';
import type { GitHubIntegration } from '$lib/types';
import { ragService } from './index';

export interface GitHubRepository {
  name: string;
  fullName: string;
  description: string;
  url: string;
  owner: string;
  stars: number;
  forks: number;
  issues: number;
  language: string;
  isPrivate: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  sha: string;
  size: number;
  url: string;
  type: 'file' | 'dir';
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  labels: string[];
}

export class GitHubService implements GitHubIntegration {
  private octokit: Octokit | null = null;
  private token: string | null = null;
  private username: string | null = null;
  isConnected = false;

  /**
   * Connect to GitHub API using an access token
   */
  async connect(accessToken?: string): Promise<boolean> {
    try {
      // Use provided token
      this.token = accessToken;

      if (!this.token) {
        console.error('No GitHub access token provided');
        return false;
      }

      this.octokit = new Octokit({ auth: this.token });

      // Test the connection by getting the authenticated user
      const { data } = await this.octokit.users.getAuthenticated();
      this.username = data.login;
      console.log('Connected to GitHub as:', this.username);

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from GitHub API
   */
  async disconnect(): Promise<void> {
    this.octokit = null;
    this.token = null;
    this.username = null;
    this.isConnected = false;
    console.log('Disconnected from GitHub');
  }

  /**
   * Get the GitHub OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    // This will be called after fetching the client ID from the server
    const clientId = window.atlasConfig?.github?.clientId;
    const redirectUri = window.atlasConfig?.github?.redirectUri;

    if (!clientId || !redirectUri) {
      throw new Error('GitHub client configuration not available');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'repo user'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessTokenFromCode(code: string): Promise<string> {
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return data.access_token;
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(perPage: number = 10, page: number = 1): Promise<GitHubRepository[]> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        per_page: perPage,
        page
      });

      return data.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        url: repo.html_url,
        owner: repo.owner.login,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        language: repo.language || 'Unknown',
        isPrivate: repo.private
      }));
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw new Error('Failed to list repositories');
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      const { data } = await this.octokit.repos.get({ owner, repo });

      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description || '',
        url: data.html_url,
        owner: data.owner.login,
        stars: data.stargazers_count,
        forks: data.forks_count,
        issues: data.open_issues_count,
        language: data.language || 'Unknown',
        isPrivate: data.private
      };
    } catch (error) {
      console.error(`Error getting repository ${owner}/${repo}:`, error);
      throw new Error('Failed to get repository');
    }
  }

  /**
   * List files in a repository
   */
  async listFiles(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      if (!Array.isArray(data)) {
        throw new Error('Expected directory content, got file');
      }

      return data.map(item => ({
        name: item.name,
        path: item.path,
        content: '', // Content is not included in directory listing
        sha: item.sha,
        size: item.size,
        url: item.html_url,
        type: item.type as 'file' | 'dir'
      }));
    } catch (error) {
      console.error(`Error listing files in ${owner}/${repo}/${path}:`, error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Get file content
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<GitHubFile> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      if (Array.isArray(data)) {
        throw new Error('Expected file content, got directory');
      }

      // @ts-ignore - content exists on file response
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        name: data.name,
        path: data.path,
        content,
        sha: data.sha,
        size: data.size,
        url: data.html_url,
        type: 'file'
      };
    } catch (error) {
      console.error(`Error getting file content for ${owner}/${repo}/${path}:`, error);
      throw new Error('Failed to get file content');
    }
  }

  /**
   * List issues in a repository
   */
  async listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state
      });

      return data.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state,
        url: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        author: issue.user?.login || 'Unknown',
        labels: issue.labels.map((label: any) => label.name)
      }));
    } catch (error) {
      console.error(`Error listing issues for ${owner}/${repo}:`, error);
      throw new Error('Failed to list issues');
    }
  }

  /**
   * Get repository context for RAG
   */
  async getRepositoryContext(repoName: string): Promise<any> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      // Parse owner and repo from repoName (format: owner/repo)
      const [owner, repo] = repoName.split('/');

      if (!owner || !repo) {
        throw new Error('Invalid repository name format. Expected: owner/repo');
      }

      // Get repository details
      const repository = await this.getRepository(owner, repo);

      // Get README content if available
      let readmeContent = '';
      try {
        const readme = await this.getFileContent(owner, repo, 'README.md');
        readmeContent = readme.content;
      } catch (error) {
        console.warn(`README.md not found in ${repoName}`);

        // Try README.txt
        try {
          const readme = await this.getFileContent(owner, repo, 'README.txt');
          readmeContent = readme.content;
        } catch (error) {
          console.warn(`README.txt not found in ${repoName}`);
        }
      }

      // Add repository info to knowledge base
      await ragService.addToKnowledgeBase(
        `Repository: ${repository.fullName}\n\nDescription: ${repository.description}\n\nLanguage: ${repository.language}\n\nStars: ${repository.stars}\n\nForks: ${repository.forks}\n\nIssues: ${repository.issues}\n\nURL: ${repository.url}`,
        `github:repo:${repoName}`,
        {
          type: 'repository',
          name: repository.name,
          fullName: repository.fullName,
          url: repository.url
        }
      );

      // Add README to knowledge base if available
      if (readmeContent) {
        await ragService.addToKnowledgeBase(
          readmeContent,
          `github:readme:${repoName}`,
          {
            type: 'readme',
            repository: repository.fullName,
            url: `${repository.url}/blob/master/README.md`
          }
        );
      }

      // Get open issues
      const issues = await this.listIssues(owner, repo);

      // Add issues to knowledge base
      for (const issue of issues) {
        await ragService.addToKnowledgeBase(
          `Issue #${issue.number}: ${issue.title}\n\n${issue.body}`,
          `github:issue:${repoName}:${issue.number}`,
          {
            type: 'issue',
            repository: repository.fullName,
            number: issue.number,
            title: issue.title,
            url: issue.url
          }
        );
      }

      return {
        repository,
        readme: readmeContent ? { content: readmeContent } : null,
        issues
      };
    } catch (error) {
      console.error(`Error getting repository context for ${repoName}:`, error);
      throw new Error('Failed to get repository context');
    }
  }

  /**
   * Add repository files to knowledge base
   */
  async addRepositoryToKnowledgeBase(repoName: string, maxFiles: number = 50): Promise<void> {
    if (!this.octokit || !this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      // Parse owner and repo from repoName (format: owner/repo)
      const [owner, repo] = repoName.split('/');

      if (!owner || !repo) {
        throw new Error('Invalid repository name format. Expected: owner/repo');
      }

      // Get repository context first (adds README and issues)
      await this.getRepositoryContext(repoName);

      // List files in the repository
      const files = await this.listFiles(owner, repo);

      // Process files recursively
      let processedFiles = 0;
      await this.processDirectoryForKnowledgeBase(owner, repo, '', files, processedFiles, maxFiles);

      console.log(`Added ${processedFiles} files from ${repoName} to knowledge base`);
    } catch (error) {
      console.error(`Error adding repository ${repoName} to knowledge base:`, error);
      throw new Error('Failed to add repository to knowledge base');
    }
  }

  /**
   * Process directory recursively for knowledge base
   */
  private async processDirectoryForKnowledgeBase(
    owner: string,
    repo: string,
    basePath: string,
    files: GitHubFile[],
    processedFiles: number,
    maxFiles: number
  ): Promise<void> {
    // Process files first
    for (const file of files) {
      if (processedFiles >= maxFiles) {
        console.log(`Reached maximum file limit (${maxFiles})`);
        return;
      }

      if (file.type === 'file') {
        // Skip binary files and very large files
        if (this.isBinaryFile(file.name) || file.size > 1000000) {
          continue;
        }

        try {
          // Get file content
          const fileWithContent = await this.getFileContent(owner, repo, file.path);

          // Add to knowledge base
          await ragService.addToKnowledgeBase(
            fileWithContent.content,
            `github:file:${owner}/${repo}:${file.path}`,
            {
              type: 'file',
              repository: `${owner}/${repo}`,
              path: file.path,
              url: file.url
            }
          );

          processedFiles++;
        } catch (error) {
          console.error(`Error processing file ${file.path}:`, error);
        }
      } else if (file.type === 'dir') {
        // Process subdirectory
        try {
          const subFiles = await this.listFiles(owner, repo, file.path);
          await this.processDirectoryForKnowledgeBase(owner, repo, file.path, subFiles, processedFiles, maxFiles);
        } catch (error) {
          console.error(`Error processing directory ${file.path}:`, error);
        }
      }
    }
  }

  /**
   * Check if a file is likely binary based on extension
   */
  private isBinaryFile(filename: string): boolean {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.ttf', '.otf', '.woff', '.woff2',
      '.mp3', '.mp4', '.avi', '.mov', '.wav',
      '.class', '.jar', '.pyc'
    ];

    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(extension);
  }
}
