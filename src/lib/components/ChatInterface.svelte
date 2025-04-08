<script lang="ts">
  import { onMount } from 'svelte';
  import { messages, isProcessing, addMessage } from '$lib/stores/atlas';
  import type { Message } from '$lib/types';

  let userInput = $state('');
  let messageList = $derived($messages);
  let processing = $derived($isProcessing);

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

  onMount(() => {
    // Focus the input field when component mounts
    document.getElementById('user-input')?.focus();
  });
</script>

<div class="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto border rounded-lg overflow-hidden bg-white shadow-lg">
  <div class="flex-grow overflow-y-auto p-4 space-y-4" id="chat-messages">
    {#each messageList as message}
      <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div class={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-indigo-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
          {message.content}
        </div>
      </div>
    {/each}

    {#if processing}
      <div class="flex justify-start">
        <div class="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
          <div class="flex space-x-2">
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="border-t p-4">
    <form onsubmit={handleSubmit} class="flex space-x-2">
      <input
        id="user-input"
        type="text"
        bind:value={userInput}
        placeholder="Ask Atlas anything..."
        class="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        disabled={processing || !userInput.trim()}
      >
        Send
      </button>
    </form>
  </div>
</div>
