<script lang="ts">
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	import Header from '$lib/components/header/Header.svelte';

	export let data;

	let { supabase, session } = data;
	$: ({ supabase, session } = data);

	let userProfileFullName = writable('');
	let userAvatarUrl = writable('');

	interface Subscription {
		unsubscribe: () => void;
	}

	onMount(() => {
		let subscription: Subscription | null = null;
		subscription = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		}); // Directly assign the return value

		// Define an async function inside onMount
		const fetchUserProfile = async () => {
			const { data: profiles, error } = await supabase
				.from('profiles')
				.select('full_name, avatar_url') // Fetch both full_name and avatar_url
				.single(); // Assuming there's only one profile per user

			if (error) {
				console.error('Error fetching profile:', error);
			} else if (profiles) {
				userProfileFullName.set(profiles.full_name as string); // Set the fetched full name
				userAvatarUrl.set(profiles.avatar_url as string); // Set the fetched avatar URL
			}
		};

		// Call the async function
		fetchUserProfile();

		return () => subscription?.unsubscribe();
	});
</script>

<svelte:head>
	<title>kinoscripter</title>
</svelte:head>


<div class="fixed w-full">
<Header data={data} />
</div>

<ModeWatcher />
<div>
	<slot />
</div>
