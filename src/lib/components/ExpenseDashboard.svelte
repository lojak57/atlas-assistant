<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import Chart from 'chart.js/auto';
  import type { Receipt } from '$lib/types/receipt';
  import ExpenseModal from './ExpenseModal.svelte';
  import { scannedReceipts } from '$lib/stores/receipts';

  // Component state
  let expenses: Receipt[] = [];
  let totalExpense = 0;
  let categorySummary: Record<string, number> = {};
  let vendorSummary: Record<string, number> = {};
  let monthlySummary: Record<string, number> = {};
  let loading = true;
  let error: string | null = null;

  // Export state
  let exportLoading = false;
  let exportSuccess: string | null = null;
  let exportError: string | null = null;
  let exportUrl: string | null = null;

  // Modal state
  let selectedReceipt: Receipt | null = null;
  let isModalOpen = false;

  // Chart references
  let categoryChartCanvas: HTMLCanvasElement;
  let trendChartCanvas: HTMLCanvasElement;
  let categoryChart: Chart;
  let trendChart: Chart;

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

      // Compute summaries and draw charts
      computeSummaries();
      drawCharts();
    } catch (e) {
      console.error("Failed to load expenses data", e);
      error = e instanceof Error ? e.message : 'Unknown error occurred';
    } finally {
      loading = false;
    }
  });

  // Compute summary statistics from expenses data
  function computeSummaries() {
    totalExpense = 0;
    categorySummary = {};
    vendorSummary = {};
    monthlySummary = {};

    for (const item of expenses) {
      // Parse total as number if it's a string
      const total = typeof item.total === 'string'
        ? parseFloat(item.total.replace(/[^0-9.-]+/g, ''))
        : item.total;

      if (!isNaN(total)) {
        totalExpense += total;

        // Group by category
        const cat = item.category || 'Uncategorized';
        categorySummary[cat] = (categorySummary[cat] || 0) + total;

        // Group by vendor
        const vend = item.vendor || 'Unknown';
        vendorSummary[vend] = (vendorSummary[vend] || 0) + total;

        // Group by month (YYYY-MM)
        if (item.date) {
          const month = item.date.slice(0,7); // first 7 chars "YYYY-MM"
          monthlySummary[month] = (monthlySummary[month] || 0) + total;
        }
      }
    }
  }

  // Draw charts using Chart.js
  function drawCharts() {
    // Destroy existing charts if they exist
    if (categoryChart) categoryChart.destroy();
    if (trendChart) trendChart.destroy();

    // Category breakdown chart (Doughnut chart)
    if (categoryChartCanvas) {
      const ctx = categoryChartCanvas.getContext('2d');
      if (ctx) {
        const labels = Object.keys(categorySummary);
        const values = Object.values(categorySummary);
        const backgroundColors = [
          '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722',
          '#3F51B5', '#E91E63', '#00BCD4', '#8BC34A', '#FF9800'
        ];

        categoryChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: values,
              backgroundColor: backgroundColors.slice(0, labels.length)
            }]
          },
          options: {
            plugins: {
              legend: { position: 'bottom' },
              title: {
                display: true,
                text: 'Expenses by Category',
                font: { size: 16 }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }

    // Monthly trend chart (Line chart)
    if (trendChartCanvas) {
      const ctx2 = trendChartCanvas.getContext('2d');
      if (ctx2) {
        const labels = Object.keys(monthlySummary).sort();
        const values = labels.map(m => monthlySummary[m]);

        trendChart = new Chart(ctx2, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: "Total Spend",
              data: values,
              fill: false,
              borderColor: '#4A90E2',
              tension: 0.1,
              borderWidth: 2,
              pointBackgroundColor: '#4A90E2'
            }]
          },
          options: {
            scales: {
              x: {
                title: { display: true, text: "Month" }
              },
              y: {
                title: { display: true, text: "Amount ($)" },
                beginAtZero: true
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Monthly Spending Trend',
                font: { size: 16 }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
  }

  // Format currency values
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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

      // Recompute summaries and redraw charts
      computeSummaries();
      drawCharts();

      // In a real app, you would also update the receipt in the database
      console.log('Receipt updated:', updatedReceipt);
    }

    // Close the modal
    closeExpenseModal();
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
          receipts: expenses
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

<div class="p-6 max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200">
  <div class="flex justify-between items-center mb-8">
    <h2 class="text-2xl md:text-3xl font-bold gradient-text">Expense Dashboard</h2>

    <button
      on:click={exportToGoogleSheets}
      class="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 flex items-center shadow-sm transition-all"
      disabled={exportLoading || expenses.length === 0}
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
    <div class="mb-6 p-4 bg-success-50 text-success-700 rounded-lg shadow-sm border border-success-200 flex justify-between items-center animate-fade-in">
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
          class="px-4 py-2 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 focus:outline-none focus:ring-2 focus:ring-success-300 transition-colors shadow-sm flex items-center"
        >
          <svg class="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Open Sheet
        </a>
      {/if}
    </div>
  {/if}

  {#if exportError}
    <div class="mb-6 p-4 bg-error-50 text-error-700 rounded-lg shadow-sm border border-error-200 animate-fade-in">
      <div class="flex items-center mb-1">
        <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="font-medium">Export failed</p>
      </div>
      <p class="text-sm ml-7">{exportError}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col justify-center items-center h-64 animate-fade-in">
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="h-8 w-8 rounded-full bg-white"></div>
        </div>
      </div>
      <p class="mt-4 text-neutral-600 font-medium">Loading your expenses...</p>
    </div>
  {:else if error}
    <div class="bg-error-50 text-error-700 p-6 rounded-lg mb-6 border border-error-200 shadow-sm animate-fade-in">
      <div class="flex items-center mb-2">
        <svg class="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="font-semibold text-lg">Error loading expenses</p>
      </div>
      <p class="ml-8">{error}</p>
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="glass-card p-6 rounded-xl shadow-md border border-neutral-200 bg-white/70 hover:shadow-lg transition-all">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-primary-600">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="text-sm text-neutral-600 font-medium">Total Expenses</div>
        </div>
        <div class="text-3xl font-bold text-neutral-800">{formatCurrency(totalExpense)}</div>
      </div>

      <div class="glass-card p-6 rounded-xl shadow-md border border-neutral-200 bg-white/70 hover:shadow-lg transition-all">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-success-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="text-sm text-neutral-600 font-medium">Receipts Logged</div>
        </div>
        <div class="text-3xl font-bold text-neutral-800">{expenses.length}</div>
      </div>

      <div class="glass-card p-6 rounded-xl shadow-md border border-neutral-200 bg-white/70 hover:shadow-lg transition-all">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-secondary-600">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="text-sm text-neutral-600 font-medium">Categories</div>
        </div>
        <div class="text-3xl font-bold text-neutral-800">{Object.keys(categorySummary).length}</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      <div class="glass-card p-6 rounded-xl shadow-md border border-neutral-200 bg-white/70">
        <h3 class="text-lg font-semibold mb-4 text-neutral-800">Expense Breakdown</h3>
        <div class="h-72">
          <canvas bind:this={categoryChartCanvas}></canvas>
        </div>
      </div>
      <div class="glass-card p-6 rounded-xl shadow-md border border-neutral-200 bg-white/70">
        <h3 class="text-lg font-semibold mb-4 text-neutral-800">Monthly Trend</h3>
        <div class="h-72">
          <canvas bind:this={trendChartCanvas}></canvas>
        </div>
      </div>
    </div>

    <!-- Top Vendors -->
    <div class="mb-10">
      <h3 class="text-lg font-semibold mb-4 text-neutral-800">Top Vendors</h3>
      <div class="glass-card rounded-xl shadow-md border border-neutral-200 bg-white/70 overflow-hidden">
        {#each Object.entries(vendorSummary).sort((a,b) => b[1]-a[1]).slice(0,5) as [vendor, amount], i}
          <div class="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-neutral-50 transition-colors">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center mr-3 text-primary-700 font-semibold">
                {i + 1}
              </div>
              <span class="font-medium text-neutral-800">{vendor}</span>
            </div>
            <span class="text-neutral-700 font-semibold">{formatCurrency(amount)}</span>
          </div>
        {/each}

        {#if Object.keys(vendorSummary).length === 0}
          <div class="p-4 text-center text-neutral-500">
            No vendor data available
          </div>
        {/if}
      </div>
    </div>

    <!-- Recent Expenses Table -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-neutral-800">Recent Expenses</h3>
        <a
          href="/expenses"
          class="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
        >
          View All Expenses
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      <div class="glass-card rounded-xl shadow-md border border-neutral-200 bg-white/70 overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-neutral-50/80 text-neutral-700">
            <tr>
              <th class="p-4 font-medium">Date</th>
              <th class="p-4 font-medium">Vendor</th>
              <th class="p-4 font-medium">Category</th>
              <th class="p-4 text-right font-medium">Amount</th>
              <th class="p-4 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each expenses.slice().reverse().slice(0,10) as exp, i}
              <tr
                class="border-b hover:bg-neutral-50/80 cursor-pointer transition-colors"
                on:click={() => openExpenseModal(exp)}
                style="animation-delay: {i * 50}ms"
                in:fly={{ y: 5, duration: 150, delay: i * 50 }}
              >
                <td class="p-4">{formatDate(exp.date)}</td>
                <td class="p-4 font-medium text-neutral-800">{exp.vendor || 'Unknown'}</td>
                <td class="p-4">
                  <span class="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {exp.category || 'Uncategorized'}
                  </span>
                </td>
                <td class="p-4 text-right font-medium">
                  {typeof exp.total === 'number'
                    ? formatCurrency(exp.total)
                    : formatCurrency(parseFloat(exp.total?.toString().replace(/[^0-9.-]+/g, '') || '0'))}
                </td>
                <td class="p-4 text-center">
                  <button
                    class="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors"
                    on:click|stopPropagation={() => openExpenseModal(exp)}
                  >
                    <span class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </span>
                  </button>
                </td>
              </tr>
            {/each}

            {#if expenses.length === 0}
              <tr>
                <td colspan="5" class="p-6 text-center text-neutral-500">
                  <div class="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-neutral-300 mb-2">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <p>No expenses recorded yet</p>
                    <a href="/scan" class="mt-2 text-primary-600 hover:text-primary-800 text-sm">Scan a receipt to get started</a>
                  </div>
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
