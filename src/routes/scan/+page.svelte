<script lang="ts">
  import ReceiptScanner from '$lib/components/ReceiptScanner.svelte';
  import type { Receipt } from '$lib/types/receipt';
  import { goto } from '$app/navigation';
  import { addReceipt } from '$lib/stores/receipts';

  let lastReceipt: Receipt | null = null;

  function handleReceiptProcessed(receipt: Receipt) {
    lastReceipt = receipt;

    // Add the current date to the receipt if not provided
    if (!receipt.date) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      receipt.date = `${year}-${month}-${day}`;
    }

    // Add the receipt to our store
    addReceipt(receipt);
    console.log('Added receipt to store:', receipt);

    // After a short delay, navigate to the dashboard
    setTimeout(() => {
      goto('/dashboard');
    }, 2000);
  }
</script>

<div class="container mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-8 text-center">Receipt Scanner</h1>

  <ReceiptScanner onReceiptProcessed={handleReceiptProcessed} />

  {#if lastReceipt}
    <div class="mt-8 p-4 bg-green-50 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold text-green-700 mb-2">Receipt Processed Successfully!</h3>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-sm text-gray-600">Vendor:</span>
          <p class="font-medium">{lastReceipt.vendor}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Date:</span>
          <p class="font-medium">{lastReceipt.date}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Total:</span>
          <p class="font-medium">${lastReceipt.total}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Category:</span>
          <p class="font-medium">{lastReceipt.category}</p>
        </div>
      </div>
      <p class="text-sm text-gray-600 mt-2">Redirecting to dashboard...</p>
    </div>
  {/if}
</div>
