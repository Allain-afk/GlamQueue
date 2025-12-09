import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  profile_picture: string | null;
  role: 'client' | 'staff' | 'manager' | 'admin';
  created_at: string;
};

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,name,profile_picture,role,created_at')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(updates: { name?: string; profile_picture?: string | null }): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id,email,name,profile_picture,role,created_at')
    .single();
  
  if (error) throw error;
  return data as Profile;
}

export async function uploadProfilePicture(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB');
  }

  // Create a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `profile-pictures/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    
    // Provide more specific error messages
    if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
      throw new Error('Storage permissions not configured. Please contact administrator to set up storage policies.');
    } else if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('404')) {
      throw new Error('Storage bucket not found. Please create "avatars" bucket in Supabase Storage.');
    } else if (uploadError.message.includes('400') || uploadError.message.includes('Invalid')) {
      throw new Error('Invalid file or storage configuration. Please check file format and storage settings.');
    }
    
    throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createProfile(userId: string, email: string | null): Promise<Profile> {
  // First, check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id,email,name,profile_picture,role,created_at')
    .eq('id', userId)
    .single();

  // If profile exists, return it (ignore PGRST116 which means "not found")
  if (existingProfile && !checkError) {
    return existingProfile as Profile;
  }

  // If profile doesn't exist (or error is PGRST116 "not found"), create it
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      role: 'client', // Default role for new sign-ups
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    // If profile already exists (race condition), try to get it
    if (error.code === '23505') { // Unique violation
      const { data: profile } = await supabase
        .from('profiles')
        .select('id,email,name,profile_picture,role,created_at')
        .eq('id', userId)
        .single();
      if (profile) return profile as Profile;
    }
    throw error;
  }
  
  return data as Profile;
}


