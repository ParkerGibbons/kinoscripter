import { redirect } from '@sveltejs/kit';

export const POST = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (session) {
        await supabase.auth.signOut();
        throw redirect(303, '/login');
    }
};