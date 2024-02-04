<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import type { FormOptions } from 'formsnap';
	import { formSchema, type FormSchema } from './schema';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from '../$types';
	let loading = false;

	import { supabase } from '$lib/supabaseClient';
	import { Schema } from 'zod';

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

	let fullName: string = session?.user.user_metadata.full_name;
	let username: string = session?.user.user_metadata.username;
	let website: string = session?.user.user_metadata.website;
	let email: string = session?.user.user_metadata.email;
	let avatarUrl: string = session?.user.user_metadata.avatar_url;

	async function handleSubmit() {
		loading = true;
		return async () => {
			loading = false;
		};
	}

	async function handleSignOut() {
		loading = true;
		return async ({ update }: { update: () => void }) => {
			loading = false;
			update();
		};
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
		<Form.Button disabled={loading} class="w-full">{loading ? 'Loading...' : 'Update'}</Form.Button>
	</div>
</Form.Root>
