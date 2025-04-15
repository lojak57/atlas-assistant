import { google } from 'googleapis';
import type { Receipt } from '$lib/types/receipt';
import { GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_ID } from '$env/static/private';

// Google Sheets API constants
const SHEET_NAME = 'Receipts';
const EXPORT_SHEET_NAME = 'Exported Receipts';

// Define the fields we expect in the sheet
const RECEIPT_FIELDS = ['date', 'vendor', 'total', 'tax', 'category', 'notes'];

// Setup Google Sheets client using service account credentials
const getAuthClient = () => {
  try {
    const credentials = GOOGLE_SERVICE_ACCOUNT_JSON ? JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) : undefined;
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  } catch (error) {
    console.error('Error parsing Google service account credentials:', error);
    throw new Error('Invalid Google service account credentials');
  }
};

// Get Google Sheets API client
const getSheetsClient = async () => {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
};

/**
 * Append a receipt to Google Sheets
 */
export const appendReceipt = async (receipt: Receipt): Promise<boolean> => {
  try {
    if (!GOOGLE_SHEETS_ID) {
      console.warn('No Google Sheet ID configured; skipping Sheets logging.');
      return false;
    }

    const sheetsApi = await getSheetsClient();

    // Prepare values in the order of RECEIPT_FIELDS
    const values = [RECEIPT_FIELDS.map(field => {
      if (field === 'notes' && !receipt[field]) {
        return ''; // Handle optional fields
      }
      return receipt[field] ?? '';
    })];

    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: SHEET_NAME, // Sheet name
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    return true;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    return false;
  }
};

/**
 * Get all receipts from Google Sheets
 */
export const getAllReceipts = async (): Promise<Receipt[]> => {
  try {
    if (!GOOGLE_SHEETS_ID) {
      console.warn('No Google Sheet ID configured; cannot fetch receipts.');
      return [];
    }

    const sheetsApi = await getSheetsClient();

    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: SHEET_NAME, // Sheet name
    });

    const rows = response.data.values || [];

    // Skip header row if it exists
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    // Map rows to Receipt objects
    return dataRows.map(row => {
      const receipt: Record<string, any> = {};

      // Map each column to the corresponding field
      RECEIPT_FIELDS.forEach((field, index) => {
        if (index < row.length) {
          // Convert numeric strings to numbers for total and tax
          if (field === 'total' || field === 'tax') {
            const value = row[index];
            receipt[field] = value ? parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) : null;
          } else {
            receipt[field] = row[index];
          }
        } else {
          receipt[field] = null;
        }
      });

      return receipt as Receipt;
    });
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return [];
  }
};

/**
 * Initialize the Google Sheet with headers if it doesn't exist
 */
export const initializeSheet = async (): Promise<boolean> => {
  try {
    if (!GOOGLE_SHEETS_ID) {
      console.warn('No Google Sheet ID configured; cannot initialize sheet.');
      return false;
    }

    const sheetsApi = await getSheetsClient();

    // Check if the sheet exists and has headers
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${SHEET_NAME}!A1:F1`,
    }).catch(() => null);

    // If no data or empty first row, add headers
    if (!response || !response.data.values || response.data.values.length === 0) {
      await sheetsApi.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [RECEIPT_FIELDS.map(field => field.charAt(0).toUpperCase() + field.slice(1))]
        }
      });
      console.log('Initialized Google Sheet with headers');
    }

    return true;
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    return false;
  }
};

/**
 * Export receipts to a new sheet in the Google Spreadsheet
 */
export const exportToSheet = async (receipts: Receipt[]): Promise<string> => {
  try {
    if (!GOOGLE_SHEETS_ID) {
      console.warn('No Google Sheet ID configured; cannot export receipts.');
      return '';
    }

    const sheetsApi = await getSheetsClient();

    // Create a timestamp for the export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportName = `${EXPORT_SHEET_NAME} ${timestamp}`;

    // First, create a new sheet
    const addSheetResponse = await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEETS_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: exportName
            }
          }
        }]
      }
    });

    // Get the new sheet ID
    const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

    if (!newSheetId) {
      throw new Error('Failed to create new sheet for export');
    }

    // Add headers to the new sheet
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: exportName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [RECEIPT_FIELDS.map(field => field.charAt(0).toUpperCase() + field.slice(1))]
      }
    });

    // Prepare receipt data for export
    const values = receipts.map(receipt =>
      RECEIPT_FIELDS.map(field => {
        if (field === 'notes' && !receipt[field]) {
          return ''; // Handle optional fields
        }
        return receipt[field] ?? '';
      })
    );

    // Add receipt data to the new sheet
    if (values.length > 0) {
      await sheetsApi.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: exportName,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }

    // Return the URL to the Google Sheet
    return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit#gid=${newSheetId}`;
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    return '';
  }
};

/**
 * Get the URL to the Google Sheet
 */
export const getGoogleSheetUrl = (): string => {
  if (!GOOGLE_SHEETS_ID) {
    return '';
  }

  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit`;
};