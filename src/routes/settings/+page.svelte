<script lang="ts">
  import IntegrationSettings from '$lib/components/IntegrationSettings.svelte';
  import ApiKeySetup from '$lib/components/ApiKeySetup.svelte';
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Atlas Settings</h1>

  <div class="grid grid-cols-1 gap-6">
    <!-- API Key Setup (Most important, so it comes first) -->
    <ApiKeySetup />

    <!-- Integration Settings -->
    <IntegrationSettings />

    <!-- General Settings -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">General Settings</h2>

      <div class="space-y-4">
        <div class="flex flex-col">
          <label for="assistant-name" class="text-sm font-medium text-gray-700 mb-1">Assistant Name</label>
          <input
            type="text"
            id="assistant-name"
            value="Atlas"
            class="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="enable-notifications"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="enable-notifications" class="ml-2 text-sm text-gray-700">Enable Notifications</label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="auto-connect"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="auto-connect" class="ml-2 text-sm text-gray-700">Auto-connect on startup</label>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6 flex justify-end">
    <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      Save Settings
    </button>
  </div>
</div>
