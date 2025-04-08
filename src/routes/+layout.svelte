<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<Navigation />
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
