<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { Receipt } from '$lib/types/receipt';

  // Props
  export let receipt: Receipt;
  export let isOpen = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    save: Receipt;
  }>();

  // Local state for editing
  let editMode = false;
  let editedReceipt: Receipt;

  // Initialize the edited receipt when the component is mounted or receipt changes
  $: if (receipt) {
    editedReceipt = { ...receipt };
  }

  // Handle close button click
  function handleClose() {
    editMode = false;
    dispatch('close');
  }

  // Handle edit button click
  function handleEdit() {
    editMode = true;
  }

  // Handle save button click
  function handleSave() {
    dispatch('save', editedReceipt);
    editMode = false;
  }

  // Handle cancel edit button click
  function handleCancelEdit() {
    editedReceipt = { ...receipt };
    editMode = false;
  }

  // Format currency values
  function formatCurrency(value: number | string): string {
    if (typeof value === 'string') {
      value = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  }

  // Format date for display
  function formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    transition:fade={{ duration: 200 }}
    on:click={handleClose}
  >
    <div
      class="bg-white/95 backdrop-blur-md rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200"
      transition:scale={{ duration: 200, start: 0.95, opacity: 0, easing: quintOut }}
      on:click|stopPropagation={() => {}}
    >
      <!-- Modal Header -->
      <div class="border-b border-neutral-200 px-6 py-4 flex justify-between items-center bg-white/80">
        <h3 class="text-xl font-semibold text-neutral-800">
          {editMode ? 'Edit Expense' : 'Expense Details'}
        </h3>
        <button
          on:click={handleClose}
          class="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="px-6 py-4">
        {#if editMode}
          <!-- Edit Mode -->
          <div class="space-y-4">
            <div>
              <label for="vendor" class="block text-sm font-medium text-gray-700">Vendor</label>
              <input
                type="text"
                id="vendor"
                bind:value={editedReceipt.vendor}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                bind:value={editedReceipt.date}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="total" class="block text-sm font-medium text-gray-700">Total Amount</label>
              <input
                type="number"
                id="total"
                bind:value={editedReceipt.total}
                step="0.01"
                min="0"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="tax" class="block text-sm font-medium text-gray-700">Tax</label>
              <input
                type="number"
                id="tax"
                bind:value={editedReceipt.tax}
                step="0.01"
                min="0"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                bind:value={editedReceipt.category}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Office">Office</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="notes"
                bind:value={editedReceipt.notes}
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        {:else}
          <!-- View Mode -->
          <div class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-gray-800">{receipt.vendor}</h4>
              <span class="text-lg font-bold text-blue-600">{formatCurrency(receipt.total)}</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Date</p>
                <p class="font-medium">{formatDate(receipt.date)}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">Category</p>
                <p class="font-medium">{receipt.category || 'Uncategorized'}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">Tax</p>
                <p class="font-medium">{receipt.tax ? formatCurrency(receipt.tax) : 'N/A'}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">Receipt ID</p>
                <p class="font-medium text-gray-600 text-sm">{receipt.id || 'Not assigned'}</p>
              </div>
            </div>

            {#if receipt.notes}
              <div>
                <p class="text-sm text-gray-500">Notes</p>
                <p class="p-3 bg-gray-50 rounded-md mt-1">{receipt.notes}</p>
              </div>
            {/if}

            {#if receipt.items && receipt.items.length > 0}
              <div>
                <p class="text-sm text-gray-500 mb-2">Items</p>
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each receipt.items as item}
                      <tr>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.price)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="border-t px-6 py-4 flex justify-end space-x-3">
        {#if editMode}
          <button
            on:click={handleCancelEdit}
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            on:click={handleSave}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        {:else}
          <button
            on:click={handleEdit}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
