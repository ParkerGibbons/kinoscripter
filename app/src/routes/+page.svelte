<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';

	export let data;
</script>

<svelte:head>
	<title>kinoscripter home</title>
</svelte:head>

<div class="w-full h-dvh	 grid place-items-center">
	<div class="card">
		<Card.Root class="w-[400px]">
			<Card.Header>
				<Card.Title>welcome to kinoscripter</Card.Title>
				<Card.Description
					>a tool for writing and viewing audiovisual scripts for video production</Card.Description
				>
			</Card.Header>
			<Card.Content class="flex flex-col gap-1">
				<Button variant="ghost" size="sm" href="/editor">One Script</Button>
				<Button variant="ghost" size="sm" href="/editor">Two Script</Button>
				<Button variant="ghost" size="sm" href="/editor">Three Script</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>
