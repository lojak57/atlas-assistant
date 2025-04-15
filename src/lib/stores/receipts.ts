import { writable } from 'svelte/store';
import type { Receipt } from '$lib/types/receipt';
import { browser } from '$app/environment';

// Initialize the store with data from localStorage if available
const storedReceipts = browser ? localStorage.getItem('scannedReceipts') : null;
const initialReceipts: Receipt[] = storedReceipts ? JSON.parse(storedReceipts) : [];

// Create a writable store
export const scannedReceipts = writable<Receipt[]>(initialReceipts);

// Subscribe to changes and update localStorage
if (browser) {
  scannedReceipts.subscribe(value => {
    localStorage.setItem('scannedReceipts', JSON.stringify(value));
  });
}

// Function to add a new receipt
export function addReceipt(receipt: Receipt) {
  scannedReceipts.update(receipts => {
    // Add the new receipt at the beginning of the array
    const updatedReceipts = [receipt, ...receipts];

    // Keep only the last 20 receipts to avoid localStorage size issues
    if (updatedReceipts.length > 20) {
      return updatedReceipts.slice(0, 20);
    }

    return updatedReceipts;
  });
}

// Function to get all receipts
export function getAllReceipts(): Receipt[] {
  let result: Receipt[] = [];
  const unsubscribe = scannedReceipts.subscribe(value => {
    result = value;
  });
  unsubscribe();
  return result;
}
