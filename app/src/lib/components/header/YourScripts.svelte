<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { FileText } from 'radix-icons-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	let className: string | undefined | null = undefined;
	export let scripts: { name: string; href: string }[] = [
		{ name: 'One Script', href: '' },
		{ name: 'Another Script', href: '' },
		{ name: 'Yet Another Script', href: '' }
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
			class={cn(!isActive && 'hover:underline', 'relative justify-start')}
			data-svleltekit-noscroll
		>
			{#if isActive}
				<div
					class="bg-muted absolute inset-0 rounded-md"
					in:send={{ key: 'active-sidebar-tab' }}
					out:receive={{ key: 'active-sidebar-tab' }}
				/>
			{/if}
            <FileText class="h-4 w-4 mr-2" />
			<div class="relative">
				{script.name}
			</div>
		</Button>
	{/each}
</nav>
