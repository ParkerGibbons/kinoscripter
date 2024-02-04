import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

interface UserProfile {
    avatarUrl: string | null;
    fullName: string;
  }

// Initial empty state
export const userProfile: Writable<UserProfile> = writable({ avatarUrl: null, fullName: '' });

// Function to fetch and update the store
async function fetchUserProfile() {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (user) {
		const { data, error } = await supabase
			.from('profiles')
			.select('avatar_url, full_name')
			.eq('id', user.id)
			.single();

		if (error) {
			console.error('Error fetching profile:', error.message);
			return;
		}

		userProfile.set({ avatarUrl: data.avatar_url, fullName: data.full_name });
	}
}

// Fetch profile data when the store is imported
fetchUserProfile();

export default userProfile;
