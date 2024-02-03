<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Sun, Moon, FileText } from 'radix-icons-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Menubar from '$lib/components/ui/menubar';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Avatar from '$lib/components/ui/avatar';
	import YourScripts from './YourScripts.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { setMode, resetMode } from 'mode-watcher';
	import { redirect } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import DropdownMenuSeparator from '../ui/dropdown-menu/dropdown-menu-separator.svelte';

	async function signOut() {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			goto('/login');
		} else {
			console.error('Sign out error', error.message);
		}
	}
</script>

<div class="flex h-fit w-full place-content-between p-1 bg-secondary-foreground/10 backdrop-blur-sm shadow-md">
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
					<Button variant="secondary">
						create new script
					</Button>
					<Separator class="my-4" />
					<YourScripts />
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>
		<Badge class="mx-2 h-6 place-self-center">kinoscripter</Badge>
	</div>
	<div class="mr-2 flex items-center gap-2 justify-self-end">
		<div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="icon">
						<Avatar.Root class="h-8 w-8">
							<Avatar.Fallback>PG</Avatar.Fallback>
						</Avatar.Root>
					</Button>
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
