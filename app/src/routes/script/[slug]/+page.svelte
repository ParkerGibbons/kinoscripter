<script lang="ts">
	import ScriptContent from '$lib/components/editor/ScriptContent.svelte';

	export async function load({ params }) {
		const postData = getPost(params.slug);
		return { postData };
	}

	// mock data
	export let scriptTitle = 'We Make Movies Better';
	export let scriptDescription =
		'We come to this place for magic. We come to AMC Theaters to laugh, to cry, to care, to escape. And we come to AMC Theaters to be inspired.';
</script>

<ScriptContent {scriptTitle} {scriptDescription} />
