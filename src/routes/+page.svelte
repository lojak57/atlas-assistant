<script lang="ts">
  import ChatInterface from '$lib/components/ChatInterface.svelte';
  let title = $state('Atlas AI Assistant');
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">{title}</h1>
  <p class="text-gray-600 mb-6">Your personal AI assistant with Notion, Gmail, GitHub, and iCloud integration</p>

  <ChatInterface />
</div>
