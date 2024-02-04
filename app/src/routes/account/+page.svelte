<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from "./$types";
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AccountForm from './account-form.svelte';

	export let data: PageData & { form?: any };

	let { session } = data;
	$: ({ session, supabase } = data);

	let loading = false;
	let fullName: string = session?.user.user_metadata.full_name;
	let username: string = session?.user.user_metadata.username;
	let website: string = session?.user.user_metadata.website;
	let email: string = session?.user.user_metadata.email;
	let avatarUrl: string = session?.user.user_metadata.avatar_url;

	const handleSubmit: SubmitFunction = () => {
		loading = true;
		return async () => {
			loading = false;
		};
	};

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	};
</script>

<div class="h-dvh grid w-full place-items-center">
	<Card.Root class="w-[400px] place-self-center">
		<Card.Header>
			<Card.Title>account</Card.Title>
			<Card.Description>manage your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2 rounded-md border p-2">
					<UserAvatar {avatarUrl} {fullName} />
					<div class="">
						<p class="font-semibold">{fullName}</p>
						<p class="text-sm text-gray-500">{email}</p>
					</div>
				</div>
				<Button variant="secondary">change profile image</Button>
			</div>

			<Separator class="my-4" />

			<AccountForm form={data.form} data={data} />

		</Card.Content>
	</Card.Root>
</div>
