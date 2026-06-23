import client from './client';
import {
  getClinicLogoBucketName,
  getClinicLogoFolderName,
  getSupabaseClient,
} from '../lib/supabaseClient';

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function normalizeFilename(name) {
  const base = String(name || 'clinic-logo')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);

  return base || 'clinic-logo';
}

export async function uploadClinicLogo(file) {
  if (!file) {
    throw new Error('No logo file selected for upload.');
  }

  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Only image files are allowed for clinic logo upload.');
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error('Clinic logo must be 5 MB or smaller.');
  }

  const supabase = getSupabaseClient();
  const bucket = getClinicLogoBucketName();
  const folder = getClinicLogoFolderName();
  const extension = String(file.name || '').split('.').pop()?.toLowerCase() || 'png';
  const cleanedName = normalizeFilename(file.name);
  const uniqueId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const objectPath = `${folder}/${uniqueId}-${cleanedName}.${extension}`;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, fileBytes, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload clinic logo.');
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = publicData?.publicUrl;

  if (!publicUrl) {
    throw new Error('Unable to resolve clinic logo URL after upload.');
  }

  return publicUrl;
}

export async function getDoctorClinics() {
  const response = await client.get('/clinics');
  return response.data;
}

export async function createClinic(payload) {
  const response = await client.post('/clinics', payload);
  return response.data;
}

export async function updateClinic(id, payload) {
  const response = await client.put(`/clinics/${id}`, payload);
  return response.data;
}

export async function deleteClinic(id) {
  const response = await client.delete(`/clinics/${id}`);
  return response.data;
}
