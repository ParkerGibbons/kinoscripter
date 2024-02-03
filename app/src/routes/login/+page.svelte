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
	<title>User Management</title>
</svelte:head>

<div class="grid h-full w-full grid-cols-1 grid-rows-1 place-content-center">
	<Tabs.Root value="login" class="mt-32 w-[400px] place-self-center">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="login">login</Tabs.Trigger>
			<Tabs.Trigger value="register">register</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="login">
			<Card.Root>
				<Card.Header>
					<Card.Title>login</Card.Title>
					<Card.Description>login to your account</Card.Description>
				</Card.Header>
				<Card.Content>
					<Auth
						supabaseClient={data.supabase}
						view="magic_link"
						redirectTo={`${data.url}/auth/callback`}
						showLinks={false}
						appearance={{ theme: ThemeSupa, style: { input: 'color: #fff' } }}
						providers={['google']}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="register">
			<Card.Root>
				<Card.Header>
					<Card.Title>register</Card.Title>
					<Card.Description>join usssssssss</Card.Description>
				</Card.Header>
				<Card.Content>
					<Auth
						supabaseClient={data.supabase}
						view="sign_up"
						redirectTo={`${data.url}/auth/callback`}
						showLinks={false}
						appearance={{ theme: ThemeSupa, style: { input: 'color: #fff' } }}
						providers={['google']}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
