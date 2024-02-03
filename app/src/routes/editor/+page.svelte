<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import EditorContent from '$lib/components/editor/EditorContent.svelte';

	let scriptTitle = 'We Make Movies Better';
	let scriptDescription = 'We come to this place for magic. We come to AMC Theaters to laugh, to cry, to care, to escape. And we come to AMC Theaters to be inspired.';
</script>

<div class="h-full w-full">
	<div class="fixed w-full">
		<Header />
	</div>

	<div class="mx-auto max-w-4xl pt-20">
		<div class="flex flex-col gap-4">
			<h1 class="text-5xl font-thin">{scriptTitle}</h1>
			<p class="text-md">{scriptDescription}</p>
		</div>

		<div class="m-auto flex h-full w-full">
			<EditorContent />
		</div>
	</div>
</div>
