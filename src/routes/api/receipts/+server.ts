import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllReceipts, initializeSheet } from '$lib/services/googleSheets';
import type { Receipt } from '$lib/types/receipt';

// In a real app, we would use a database to store receipts
// For this demo, we'll use the mock data and add a timestamp to each receipt
// to simulate recently added receipts

export const GET: RequestHandler = async () => {
  try {
    // For testing purposes, return mock receipts if Google Sheets API is not working
    const useMockData = true; // Set to false to use real Google Sheets API

    if (useMockData) {
      console.log('Using mock receipt data for dashboard');
      const mockReceipts: Receipt[] = [
        {
          date: '2023-11-15',
          vendor: 'Grocery Store',
          total: 42.99,
          tax: 3.87,
          category: 'Groceries',
          notes: 'Weekly shopping'
        },
        {
          date: '2023-11-18',
          vendor: 'Restaurant XYZ',
          total: 78.50,
          tax: 7.06,
          category: 'Dining',
          notes: 'Business dinner'
        },
        {
          date: '2023-11-20',
          vendor: 'Gas Station',
          total: 45.75,
          tax: 4.12,
          category: 'Transportation',
          notes: 'Fuel for trip'
        },
        {
          date: '2023-11-22',
          vendor: 'Office Supplies Inc',
          total: 125.30,
          tax: 11.28,
          category: 'Office',
          notes: 'Printer ink and paper'
        },
        {
          date: '2023-11-25',
          vendor: 'Coffee Shop',
          total: 12.85,
          tax: 1.16,
          category: 'Dining',
          notes: 'Team coffee'
        },
        {
          date: '2023-12-01',
          vendor: 'Hardware Store',
          total: 87.45,
          tax: 7.87,
          category: 'Office',
          notes: 'Office repairs'
        },
        {
          date: '2023-12-05',
          vendor: 'Grocery Store',
          total: 53.67,
          tax: 4.83,
          category: 'Groceries',
          notes: 'Office snacks'
        }
      ];

      // Add timestamps to mock receipts to simulate different creation times
      const mockReceiptsWithTimestamps = mockReceipts.map((receipt, index) => {
        // Create dates from 1 to 7 days ago
        const daysAgo = index % 7 + 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        return {
          ...receipt,
          scannedAt: date.toISOString()
        };
      });

      // Get any recently scanned receipts from the receipt parser endpoint
      // In a real app, these would come from a database
      let recentlyScannedReceipts: Receipt[] = [];
      try {
        // Try to get receipts from the receipt parser endpoint
        // This is just a placeholder - in a real app we'd use a database
        // or a shared server-side store

        // For now, we'll just use the mock data
        recentlyScannedReceipts = [];
      } catch (error) {
        console.error('Error getting recently scanned receipts:', error);
      }

      return json(mockReceiptsWithTimestamps);
    }

    // Initialize the sheet if needed
    await initializeSheet();

    // Get all receipts from Google Sheets
    const receipts = await getAllReceipts();

    return json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
};
