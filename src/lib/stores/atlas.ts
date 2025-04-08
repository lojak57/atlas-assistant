import { writable } from 'svelte/store';
import type { Message } from '$lib/types';

// Create stores for application state
export const messages = writable<Message[]>([
  { 
    role: 'system', 
    content: 'Welcome to Atlas! I\'m your personal AI assistant. How can I help you today?',
    timestamp: new Date()
  }
]);

export const integrationStatus = writable({
  notion: false,
  gmail: false,
  github: false,
  icloud: false
});

export const isProcessing = writable(false);

// Helper functions to update stores
export function addMessage(message: Message) {
  messages.update(msgs => [...msgs, { ...message, timestamp: new Date() }]);
}

export function updateIntegrationStatus(integration: 'notion' | 'gmail' | 'github' | 'icloud', status: boolean) {
  integrationStatus.update(current => ({ ...current, [integration]: status }));
}

export function setProcessing(status: boolean) {
  isProcessing.set(status);
}
