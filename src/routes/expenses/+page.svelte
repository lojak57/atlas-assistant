<script lang="ts">
  import { onMount } from 'svelte';
  import type { Receipt } from '$lib/types/receipt';
  import ExpenseModal from '$lib/components/ExpenseModal.svelte';
  import { scannedReceipts } from '$lib/stores/receipts';

  // Component state
  let expenses: Receipt[] = [];
  let filteredExpenses: Receipt[] = [];
  let loading = true;
  let error: string | null = null;
  let exportLoading = false;
  let exportSuccess: string | null = null;
  let exportError: string | null = null;
  let exportUrl: string | null = null;

  // Filter state
  let searchQuery = '';
  let categoryFilter = 'All';
  let dateRangeStart = '';
  let dateRangeEnd = '';

  // Modal state
  let selectedReceipt: Receipt | null = null;
  let isModalOpen = false;

  // Available categories
  let categories: string[] = ['All'];

  // Fetch data from API on mount
  onMount(async () => {
    try {
      // Get receipts from the API
      const res = await fetch('/api/receipts');

      if (!res.ok) {
        throw new Error(`Failed to fetch receipts: ${res.status} ${res.statusText}`);
      }

      // Get mock receipts from the API
      const apiReceipts = await res.json();

      // Get scanned receipts from the store
      let storedReceipts: Receipt[] = [];
      const unsubscribe = scannedReceipts.subscribe(value => {
        storedReceipts = value;
      });
      unsubscribe(); // Unsubscribe immediately to avoid memory leaks

      console.log('Stored receipts:', storedReceipts);
      console.log('API receipts:', apiReceipts);

      // Combine both sources of receipts
      expenses = [...storedReceipts, ...apiReceipts];

      // Extract unique categories
      const uniqueCategories = new Set<string>();
      expenses.forEach(exp => {
        if (exp.category) {
          uniqueCategories.add(exp.category);
        }
      });

      categories = ['All', ...Array.from(uniqueCategories)];

      // Initialize filtered expenses
      applyFilters();
    } catch (e) {
      console.error("Failed to load expenses data", e);
      error = e instanceof Error ? e.message : 'Unknown error occurred';
    } finally {
      loading = false;
    }
  });

  // Apply filters to expenses
  function applyFilters() {
    filteredExpenses = expenses.filter(exp => {
      // Apply search query filter
      const matchesSearch = searchQuery === '' ||
        exp.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply category filter
      const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;

      // Apply date range filter
      let matchesDateRange = true;
      if (dateRangeStart) {
        matchesDateRange = matchesDateRange && exp.date >= dateRangeStart;
      }
      if (dateRangeEnd) {
        matchesDateRange = matchesDateRange && exp.date <= dateRangeEnd;
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }

  // Handle filter changes
  function handleFilterChange() {
    applyFilters();
  }

  // Open the expense modal
  function openExpenseModal(receipt: Receipt) {
    selectedReceipt = receipt;
    isModalOpen = true;
  }

  // Close the expense modal
  function closeExpenseModal() {
    isModalOpen = false;
  }

  // Handle saving edited receipt
  function handleSaveReceipt(event: CustomEvent<Receipt>) {
    const updatedReceipt = event.detail;

    // Find the index of the receipt in the expenses array
    const index = expenses.findIndex(r =>
      r.date === selectedReceipt?.date &&
      r.vendor === selectedReceipt?.vendor &&
      r.total === selectedReceipt?.total
    );

    if (index !== -1) {
      // Update the receipt in the expenses array
      expenses[index] = updatedReceipt;
      expenses = [...expenses]; // Trigger reactivity

      // Update filtered expenses
      applyFilters();

      // In a real app, you would also update the receipt in the database
      console.log('Receipt updated:', updatedReceipt);
    }

    // Close the modal
    closeExpenseModal();
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
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Export receipts to Google Sheets
  async function exportToGoogleSheets() {
    // Reset export state
    exportLoading = true;
    exportSuccess = null;
    exportError = null;
    exportUrl = null;

    try {
      // Call the export API
      const response = await fetch('/api/receipts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receipts: filteredExpenses
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export receipts');
      }

      // Set success state
      exportSuccess = result.message || 'Receipts exported successfully';
      exportUrl = result.exportUrl || result.sheetUrl;
    } catch (e) {
      console.error('Error exporting receipts:', e);
      exportError = e instanceof Error ? e.message : 'Unknown error occurred';
    } finally {
      exportLoading = false;
    }
  }
</script>

<div class="container mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-8 text-center">All Expenses</h1>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
      <p class="font-semibold">Error loading expenses</p>
      <p>{error}</p>
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
      <h2 class="text-lg font-semibold mb-4">Filters</h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            on:input={handleFilterChange}
            placeholder="Search vendor, category, notes..."
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Category Filter -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            id="category"
            bind:value={categoryFilter}
            on:change={handleFilterChange}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>

        <!-- Date Range Start -->
        <div>
          <label for="date-start" class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            id="date-start"
            bind:value={dateRangeStart}
            on:change={handleFilterChange}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Date Range End -->
        <div>
          <label for="date-end" class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            id="date-end"
            bind:value={dateRangeEnd}
            on:change={handleFilterChange}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- Expenses Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold">Expenses ({filteredExpenses.length})</h2>

        <button
          on:click={exportToGoogleSheets}
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          disabled={exportLoading || filteredExpenses.length === 0}
        >
          {#if exportLoading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          {:else}
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Google Sheets
          {/if}
        </button>
      </div>

      <!-- Export Status Messages -->
      {#if exportSuccess}
        <div class="m-4 p-3 bg-green-50 text-green-700 rounded-md flex justify-between items-center">
          <div>
            <p class="font-medium">{exportSuccess}</p>
            {#if exportUrl}
              <p class="text-sm mt-1">View your exported data in Google Sheets</p>
            {/if}
          </div>
          {#if exportUrl}
            <a
              href={exportUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Open Sheet
            </a>
          {/if}
        </div>
      {/if}

      {#if exportError}
        <div class="m-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p class="font-medium">Export failed</p>
          <p class="text-sm mt-1">{exportError}</p>
        </div>
      {/if}

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-700">
            <tr>
              <th class="p-3">Date</th>
              <th class="p-3">Vendor</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Amount</th>
              <th class="p-3">Notes</th>
              <th class="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredExpenses as exp}
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">{formatDate(exp.date)}</td>
                <td class="p-3">{exp.vendor || 'Unknown'}</td>
                <td class="p-3">
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {exp.category || 'Uncategorized'}
                  </span>
                </td>
                <td class="p-3 text-right font-medium">
                  {typeof exp.total === 'number'
                    ? formatCurrency(exp.total)
                    : formatCurrency(parseFloat(exp.total?.toString().replace(/[^0-9.-]+/g, '') || '0'))}
                </td>
                <td class="p-3 text-gray-500 truncate max-w-[200px]">{exp.notes || '-'}</td>
                <td class="p-3 text-center">
                  <button
                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    on:click={() => openExpenseModal(exp)}
                  >
                    View
                  </button>
                </td>
              </tr>
            {/each}

            {#if filteredExpenses.length === 0}
              <tr>
                <td colspan="6" class="p-4 text-center text-gray-500">
                  {expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match your filters'}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Expense Modal -->
    {#if selectedReceipt}
      <ExpenseModal
        receipt={selectedReceipt}
        isOpen={isModalOpen}
        on:close={closeExpenseModal}
        on:save={handleSaveReceipt}
      />
    {/if}
  {/if}
</div>
