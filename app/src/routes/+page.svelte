<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import YourScripts from '$lib/components/YourScripts.svelte';
</script>

<svelte:head>
	<title>kinoscripter home</title>
</svelte:head>


<div class="h-dvh grid w-full place-items-center">
	<div class="card">
		<Card.Root class="w-[400px]">
			<Card.Header>
				<Card.Title>welcome to kinoscripter</Card.Title>
				<Card.Description
					>a tool for writing and viewing audiovisual scripts for video production</Card.Description
				>
			</Card.Header>
			<Card.Content class="flex flex-col gap-1">
				<YourScripts />
			</Card.Content>
		</Card.Root>
	</div>
</div>
