import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { appendReceipt } from '$lib/services/googleSheets';
import type { Receipt } from '$lib/types/receipt';
// Create a local store for recently scanned receipts
let recentlyScannedReceipts: Receipt[] = [];

// Function to add a receipt to the in-memory store
function addScannedReceipt(receipt: Receipt) {
  // Add a timestamp to sort by most recent
  const receiptWithTimestamp = {
    ...receipt,
    scannedAt: new Date().toISOString()
  };

  recentlyScannedReceipts = [receiptWithTimestamp, ...recentlyScannedReceipts];

  // Keep only the last 10 receipts to avoid memory issues
  if (recentlyScannedReceipts.length > 10) {
    recentlyScannedReceipts = recentlyScannedReceipts.slice(0, 10);
  }
}

// Initialize OpenAI client (server-side only)
// Use a dummy API key during build time to prevent errors
const isDevelopment = process.env.NODE_ENV === 'development';
const dummyApiKey = 'dummy-api-key-for-build-time';

// Only create the OpenAI client if we're not in a build environment
let openai: OpenAI;

// This is a function to get or create the OpenAI client
function getOpenAIClient() {
  // If we already have an instance, return it
  if (openai) return openai;

  // Otherwise create a new instance
  try {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || dummyApiKey
    });
    return openai;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    // Return a mock client for build time
    return {
      chat: { completions: { create: async () => ({ choices: [{ message: { content: 'Build time response' } }] }) } },
    } as unknown as OpenAI;
  }
}

// Log API key status for debugging
console.log('OpenAI API Key status:', env.OPENAI_API_KEY ? 'Key is set' : 'Key is missing');

// Define the fields we expect (could also be dynamic per client config)
const RECEIPT_FIELDS = ['date', 'vendor', 'total', 'tax', 'category', 'notes'];

export const POST: RequestHandler = async ({ request }) => {
  try {
    // 1. Get the uploaded image file from the request
    const formData = await request.formData();
    const file = formData.get('file');
    const promptOverride = formData.get('prompt');
    const outputFormat = formData.get('outputFormat') || 'json';

    if (!file || !(file instanceof Blob)) {
      return new Response('No image file provided', { status: 400 });
    }

    // For debugging purposes, we can use mock data if needed
    const useMockData = false; // Set to true to use mock data instead of OpenAI API

    if (useMockData) {
      console.log('Using mock receipt data for testing');
      const mockReceipt = {
        date: '2023-11-15',
        vendor: 'Grocery Store',
        total: 42.99,
        tax: 3.87,
        category: 'Groceries',
        notes: 'Weekly shopping'
      };

      // Save to Google Sheets if configured
      if (outputFormat === 'json' && env.GOOGLE_SHEETS_ID) {
        try {
          await appendReceipt(mockReceipt);
        } catch (sheetErr) {
          console.error("Google Sheets API error:", sheetErr);
          // We won't treat this as fatal for the client; just log it.
        }
      }

      // Add the mock receipt to our in-memory store for the dashboard
      addScannedReceipt(mockReceipt);
      console.log('Added mock receipt to in-memory store');

      return json(mockReceipt);
    }

    // Convert Blob to base64 string
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';  // use file type if available, else default
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log(`Processing image: ${mimeType}, size: ${buffer.length} bytes`);

    // 2. Prepare OpenAI API request with the image and prompt
    const promptText = promptOverride ?
      String(promptOverride) :
      `You are a receipt scanning assistant. Extract the following information from this receipt image:

- date: in YYYY-MM-DD format
- vendor: the store or business name
- total: the total amount as a number (without currency symbol)
- tax: the tax amount as a number (if available)
- category: categorize this purchase (e.g., Groceries, Dining, Transportation, Office, etc.)
- notes: any additional relevant information

Format your response as a valid JSON object with these fields. If a field is not found, use null or an empty string.
Example format: { "date": "2023-11-15", "vendor": "Grocery Store", "total": 42.99, "tax": 3.87, "category": "Groceries", "notes": "Weekly shopping" }

Only respond with the JSON object, nothing else.`;

    const messages = [
      {
        role: "user",
        content: [
          { "type": "text", "text": promptText },
          { "type": "image_url", "image_url": { "url": dataUrl } }
        ]
      }
    ];

    // 3. Call OpenAI Vision API
    console.log('Calling OpenAI Vision API with API key:', env.OPENAI_API_KEY ? 'Key is set' : 'Key is missing');
    let content;
    let data: Receipt;

    try {
      // Set a timeout for the OpenAI API call to prevent function timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API call timed out')), 25000); // 25 second timeout
      });

      // Make the actual API call
      const apiCallPromise = getOpenAIClient().chat.completions.create({
        model: "gpt-4o",  // using GPT-4o which has vision capabilities
        messages,
        temperature: 0,  // deterministic output
        max_tokens: 500,  // reduced token limit for faster response
        timeout: 25  // 25 second timeout in seconds
      });

      // Race the timeout against the API call
      const completion = await Promise.race([apiCallPromise, timeoutPromise]) as any;

      content = completion.choices?.[0]?.message?.content;
      if (!content) {
        return new Response("No content in OpenAI response", { status: 500 });
      }

      console.log('OpenAI response:', content);

      // 4. Parse the response
      try {
        // First try direct parsing
        data = JSON.parse(content);
        console.log('Successfully parsed JSON directly');
      } catch (e) {
        console.log('Direct JSON parsing failed, trying to extract JSON substring');
        // If the assistant returned something that's not pure JSON, try to extract JSON substring
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            data = JSON.parse(match[0]);
            console.log('Successfully parsed JSON from extracted substring');
          } catch (parseError) {
            console.error('Failed to parse extracted JSON:', parseError);
            // If all parsing fails, create a simple object with the text content
            return new Response(JSON.stringify({
              text: content,
              error: 'Failed to parse as JSON'
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        } else {
          console.error("Failed to find JSON object in content:", content);
          // If we can't find a JSON object, return the raw text
          return new Response(JSON.stringify({
            text: content,
            error: 'No JSON object found in response'
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }

      // 5. Ensure all expected fields exist (even if null)
      for (const field of RECEIPT_FIELDS) {
        if (!(field in data)) {
          data[field] = null;
        }
      }

      // 6. Save to Google Sheets if we're not just testing
      if (outputFormat === 'json' && env.GOOGLE_SHEETS_ID) {
        try {
          await appendReceipt(data);
        } catch (sheetErr) {
          console.error("Google Sheets API error:", sheetErr);
          // We won't treat this as fatal for the client; just log it.
        }
      }

      // Add the receipt to our in-memory store for the dashboard
      addScannedReceipt(data);
      console.log('Added receipt to in-memory store:', data);

      // 7. Return the extracted data
      if (outputFormat === 'text') {
        return json({ text: content });
      } else {
        return json(data);
      }
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);

      // Check if it's a timeout error
      if (openaiError.message && openaiError.message.includes('timed out')) {
        return new Response('The image processing took too long. Please try with a smaller or clearer image.', {
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if it's an authentication error
      if (openaiError.status === 401 || (openaiError.message && openaiError.message.includes('API key'))) {
        return new Response(JSON.stringify({
          error: 'Authentication error with the AI service. Please check your API configuration.'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: `AI processing error: ${openaiError.message || 'Unknown error'}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    console.error("Server error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
