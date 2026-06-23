import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function getSupabaseClient() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend .env.');
    }
    return supabase;
}

export function getClinicLogoBucketName() {
    return import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'clinic-logos';
}

export function getClinicLogoFolderName() {
    return import.meta.env.VITE_SUPABASE_CLINIC_LOGO_FOLDER || 'doctor-clinics';
}
