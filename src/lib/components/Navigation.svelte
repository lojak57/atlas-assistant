<script lang="ts">
  import { getStores } from '$app/stores';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  const { page } = getStores();

  let currentPath = $page.url.pathname;
  let isOpen = false;
  let scrollY = 0;
  let prevScrollY = 0;
  let isScrollingUp = true;
  let isAtTop = true;

  // Update currentPath when page changes
  $: currentPath = $page.url.pathname;

  // Add scroll listener on mount
  onMount(() => {
    const handleScroll = () => {
      scrollY = window.scrollY;
      isScrollingUp = scrollY < prevScrollY;
      isAtTop = scrollY < 10;
      prevScrollY = scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function toggleMenu() {
    isOpen = !isOpen;
  }

  // Define types for navigation items
  type IconType = 'chat' | 'scan' | 'dashboard' | 'expenses' | 'settings' | 'guide';

  interface NavItem {
    path: string;
    label: string;
    icon: IconType;
  }

  // Navigation items
  const navItems: NavItem[] = [
    { path: '/', label: 'Chat', icon: 'chat' },
    { path: '/scan', label: 'Scan Receipt', icon: 'scan' },
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expenses', icon: 'expenses' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
    { path: '/setup-guide', label: 'Setup Guide', icon: 'guide' }
  ];

  // Icon components
  const icons: Record<IconType, string> = {
    chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    scan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M4 7V4a2 2 0 0 1 2-2h2"></path><path d="M4 17v3a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v3"></path><path d="M16 20h2a2 2 0 0 0 2-2v-3"></path><rect x="9" y="9" width="6" height="6"></rect></svg>`,
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
    expenses: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 1v22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    guide: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`
  };
</script>

<!-- Navigation bar with glass effect that shows on scroll up or at top -->
<nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md {isScrollingUp || isAtTop ? 'translate-y-0' : '-translate-y-full'} {!isAtTop ? 'shadow-lg bg-white/80' : 'bg-transparent'}">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between items-center">
      <!-- Logo and brand -->
      <div class="flex items-center">
        <a href="/" class="flex items-center">
          <div class="flex flex-shrink-0 items-center">
            <span class="text-2xl font-bold gradient-text">Atlas</span>
          </div>
        </a>
      </div>
      <!-- Desktop navigation -->
      <div class="hidden md:flex md:items-center md:space-x-6">
        {#each navItems as item}
          <a
            href={item.path}
            class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group"
            class:text-primary-700={currentPath === item.path}
            class:bg-primary-50={currentPath === item.path}
            class:text-neutral-600={currentPath !== item.path}
            class:hover:bg-neutral-100={currentPath !== item.path}
          >
            <span class="mr-2" aria-hidden="true">
              {@html icons[item.icon]}
            </span>
            <span>{item.label}</span>

            <!-- Active indicator dot -->
            {#if currentPath === item.path}
              <span class="ml-2 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
            {/if}
          </a>
        {/each}
      </div>

      <!-- Mobile menu button -->
      <div class="flex md:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
          on:click={toggleMenu}
        >
          <span class="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>

          <!-- Menu icon -->
          <svg
            class="w-6 h-6 transition-transform duration-300"
            class:rotate-90={isOpen}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {#if isOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isOpen}
    <div
      id="mobile-menu"
      class="md:hidden bg-white/95 backdrop-blur-md shadow-lg rounded-b-xl overflow-hidden animate-fade-in"
      transition:fly={{ y: -20, duration: 200 }}
    >
      <div class="space-y-1 px-4 py-3">
        {#each navItems as item}
          <a
            href={item.path}
            class="flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200"
            class:text-primary-700={currentPath === item.path}
            class:bg-primary-50={currentPath === item.path}
            class:text-neutral-600={currentPath !== item.path}
            class:hover:bg-neutral-100={currentPath !== item.path}
            on:click={() => (isOpen = false)}
          >
            <span class="mr-3" aria-hidden="true">
              {@html icons[item.icon]}
            </span>
            <span>{item.label}</span>

            <!-- Active indicator -->
            {#if currentPath === item.path}
              <span class="ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-primary-500">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            {/if}
          </a>
        {/each}
      </div>
    </div>
  {/if}
</nav>

<!-- Spacer to prevent content from being hidden under the fixed navbar -->
<div class="h-16"></div>
