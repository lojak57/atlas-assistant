# Atlas AI Assistant Setup Guide

This guide will walk you through the process of setting up your Atlas AI Assistant with all the necessary integrations.

## Prerequisites

Before you begin, make sure you have the following:

- Node.js (v18 or later)
- npm (v8 or later)
- A Supabase account
- An OpenAI account with API access
- Accounts for any integrations you want to use (Notion, Gmail, GitHub)

## Step 1: Configure Environment Variables

1. Open the `.env` file in the root of your project.
2. Fill in the following environment variables:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://xxrgftoxwcsxzgqheplz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cmdmdG94d2NzeHpncWhlcGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNjcxNDksImV4cCI6MjA1OTY0MzE0OX0.8TjR_pSAkU6q_wPrJ9Fq-UNzztd9mB3YdMk-oSVOO24

# Notion API (if using Notion integration)
NOTION_API_KEY=your_notion_api_key_here
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=http://localhost:5174/api/auth/notion/callback

# Gmail/Google API (if using Gmail integration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5174/api/auth/google/callback

# GitHub API (if using GitHub integration)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5174/api/auth/github/callback

# JWT Secret (for session management)
JWT_SECRET=your_jwt_secret_here
```

For the `JWT_SECRET`, you can generate a random string using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Set Up Supabase Vector Database

1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Once your project is created, go to the SQL Editor.
3. Create a new query and paste the following SQL:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing documents with embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- Dimension for OpenAI embeddings
  metadata JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to search for similar documents
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  source TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity,
    documents.metadata,
    documents.source
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

4. Run the query to create the necessary tables and functions.
5. Go to Project Settings > API to get your Supabase URL and anon key.
6. Add these to your `.env` file as `SUPABASE_URL` and `SUPABASE_KEY`.

## Step 3: Set Up OpenAI API

1. Create an account at [https://platform.openai.com](https://platform.openai.com) if you don't have one.
2. Go to API Keys and create a new secret key.
3. Add this key to your `.env` file as `OPENAI_API_KEY`.
4. Make sure you have billing set up for your OpenAI account to use the API.

## Step 4: Set Up Notion Integration (Optional)

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Click "New integration".
3. Fill in the details:
   - Name: "Atlas Assistant"
   - Logo: (optional)
   - Capabilities: Read content, Update content, Insert content
4. Click "Submit".
5. Copy the "Internal Integration Token" and add it to your `.env` file as `NOTION_API_KEY`.
6. For OAuth (optional):
   - Go to the "OAuth Domain & URIs" section.
   - Add your redirect URI: `http://localhost:5174/api/auth/notion/callback`
   - Copy the OAuth client ID and secret to your `.env` file as `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`.

## Step 5: Set Up Gmail Integration (Optional)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library".
   - Search for "Gmail API" and enable it.
4. Configure the OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen".
   - Select "External" and fill in the required information.
   - Add the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add your email as a test user.
5. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials".
   - Click "Create Credentials" > "OAuth client ID".
   - Select "Web application".
   - Add your redirect URI: `http://localhost:5174/api/auth/google/callback`
   - Copy the client ID and client secret to your `.env` file as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Step 6: Set Up GitHub Integration (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click "New OAuth App".
3. Fill in the details:
   - Application name: "Atlas Assistant"
   - Homepage URL: `http://localhost:5174`
   - Authorization callback URL: `http://localhost:5174/api/auth/github/callback`
4. Click "Register application".
5. Generate a new client secret.
6. Copy the client ID and client secret to your `.env` file as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## Step 7: Install Dependencies and Start the Application

1. Install the project dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to [http://localhost:5174](http://localhost:5174).

## Step 8: Configure Atlas

1. Go to the Settings page.
2. In the API Configuration section, enter your OpenAI API key and Supabase credentials.
3. Connect the integrations you want to use (Notion, Gmail, GitHub).
4. Start using Atlas!

## Troubleshooting

If you encounter any issues:

1. Check that all environment variables are correctly set in the `.env` file.
2. Make sure your Supabase database is properly set up with the pgvector extension.
3. Verify that your API keys and OAuth credentials are correct.
4. Check the browser console and server logs for any error messages.

## Next Steps

Once you have Atlas up and running, you can:

1. Add content to the knowledge base using the various integrations.
2. Ask questions about your Notion pages, GitHub repositories, or emails.
3. Use Atlas to help you manage tasks, draft emails, and more.
4. Customize the UI and add more features as needed.

Enjoy your personal AI assistant!
