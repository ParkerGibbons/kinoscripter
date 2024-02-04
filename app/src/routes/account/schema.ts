import { z } from 'zod';

export const formSchema = z.object({
	username: z.string().min(3).max(20),
	fullName: z.string().min(3).max(20),
	website: z.string().url().optional()
});

export type FormSchema = typeof formSchema;
