<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	export let avatarUrl: string | null;
	export let fullName: string;

	// function to derive initials from full name
	const getInitials = (name: string) => {
		if (!name) return '--'; // Return "--" if name is falsy
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	};
</script>

<Avatar.Root>
	{#if avatarUrl}
		<Avatar.Image src={avatarUrl} alt="User avatar" />
	{:else}
		<Avatar.Fallback>{getInitials(fullName)}</Avatar.Fallback>
	{/if}
</Avatar.Root>
