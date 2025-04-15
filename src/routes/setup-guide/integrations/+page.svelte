<script lang="ts">
  // Setup guide for integrations
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Atlas Integration Setup Guide</h1>
  
  <div class="grid grid-cols-1 gap-6">
    <!-- Notion Integration -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold mb-4">Setting Up Notion Integration</h2>
      
      <div class="prose max-w-none">
        <p>Follow these steps to set up the Notion integration for Atlas:</p>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 1: Create a Notion Integration</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">Notion Integrations</a> page.</li>
          <li>Click "New integration".</li>
          <li>Give your integration a name (e.g., "Atlas Assistant").</li>
          <li>Select the workspace you want to connect to Atlas.</li>
          <li>Upload an icon (optional).</li>
          <li>Under "Capabilities", select the following:
            <ul class="list-disc pl-6 mt-1">
              <li>Read content</li>
              <li>Update content</li>
              <li>Insert content</li>
            </ul>
          </li>
          <li>Click "Submit" to create your integration.</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 2: Get Your API Key</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>After creating your integration, you'll see your "Internal Integration Token".</li>
          <li>Copy this token.</li>
          <li>Add it to your Atlas settings in the .env file as <code>NOTION_API_KEY</code>.</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 3: Share Pages with Your Integration</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to the Notion page or database you want to connect to Atlas.</li>
          <li>Click the "..." menu in the top-right corner.</li>
          <li>Select "Add connections".</li>
          <li>Find your integration in the list and click it to add.</li>
          <li>Repeat for any other pages or databases you want to connect.</li>
        </ol>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                Note: You must share each page or database you want Atlas to access with your integration. Atlas can only access content that has been explicitly shared with it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Gmail Integration -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold mb-4">Setting Up Gmail Integration</h2>
      
      <div class="prose max-w-none">
        <p>Follow these steps to set up the Gmail integration for Atlas:</p>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 1: Create a Google Cloud Project</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">Google Cloud Console</a>.</li>
          <li>Click "Create Project".</li>
          <li>Enter a project name (e.g., "Atlas Assistant") and click "Create".</li>
          <li>Make sure your new project is selected in the top dropdown.</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 2: Enable the Gmail API</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>In the Google Cloud Console, go to "APIs & Services" > "Library".</li>
          <li>Search for "Gmail API" and click on it.</li>
          <li>Click "Enable" to enable the Gmail API for your project.</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 3: Configure OAuth Consent Screen</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to "APIs & Services" > "OAuth consent screen".</li>
          <li>Select "External" as the user type and click "Create".</li>
          <li>Fill in the required information:
            <ul class="list-disc pl-6 mt-1">
              <li>App name: "Atlas Assistant"</li>
              <li>User support email: Your email</li>
              <li>Developer contact information: Your email</li>
            </ul>
          </li>
          <li>Click "Save and Continue".</li>
          <li>On the "Scopes" page, click "Add or Remove Scopes" and add the following scopes:
            <ul class="list-disc pl-6 mt-1">
              <li>https://www.googleapis.com/auth/gmail.readonly</li>
              <li>https://www.googleapis.com/auth/gmail.send</li>
              <li>https://www.googleapis.com/auth/gmail.compose</li>
              <li>https://www.googleapis.com/auth/gmail.modify</li>
            </ul>
          </li>
          <li>Click "Save and Continue".</li>
          <li>Add your email as a test user and click "Save and Continue".</li>
          <li>Review your settings and click "Back to Dashboard".</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 4: Create OAuth Credentials</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to "APIs & Services" > "Credentials".</li>
          <li>Click "Create Credentials" and select "OAuth client ID".</li>
          <li>Select "Web application" as the application type.</li>
          <li>Give your client a name (e.g., "Atlas Assistant Web Client").</li>
          <li>Add the following Authorized redirect URI: <code>http://localhost:5174/api/auth/google/callback</code></li>
          <li>Click "Create".</li>
          <li>You'll see your Client ID and Client Secret. Copy these values.</li>
          <li>Add them to your Atlas settings in the .env file as <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>.</li>
        </ol>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                Note: For production use, you would need to verify your app with Google, which involves a review process. For personal use, you can use the app in "testing" mode with up to 100 users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- GitHub Integration -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold mb-4">Setting Up GitHub Integration</h2>
      
      <div class="prose max-w-none">
        <p>Follow these steps to set up the GitHub integration for Atlas:</p>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 1: Create a GitHub OAuth App</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Go to your <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">GitHub Developer Settings</a>.</li>
          <li>Click "New OAuth App".</li>
          <li>Fill in the required information:
            <ul class="list-disc pl-6 mt-1">
              <li>Application name: "Atlas Assistant"</li>
              <li>Homepage URL: <code>http://localhost:5174</code></li>
              <li>Application description: "Personal AI assistant with GitHub integration"</li>
              <li>Authorization callback URL: <code>http://localhost:5174/api/auth/github/callback</code></li>
            </ul>
          </li>
          <li>Click "Register application".</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 2: Get Your Client ID and Secret</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>After creating your OAuth app, you'll see your Client ID.</li>
          <li>Click "Generate a new client secret".</li>
          <li>Copy both the Client ID and Client Secret.</li>
          <li>Add them to your Atlas settings in the .env file as <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code>.</li>
        </ol>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Step 3: Configure Repository Access</h3>
        <ol class="list-decimal pl-6 space-y-2">
          <li>When you connect Atlas to GitHub, you'll be asked to authorize access to your repositories.</li>
          <li>You can choose to grant access to all repositories or only select repositories.</li>
          <li>For the best experience with Atlas, it's recommended to grant access to all repositories you want to use with the assistant.</li>
        </ol>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                Note: Be careful when granting access to private repositories. Atlas will be able to read the code in these repositories to provide context for your questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- iCloud Integration -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold mb-4">Setting Up iCloud Integration</h2>
      
      <div class="prose max-w-none">
        <p>The iCloud integration for Atlas is currently in a limited state due to Apple's restrictions on third-party access to iCloud services.</p>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                Important: Apple does not provide an official API for third-party applications to access iCloud services. The current implementation in Atlas is a placeholder that simulates iCloud functionality.
              </p>
            </div>
          </div>
        </div>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Current Limitations</h3>
        <ul class="list-disc pl-6 space-y-2">
          <li>No official API access to iCloud Drive files</li>
          <li>No official API access to iCloud Mail</li>
          <li>Limited access to other iCloud services</li>
        </ul>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Potential Future Approaches</h3>
        <p>In the future, we might explore the following approaches to improve iCloud integration:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Using Apple's CloudKit JS for limited web-based access</li>
          <li>Creating a companion macOS app that can access iCloud data locally</li>
          <li>Monitoring for any changes in Apple's API policies</li>
        </ul>
        
        <h3 class="text-xl font-medium mt-6 mb-3">Alternative Solutions</h3>
        <p>In the meantime, consider these alternatives for similar functionality:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Use Gmail instead of iCloud Mail</li>
          <li>Use Google Drive or Dropbox instead of iCloud Drive</li>
          <li>Use Apple's Shortcuts app to automate tasks on your Apple devices</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="flex justify-between mt-6">
    <a href="/setup-guide" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
      Back to Setup Guide
    </a>
    <a href="/settings" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
      Go to Settings
    </a>
  </div>
</div>
