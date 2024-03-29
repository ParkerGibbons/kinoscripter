// src/routes/login/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { formSchema } from './schema';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(formSchema)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, formSchema);
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		return {
			form
		};
	}
};
