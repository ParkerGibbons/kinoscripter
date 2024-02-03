<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { FileText } from 'radix-icons-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import Separator from './ui/separator/separator.svelte';

	let className: string | undefined | null = undefined;
	export let scripts: { name: string; href: string }[] = [
		{ name: 'Script 001', href: '/script/001' },
		{ name: 'Script 002', href: '/script/002' },
		{ name: 'Script 003', href: '/script/003' }
	];
	export { className as class };

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<nav class={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}>
	{#each scripts as script}
		{@const isActive = $page.url.pathname === script.href}

		<Button
			href={script.href}
			variant="ghost"
			class="flex justify-start w-full text-left"
			data-svleltekit-noscroll
		>
			<FileText class="mr-2 h-4 w-4" />
			<div class="relative justify-start">
				{script.name}
			</div>
		</Button>
	{/each}
</nav>
