<script lang="ts">
  import { onMount } from 'svelte';

  let openaiApiKey = $state('');
  let supabaseUrl = $state('');
  let supabaseKey = $state('');
  let showKeys = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  // In a real app, you would check if the keys are already set in the server
  // For now, we'll just simulate this
  let keysConfigured = $state(false);

  onMount(() => {
    // In a real app, you would fetch this information from the server
    // For now, we'll just simulate this
    setTimeout(() => {
      keysConfigured = false;
    }, 500);
  });

  async function saveApiKeys() {
    saveStatus = 'saving';
    errorMessage = '';

    try {
      // In a real app, you would send these to your server to be stored securely
      // For now, we'll just simulate a successful save and test the connections

      // Test the connections
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          openaiApiKey,
          supabaseUrl,
          supabaseKey
        })
      });

      const results = await response.json();

      if (!results.openai.success || !results.supabase.success) {
        saveStatus = 'error';
        errorMessage = `Connection test failed:\n${!results.openai.success ? `- OpenAI: ${results.openai.message}\n` : ''}${!results.supabase.success ? `- Supabase: ${results.supabase.message}` : ''}`;
        return;
      }

      // Simulate success
      saveStatus = 'success';
      keysConfigured = true;

      // Reset after a few seconds
      setTimeout(() => {
        saveStatus = 'idle';
      }, 3000);
    } catch (error) {
      console.error('Error saving API keys:', error);
      saveStatus = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    }
  }

  // Toggle visibility of API keys
  function handleToggleShowKeys() {
    showKeys = !showKeys;
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">API Configuration</h2>
    <a href="/setup-guide" class="text-sm text-indigo-600 hover:text-indigo-800">Setup Guide</a>
  </div>

  {#if keysConfigured}
    <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-800">
            API keys are configured. Atlas is ready to use!
          </p>
        </div>
      </div>
    </div>

    <button
      class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
      onclick={() => keysConfigured = false}
    >
      Update API Keys
    </button>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); saveApiKeys(); }} class="space-y-4">
      <div>
        <label for="openai-api-key" class="block text-sm font-medium text-gray-700 mb-1">
          OpenAI API Key
        </label>
        <div class="relative">
          <input
            id="openai-api-key"
            type={showKeys ? 'text' : 'password'}
            bind:value={openaiApiKey}
            placeholder="sk-..."
            class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">OpenAI Dashboard</a>
        </p>
      </div>

      <div>
        <label for="supabase-url" class="block text-sm font-medium text-gray-700 mb-1">
          Supabase URL
        </label>
        <input
          id="supabase-url"
          type={showKeys ? 'text' : 'password'}
          bind:value={supabaseUrl}
          placeholder="https://your-project.supabase.co"
          class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label for="supabase-key" class="block text-sm font-medium text-gray-700 mb-1">
          Supabase Anon Key
        </label>
        <input
          id="supabase-key"
          type={showKeys ? 'text' : 'password'}
          bind:value={supabaseKey}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <p class="mt-1 text-xs text-gray-500">
          Get your Supabase URL and key from <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">Supabase Dashboard</a>
        </p>
      </div>

      <div class="flex items-center">
        <input
          type="checkbox"
          id="show-keys"
          checked={showKeys}
          onchange={handleToggleShowKeys}
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label for="show-keys" class="ml-2 text-sm text-gray-700">Show API keys</label>
      </div>

      {#if errorMessage}
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={saveStatus === 'saving'}
        >
          {#if saveStatus === 'saving'}
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          {:else if saveStatus === 'success'}
            <span class="flex items-center">
              <svg class="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Saved!
            </span>
          {:else}
            Save API Keys
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
