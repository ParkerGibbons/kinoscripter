// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { Database } from './database.types'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>
			getSession: () => Promise<Session | null>
		}
		interface PageData {
			session: Session | null
		}
		// interface PageState {}
		// interface Platform {}
		// interface UserProfile {
		// 	avatarUrl: string | null
		// 	fullName: string | null
		// }
	}
}

export {};
