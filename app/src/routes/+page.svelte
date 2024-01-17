<script>
	import Header from '$lib/components/header/Header.svelte';
	import EditorContent from '$lib/components/editor/EditorContent.svelte';
</script>

<div class="h-dvh">
	<div class="fixed w-full">
		<Header />
	</div>

	<div class="m-auto flex h-full w-full">
		<EditorContent />
	</div>
</div>
