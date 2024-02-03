<script lang="ts">
	import Scene from '$lib/components/editor/Scene.svelte';

	export let scriptTitle: string = '';
	export let scriptDescription: string = '';
</script>

<div class="mx-auto max-w-4xl pt-20">
	<div class="flex flex-col gap-4">
		<h1 class="text-5xl font-thin">{scriptTitle}</h1>
		<p class="text-md">{scriptDescription}</p>
	</div>

	<Scene />
</div>
