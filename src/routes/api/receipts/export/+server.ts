import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportToSheet, getGoogleSheetUrl } from '$lib/services/googleSheets';
import type { Receipt } from '$lib/types/receipt';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get receipts from request body
    const { receipts } = await request.json() as { receipts: Receipt[] };
    
    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return json({ error: 'No receipts provided' }, { status: 400 });
    }
    
    // Export receipts to Google Sheets
    const exportUrl = await exportToSheet(receipts);
    
    if (!exportUrl) {
      return json({ 
        error: 'Failed to export receipts to Google Sheets',
        sheetUrl: getGoogleSheetUrl() // Return the main sheet URL anyway
      }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      message: `Exported ${receipts.length} receipts to Google Sheets`,
      exportUrl,
      sheetUrl: getGoogleSheetUrl()
    });
  } catch (error) {
    console.error('Error exporting receipts:', error);
    return json({ error: 'Failed to export receipts' }, { status: 500 });
  }
};
