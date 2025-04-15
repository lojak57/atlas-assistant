<script lang="ts">
  import { onMount } from 'svelte';
  import { messages, isProcessing, addMessage } from '$lib/stores/atlas';
  import type { Message } from '$lib/types';
  import { fly, fade } from 'svelte/transition';

  let userInput = '';
  let messageList = $messages;
  let processing = $isProcessing;
  let chatContainer: HTMLElement;
  let isAtBottom = true;

  // Subscribe to messages store
  $: messageList = $messages;
  $: processing = $isProcessing;

  // Auto-scroll to bottom when messages change
  $: if (messageList && chatContainer && isAtBottom) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: userInput };
    addMessage(userMessage);

    // Clear input
    userInput = '';

    // Set processing state
    isProcessing.set(true);

    try {
      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant message
        addMessage({ role: 'assistant', content: data.response });
      } else {
        // Add error message
        addMessage({
          role: 'system',
          content: `Error: ${data.error || 'Failed to get response from Atlas'}`
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'system',
        content: 'Sorry, there was an error communicating with the server.'
      });
    } finally {
      isProcessing.set(false);
    }
  }

  // Handle scroll events to determine if user is at bottom
  function handleScroll() {
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    }
  }

  onMount(() => {
    // Focus the input field when component mounts
    const inputElement = document.getElementById('user-input');
    if (inputElement) {
      inputElement.focus();
    }
  });
</script>

<div class="flex flex-col h-[calc(100vh-250px)] rounded-xl overflow-hidden bg-white/80 backdrop-blur-md border border-neutral-200 shadow-lg">
  <!-- Chat header -->
  <div class="p-4 border-b border-neutral-200 bg-white/90 backdrop-blur-md flex items-center justify-between">
    <div class="flex items-center">
      <div class="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-600 flex items-center justify-center text-white mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div>
        <h3 class="font-medium text-neutral-800">Atlas Chat</h3>
        <p class="text-xs text-neutral-500">{processing ? 'Thinking...' : 'Online'}</p>
      </div>
    </div>
    <div class="flex space-x-2">
      <button
        class="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
        aria-label="Menu options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </button>
    </div>
  </div>

  <!-- Chat messages -->
  <div
    class="flex-grow overflow-y-auto p-4 space-y-4 bg-neutral-50/50"
    id="chat-messages"
    bind:this={chatContainer}
    on:scroll={handleScroll}
  >
    {#each messageList as message, i (i)}
      <div
        class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        in:fly={{ y: 10, duration: 150, delay: 50 }}
      >
        <div
          class={`max-w-[85%] p-4 rounded-2xl shadow-sm ${message.role === 'user'
            ? 'bg-primary-500 text-white'
            : message.role === 'system'
              ? 'bg-neutral-200 text-neutral-800'
              : 'bg-white border border-neutral-200 text-neutral-800'}`}
        >
          <div class="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    {/each}

    {#if processing}
      <div class="flex justify-start" in:fade={{ duration: 200 }}>
        <div class="max-w-[85%] p-4 rounded-2xl bg-white border border-neutral-200 text-neutral-800 shadow-sm">
          <div class="flex space-x-2">
            <div class="w-2 h-2 rounded-full bg-primary-400 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input area -->
  <div class="border-t border-neutral-200 p-4 bg-white/90 backdrop-blur-md">
    <form on:submit|preventDefault={handleSubmit} class="flex space-x-2">
      <input
        id="user-input"
        type="text"
        bind:value={userInput}
        placeholder="Ask Atlas anything..."
        class="flex-grow p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80"
        disabled={processing}
      />
      <button
        type="submit"
        class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all shadow-sm"
        disabled={processing || !userInput.trim()}
      >
        {#if processing}
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mr-1">
              <path d="M22 2L11 13"></path>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
            Send
          </span>
        {/if}
      </button>
    </form>
  </div>
</div>
