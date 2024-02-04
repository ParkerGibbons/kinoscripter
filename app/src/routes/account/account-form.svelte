<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import type { FormOptions } from 'formsnap';
	import { formSchema, type FormSchema } from './schema';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from '../$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	let loading = false;

	import { supabase } from '$lib/supabaseClient';
	export let form: SuperValidated<FormSchema>;
	export let data: PageData;

	const options: FormOptions<typeof formSchema> = {
		validators: formSchema,
		onSubmit: () => {
			handleSubmit();
		},
		onError: () => {
			console.error(Error);
		}
	};

	let { session } = data;
	$: ({ session } = data);

	let fullName: string = '';
	let username: string = '';
	let website: string = '';

	onMount(async () => {
		let { data: profiles, error } = await supabase.from('profiles').select('id');
		fullName = session?.user.user_metadata.full_name;
		username = session?.user.user_metadata.username;
		website = session?.user.user_metadata.website;
	});

	async function handleSubmit() {
		loading = true;
		return async () => {
			loading = false;
		};
	}

	async function handleSignOut() {
		loading = true;
		let { error } = await supabase.auth.signOut();
		loading = false;
		if (!error) {
			goto('/login');
		} else {
			console.error('Sign out error:', error.message);
			// Handle the error appropriately
		}
	}
</script>

<Form.Root {options} method="POST" {form} schema={formSchema} let:config>
	<div class="flex flex-col gap-4">
		<Form.Field {config} name="fullName">
			<Form.Item>
				<Form.Label>Full Name</Form.Label>
				<Form.Input type="text" bind:value={fullName} />
			</Form.Item>
		</Form.Field>
		<Form.Field name="username" {config}>
			<Form.Item>
				<Form.Label>Username</Form.Label>
				<Form.Input type="text" bind:value={username} />
			</Form.Item>
		</Form.Field>
		<Form.Field name="website" {config}>
			<Form.Item>
				<Form.Label>Website</Form.Label>
				<Form.Input type="url" bind:value={website} />
			</Form.Item>
		</Form.Field>
	</div>
	<div class="pt-4">
		<Form.Button disabled={loading} class="w-full">{loading ? 'Loading...' : 'update'}</Form.Button>
	</div>
</Form.Root>

<Button on:click={handleSignOut} class="mt-1 w-full" variant="ghost">sign out</Button>
