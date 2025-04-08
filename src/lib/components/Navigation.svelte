<script lang="ts">
  import { getStores } from '$app/stores';

  const { page } = getStores();
  let currentPath = $derived($page.url.pathname);
</script>

<nav class="bg-white shadow-sm">
  <div class="container mx-auto px-4">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <span class="text-xl font-bold text-indigo-600">Atlas</span>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a
            href="/"
            class={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
              currentPath === '/'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Chat
          </a>
          <a
            href="/settings"
            class={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
              currentPath === '/settings'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Settings
          </a>

          <a
            href="/setup-guide"
            class={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
              currentPath === '/setup-guide'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Setup Guide
          </a>
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        <div class="ml-3 relative">
          <div>
            <button
              type="button"
              class="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span class="sr-only">Open user menu</span>
              <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="text-indigo-800 font-medium">A</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>
