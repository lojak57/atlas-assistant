<script lang="ts">
  import { onMount } from 'svelte';
  import { integrationStatus, updateIntegrationStatus } from '$lib/stores/atlas';
  import { gmailService, githubService, icloudService } from '$lib/services';

  let status = $derived($integrationStatus);
  let iCloudUsername = $state('');
  let iCloudPassword = $state('');
  let iCloudError = $state('');
  let iCloudLoading = $state(false);

  onMount(() => {
    // Check URL parameters for OAuth callback status
    const url = new URL(window.location.href);
    const integration = url.searchParams.get('integration');
    const oauthStatus = url.searchParams.get('status');

    if (integration && oauthStatus === 'success') {
      // Update integration status based on OAuth callback
      if (integration === 'notion' || integration === 'gmail' || integration === 'github') {
        updateIntegrationStatus(integration, true);
      }

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });

  // Connect to Notion via OAuth (disabled for now)
  function connectNotion() {
    // Notion integration removed for now
    console.log('Notion integration is not available yet');
    alert('Notion integration is not available yet');
  }

  // Connect to Gmail via OAuth
  async function connectGmail() {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = await gmailService.getAuthUrl(state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting Gmail auth URL:', error);
      alert('Failed to connect to Gmail. Please try again later.');
    }
  }

  // Connect to GitHub via OAuth
  function connectGitHub() {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = githubService.getAuthUrl(state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting GitHub auth URL:', error);
      alert('Failed to connect to GitHub. Please try again later.');
    }
  }

  // Connect to iCloud via form submission
  async function connectiCloud() {
    if (!iCloudUsername || !iCloudPassword) {
      iCloudError = 'Username and password are required';
      return;
    }

    iCloudError = '';
    iCloudLoading = true;

    try {
      // In a real implementation, this would securely authenticate with iCloud
      // For now, we'll use our placeholder implementation
      const connected = await icloudService.connect({
        username: iCloudUsername,
        password: iCloudPassword
      });

      updateIntegrationStatus('icloud', connected);

      // Clear form if successful
      if (connected) {
        iCloudUsername = '';
        iCloudPassword = '';
      }
    } catch (error) {
      console.error('Error connecting to iCloud:', error);
      iCloudError = error instanceof Error ? error.message : 'Failed to connect to iCloud';
    } finally {
      iCloudLoading = false;
    }
  }

  // Disconnect from a service
  async function disconnectService(service: 'notion' | 'gmail' | 'github' | 'icloud') {
    try {
      switch (service) {
        case 'notion':
          // Notion service removed for now
          console.log('Notion service not available');
          break;
        case 'gmail':
          await gmailService.disconnect();
          break;
        case 'github':
          await githubService.disconnect();
          break;
        case 'icloud':
          await icloudService.disconnect();
          break;
      }
      updateIntegrationStatus(service, false);
    } catch (error) {
      console.error(`Error disconnecting from ${service}:`, error);
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-semibold mb-4">Integrations</h2>

  <div class="space-y-4">
    <!-- Notion Integration -->
    <div class="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <h3 class="font-medium">Notion</h3>
        <p class="text-sm text-gray-500">Connect to your Notion workspace</p>
      </div>
      {#if status.notion}
        <button
          class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          onclick={() => disconnectService('notion')}
        >
          Disconnect
        </button>
      {:else}
        <button
          class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          onclick={connectNotion}
        >
          Connect
        </button>
      {/if}
    </div>

    <!-- Gmail Integration -->
    <div class="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <h3 class="font-medium">Gmail</h3>
        <p class="text-sm text-gray-500">Connect to your Gmail account</p>
      </div>
      {#if status.gmail}
        <button
          class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          onclick={() => disconnectService('gmail')}
        >
          Disconnect
        </button>
      {:else}
        <button
          class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          onclick={connectGmail}
        >
          Connect
        </button>
      {/if}
    </div>

    <!-- GitHub Integration -->
    <div class="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <h3 class="font-medium">GitHub</h3>
        <p class="text-sm text-gray-500">Connect to your GitHub repositories</p>
      </div>
      {#if status.github}
        <button
          class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          onclick={() => disconnectService('github')}
        >
          Disconnect
        </button>
      {:else}
        <button
          class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          onclick={connectGitHub}
        >
          Connect
        </button>
      {/if}
    </div>

    <!-- iCloud Integration -->
    <div class="p-3 border rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-medium">iCloud</h3>
          <p class="text-sm text-gray-500">Connect to your iCloud account</p>
        </div>
        {#if status.icloud}
          <button
            class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            onclick={() => disconnectService('icloud')}
          >
            Disconnect
          </button>
        {/if}
      </div>

      {#if !status.icloud}
        <form onsubmit={(e) => { e.preventDefault(); connectiCloud(); }} class="mt-3">
          <div class="space-y-3">
            <div>
              <label for="icloud-username" class="block text-sm font-medium text-gray-700 mb-1">Apple ID</label>
              <input
                id="icloud-username"
                type="email"
                value={iCloudUsername}
                onchange={(e) => { iCloudUsername = (e.target as HTMLInputElement).value; }}
                placeholder="your.email@example.com"
                class="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label for="icloud-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="icloud-password"
                type="password"
                value={iCloudPassword}
                onchange={(e) => { iCloudPassword = (e.target as HTMLInputElement).value; }}
                placeholder="••••••••"
                class="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {#if iCloudError}
              <div class="text-sm text-red-600">{iCloudError}</div>
            {/if}

            <div>
              <button
                type="submit"
                class="w-full px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:opacity-50"
                disabled={iCloudLoading}
              >
                {#if iCloudLoading}
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                {:else}
                  Connect
                {/if}
              </button>
            </div>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
