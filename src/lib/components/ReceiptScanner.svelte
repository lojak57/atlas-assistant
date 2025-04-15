<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Receipt } from '$lib/types/receipt';

  // Props
  export let onReceiptProcessed: (receipt: Receipt) => void = () => {};

  // Component state
  let videoRef: HTMLVideoElement;
  let canvasRef: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let processing = false;
  let message: string | null = null;
  let cameraAvailable = false;

  // On mount, ask for camera access and stream video to the video element
  onMount(async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      if (videoRef) {
        videoRef.srcObject = stream;
        await videoRef.play();
        cameraAvailable = true;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      message = "⚠️ Cannot access camera. You can still upload an image.";
      cameraAvailable = false;
    }
  });

  // Clean up on component destruction
  onDestroy(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  });

  // Capture a photo from the video stream and send for processing
  async function capturePhoto() {
    if (!videoRef || !canvasRef) return;

    // Set canvas dimensions to video frame
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;

    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);
    }

    // Convert canvas to blob (image file)
    const blob: Blob | null = await new Promise(res => canvasRef.toBlob(res, 'image/jpeg'));
    if (!blob) {
      message = "Failed to capture image.";
      return;
    }

    // Create a File object from the blob
    const file = new File([blob], "receipt.jpg", { type: 'image/jpeg' });

    // Process the captured image
    await processImage(file);
  }

  // Handle file input (in case user uploads an image instead of using camera)
  async function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      await processImage(file);
    }
  }

  // Process the image (either captured or uploaded)
  async function processImage(file: File) {
    processing = true;
    message = "Extracting data from receipt...";

    try {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large. Please use an image under 10MB.');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc).');
      }

      // Create a FormData object to send the image file
      const formData = new FormData();
      formData.append('file', file);

      // Add a prompt to guide the AI
      const prompt = `Extract the following information from this receipt image:
- date: in YYYY-MM-DD format
- vendor: the store or business name
- total: the total amount as a number (without currency symbol)
- tax: the tax amount as a number (if available)
- category: categorize this purchase (e.g., Groceries, Dining, Transportation, Office, etc.)
- notes: any additional relevant information

Format your response as a valid JSON object with these fields. If a field is not found, use null or an empty string.`;
      formData.append('prompt', prompt);
      formData.append('outputFormat', 'json');

      console.log(`Uploading image: ${file.type}, size: ${file.size} bytes`);

      const response = await fetch('/api/receipt/parse', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Server error');
      }

      const result = await response.json();

      // Check if we got a valid receipt or an error with text
      if (result.error && result.text) {
        // We got text but not valid JSON
        console.log("OpenAI returned text but not valid JSON:", result.text);
        message = `✅ Receipt processed but with limited data. Please check the details.`;

        // Create a basic receipt from the text
        const receipt: Receipt = {
          date: new Date().toISOString().split('T')[0], // Today's date
          vendor: 'Unknown Vendor',
          total: 0,
          category: 'Uncategorized',
          notes: result.text.substring(0, 100) + '...' // First 100 chars of the text
        };

        // Call the callback with the basic receipt data
        onReceiptProcessed(receipt);
      } else {
        // We got a valid receipt
        const receipt = result as Receipt;

        // Handle the parsed result
        console.log("Parsed receipt data:", receipt);
        message = `✅ Receipt processed: ${receipt.vendor || 'Unknown'} - $${receipt.total || '0'}`;

        // Call the callback with the receipt data
        onReceiptProcessed(receipt);
      }
    } catch (error) {
      console.error(error);
      message = `❌ Error: ${error instanceof Error ? error.message : 'Failed to process receipt. Please try again.'}`;
    } finally {
      processing = false;
    }
  }
</script>

<div class="p-4 max-w-xl mx-auto bg-white rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-4 text-center text-blue-600">Receipt Scanner</h2>

  <!-- Camera stream video -->
  {#if cameraAvailable}
    <div class="camera-preview bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4">
      <video bind:this={videoRef} autoplay playsinline class="w-full h-auto">
        <track kind="captions" src="" label="English captions" />
      </video>
    </div>
  {:else}
    <div class="camera-preview bg-gray-100 rounded-lg p-6 mb-4 flex items-center justify-center">
      <p class="text-gray-600 text-center">{message || "Camera not available. Please upload an image."}</p>
    </div>
  {/if}

  <!-- Capture and Upload Controls -->
  <div class="mt-4 flex flex-col items-center">
    {#if cameraAvailable}
      <button
        on:click={capturePhoto}
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mb-3 w-full max-w-xs transition-colors"
        disabled={processing}
      >
        {processing ? 'Processing...' : '📷 Capture Receipt'}
      </button>
      <div class="text-gray-500 my-2">— or —</div>
    {/if}

    <label class="block w-full max-w-xs">
      <span class="sr-only">Choose file</span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        on:change={onFileSelected}
        class="block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-lg file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700
               hover:file:bg-blue-100
               disabled:opacity-50"
        disabled={processing}
      />
    </label>
  </div>

  <!-- Hidden canvas for capturing video frame -->
  <canvas bind:this={canvasRef} class="hidden"></canvas>

  <!-- Status / Result Message -->
  {#if message && message !== "⚠️ Cannot access camera. You can still upload an image."}
    <div class="mt-4 p-3 rounded-lg {message.startsWith('✅') ? 'bg-green-50 text-green-700' : message.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}">
      {message}
    </div>
  {/if}
</div>
