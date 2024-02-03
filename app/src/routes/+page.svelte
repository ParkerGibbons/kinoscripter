<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';

	import Header from '$lib/components/header/Header.svelte';
	import YourScripts from '$lib/components/YourScripts.svelte';

	export let data;

	export let scripts: { name: string; href: string }[] = [
		{ name: 'Script 001', href: '/script/001' },
		{ name: 'Script 002', href: '/script/002' },
		{ name: 'Script 003', href: '/script/003' }
	];
</script>

<svelte:head>
	<title>kinoscripter home</title>
</svelte:head>

<div class="fixed w-full">
	<Header />
</div>
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
