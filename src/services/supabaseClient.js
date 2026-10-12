import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasPlaceholder = [supabaseUrl, supabaseAnonKey]
  .some((value) => !value || /^(your|replace[-_ ]?me|<)/i.test(value.trim()));

const rememberPreferenceKey = 'studentos-remember-me';
const storagePrefix = supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token` : '';

function getStorage(rememberMe) {
  return rememberMe ? window.localStorage : window.sessionStorage;
}

export function getRememberMePreference() {
  return window.localStorage.getItem(rememberPreferenceKey) !== 'false';
}

export function setRememberMePreference(rememberMe) {
  const nextStorage = getStorage(rememberMe);
  const previousStorage = getStorage(!rememberMe);
  window.localStorage.setItem(rememberPreferenceKey, String(rememberMe));

  for (let index = 0; index < previousStorage.length; index += 1) {
    const key = previousStorage.key(index);
    if (key?.startsWith(storagePrefix)) {
      const value = previousStorage.getItem(key);
      if (value !== null) nextStorage.setItem(key, value);
      previousStorage.removeItem(key);
      index -= 1;
    }
  }
}

const authStorage = {
  getItem(key) {
    return getStorage(getRememberMePreference()).getItem(key);
  },
  setItem(key, value) {
    const targetStorage = getStorage(getRememberMePreference());
    const otherStorage = getStorage(!getRememberMePreference());
    targetStorage.setItem(key, value);
    otherStorage.removeItem(key);
  },
  removeItem(key) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const isSupabaseConfigured = !hasPlaceholder;
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storage: authStorage },
  })
  : null;

const studyNotesBucket = 'study-notes';

export async function uploadStudyNote(userId, file) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!userId) throw new Error('Log in to upload a note file.');

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${globalThis.crypto.randomUUID()}-${safeFileName}`;
  const { error } = await supabase.storage
    .from(studyNotesBucket)
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error(`Could not upload the note file: ${error.message}`);
  return storagePath;
}

export async function createStudyNoteDownloadUrl(storagePath) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.storage
    .from(studyNotesBucket)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw new Error(`Could not open the uploaded file: ${error.message}`);
  return data.signedUrl;
}

export async function removeStudyNoteFile(storagePath) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.storage.from(studyNotesBucket).remove([storagePath]);
  if (error) throw new Error(`Could not delete the uploaded file: ${error.message}`);
}
