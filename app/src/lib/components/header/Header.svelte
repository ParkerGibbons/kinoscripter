<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Sun, Moon, FileText } from 'radix-icons-svelte';
	import { badgeVariants } from '$lib/components/ui/badge';
	import * as Sheet from '$lib/components/ui/sheet';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { userProfile } from '$lib/stores/userProfileStore';
	import YourScripts from '$lib/components/YourScripts.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { setMode, resetMode } from 'mode-watcher';
	import { goto } from '$app/navigation';
	import DropdownMenuSeparator from '../ui/dropdown-menu/dropdown-menu-separator.svelte';
	import type { PageData } from '../../../routes/$types';

	import { supabase } from '$lib/supabaseClient';
	export let data: PageData;
	let { session } = data;
	$: ({ session } = data);

	let avatarUrl: string = session?.user.user_metadata.avatar_url;
	let fullName: string = session?.user.user_metadata.full_name;

	async function signOut() {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			goto('/login');
		} else {
			console.error('Sign out error', error.message);
		}
	}
</script>

<div
	class="bg-secondary-foreground/10 flex h-fit w-full place-content-between p-1 shadow-md backdrop-blur-sm"
>
	<div class="flex h-full self-center">
		<Sheet.Root>
			<Sheet.Trigger>
				<Button variant="outline" size="icon">
					<FileText class="h-4 w-4" />
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="left">
				<Sheet.Header>
					<Sheet.Title>your scripts</Sheet.Title>
					<Sheet.Description>pick a script! any script!</Sheet.Description>
					<div class="grid grid-cols-2 gap-2">
						<Button variant="outline" href="/editor" class="">text playground</Button>
						<Button variant="default">new script</Button>
					</div>
					<Separator class="my-4" />
					<YourScripts />
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>
		<a href="/" class="{badgeVariants()} mx-2 h-6 place-self-center">kinoscripter</a>
	</div>
	<div class="mr-2 flex items-center gap-2 justify-self-end">
		<div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<div class="flex w-fit">
						<Button builders={[builder]} variant="ghost" size="icon" class="w-12 h-12">
							<div class="w-10 h-10">
							<UserAvatar {avatarUrl} {fullName} />
						</div>
						</Button>
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item on:click={() => goto('/account')}>Account</DropdownMenu.Item>
					<DropdownMenuSeparator />
					<DropdownMenu.Item on:click={signOut}>Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="outline" size="icon">
					<Sun
						class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
						class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item on:click={() => setMode('light')}>Light</DropdownMenu.Item>
				<DropdownMenu.Item on:click={() => setMode('dark')}>Dark</DropdownMenu.Item>
				<DropdownMenu.Item on:click={() => resetMode()}>System</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
