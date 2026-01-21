/**
 * User Avatar System
 * Provides avatar management with upload, crop, and caching support
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface AvatarConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
  defaultSize: number;
  quality: number;
}

// ============================================
// Constants
// ============================================

export const AVATAR_CONFIG: AvatarConfig = {
  maxSizeBytes: 1024 * 1024, // 1MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  defaultSize: 256,
  quality: 0.85,
};

const AVATAR_BUCKET = 'avatars';

// ============================================
// Avatar URL Helpers
// ============================================

/**
 * Generates a deterministic avatar color based on a string (email/name)
 */
export function getAvatarColor(str: string): string {
  const colors = [
    '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#4ADE80',
    '#2DD4BF', '#22D3EE', '#38BDF8', '#818CF8', '#C084FC',
    '#E879F9', '#F472B6', '#FB7185',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Gets user initials from email or name
 */
export function getInitials(email?: string | null, name?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  if (email) {
    const localPart = email.split('@')[0];
    return localPart.substring(0, 2).toUpperCase();
  }

  return 'U';
}

/**
 * Generates a Gravatar URL for an email
 */
export async function getGravatarUrl(email: string, size = 256): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Use identicon as default
  return `https://www.gravatar.com/avatar/${hashHex}?s=${size}&d=identicon`;
}

/**
 * Generates a UI Avatars URL (text-based avatar)
 */
export function getUIAvatarUrl(name: string, size = 256, background?: string): string {
  const params = new URLSearchParams({
    name: name.substring(0, 2),
    size: size.toString(),
    background: background?.replace('#', '') || 'random',
    color: 'fff',
    bold: 'true',
    format: 'svg',
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/**
 * Generates a DiceBear avatar URL (fun avatars)
 */
export function getDiceBearUrl(seed: string, style: 'initials' | 'bottts' | 'avataaars' | 'micah' = 'initials', size = 256): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// ============================================
// Image Processing
// ============================================

/**
 * Resizes and compresses an image file
 */
export async function processAvatarImage(
  file: File,
  size = AVATAR_CONFIG.defaultSize,
  quality = AVATAR_CONFIG.quality
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate crop dimensions (square from center)
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      canvas.width = size;
      canvas.height = size;

      // Draw cropped and resized image
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates an image file
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!AVATAR_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${AVATAR_CONFIG.allowedTypes.join(', ')}`,
    };
  }

  if (file.size > AVATAR_CONFIG.maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${AVATAR_CONFIG.maxSizeBytes / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

// ============================================
// Supabase Storage Operations
// ============================================

/**
 * Uploads an avatar to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  // Validate file
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Process image (resize and compress)
    const processedBlob = await processAvatarImage(file);

    // Generate unique filename
    const ext = 'jpg';
    const filename = `${userId}/${Date.now()}.${ext}`;

    // Delete existing avatar first (optional, to clean up)
    const { data: existingFiles } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
    }

    // Upload new avatar
    const { data, error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, processedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(data.path);

    const avatarUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, url: avatarUrl };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Avatar upload failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Removes the user's avatar
 */
export async function removeAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // List and delete all files in user's avatar folder
    const { data: files } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId);

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${userId}/${f.name}`);
      await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Avatar removal failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Gets the user's current avatar URL
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.avatar_url;
}
