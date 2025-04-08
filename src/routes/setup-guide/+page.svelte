<script lang="ts">
  // Setup guide for Supabase Vector and OpenAI
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Atlas Setup Guide</h1>

  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-semibold mb-4">Setting Up Supabase Vector</h2>

    <div class="prose max-w-none">
      <p>Follow these steps to set up Supabase Vector for your Atlas AI Assistant:</p>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 1: Create a Supabase Project</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">Supabase</a> and sign up or log in.</li>
        <li>Create a new project by clicking "New Project".</li>
        <li>Give your project a name (e.g., "atlas-assistant") and set a secure database password.</li>
        <li>Choose a region closest to your location.</li>
        <li>Click "Create new project" and wait for it to be created (this may take a few minutes).</li>
      </ol>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 2: Enable pgvector Extension</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>In your Supabase project dashboard, go to the "SQL Editor" tab.</li>
        <li>Click "New Query" and paste the following SQL:</li>
        <pre class="bg-gray-100 p-3 rounded-md overflow-x-auto"><code>-- Enable the pgvector extension
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
    1 - (documents.embedding &lt;=&gt; query_embedding) AS similarity,
    documents.metadata,
    documents.source
  FROM documents
  WHERE 1 - (documents.embedding &lt;=&gt; query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;</code></pre>
        <li>Click "Run" to execute the SQL and set up your vector database.</li>
      </ol>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 3: Get Your Supabase Credentials</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>In your Supabase project dashboard, go to the "Project Settings" tab.</li>
        <li>Click on "API" in the sidebar.</li>
        <li>Copy the "URL" and "anon public" key.</li>
        <li>Add these to your Atlas settings in the "API Configuration" section.</li>
      </ol>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-semibold mb-4">Setting Up OpenAI</h2>

    <div class="prose max-w-none">
      <p>Follow these steps to set up OpenAI for your Atlas AI Assistant:</p>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 1: Create an OpenAI Account</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">OpenAI</a> and sign up or log in.</li>
        <li>Complete the account setup process.</li>
      </ol>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 2: Get Your API Key</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>In your OpenAI dashboard, click on your profile icon in the top-right corner.</li>
        <li>Select "API keys" from the dropdown menu.</li>
        <li>Click "Create new secret key" and give it a name (e.g., "Atlas Assistant").</li>
        <li>Copy the API key (you won't be able to see it again).</li>
        <li>Add this to your Atlas settings in the "API Configuration" section.</li>
      </ol>

      <h3 class="text-xl font-medium mt-6 mb-3">Step 3: Set Up Billing (Required for API Access)</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li>In your OpenAI dashboard, go to the "Billing" section.</li>
        <li>Add a payment method and set up a usage limit if desired.</li>
        <li>OpenAI offers $5 of free credit for new accounts, which is enough to get started.</li>
      </ol>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-semibold mb-4">Integration Guides</h2>

    <div class="prose max-w-none">
      <p>Atlas can integrate with various services to enhance its capabilities:</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <a href="/setup-guide/integrations" class="block p-4 border rounded-lg hover:bg-gray-50">
          <h3 class="text-lg font-medium text-indigo-600">Integration Setup Guide</h3>
          <p class="text-gray-600 mt-1">Learn how to set up Notion, Gmail, GitHub, and iCloud integrations</p>
        </a>
      </div>
    </div>
  </div>

  <div class="flex justify-between mt-6">
    <a href="/settings" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
      Back to Settings
    </a>
    <a href="/" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
      Go to Atlas
    </a>
  </div>
</div>
