<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import { onMount } from 'svelte';
	let { children } = $props();

	// Load configuration from server
	onMount(async () => {
		try {
			const response = await fetch('/api/config');
			if (response.ok) {
				const config = await response.json();
				window.atlasConfig = config;
				console.log('Atlas configuration loaded');
			} else {
				console.error('Failed to load Atlas configuration');
			}
		} catch (error) {
			console.error('Error loading Atlas configuration:', error);
		}
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<Navigation />
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
