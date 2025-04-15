<script lang="ts">
  import ChatInterface from '$lib/components/ChatInterface.svelte';
  import { onMount } from 'svelte';

  let title = 'Atlas AI Assistant';
  let isLoaded = false;

  onMount(() => {
    // Add a small delay for animation
    setTimeout(() => {
      isLoaded = true;
    }, 100);
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-5xl">
  <div class="text-center mb-8 animate-slide-up" class:opacity-100={isLoaded} class:opacity-0={!isLoaded} style="transition: opacity 0.5s ease-out;">
    <h1 class="text-4xl md:text-5xl font-bold mb-4 gradient-text">{title}</h1>
    <p class="text-neutral-600 dark:text-neutral-300 text-lg max-w-2xl mx-auto">
      Your personal AI assistant with Notion, Gmail, GitHub, and iCloud integration
    </p>
  </div>

  <div class="glass-card p-1 animate-slide-up" style="transition-delay: 0.2s;">
    <ChatInterface />
  </div>
</div>
