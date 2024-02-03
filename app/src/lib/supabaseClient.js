import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
	'https://zvjgieepmmrabawbajsr.supabase.co',
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2amdpZWVwbW1yYWJhd2JhanNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYzMjEzMDUsImV4cCI6MjAyMTg5NzMwNX0.H4Id2idkg_hgu2RPJd_YSHEyWtGzyMzdHb4VjFGeQL0'
);
