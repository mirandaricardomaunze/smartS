import { supabase } from '@/services/supabase'
import * as FileSystem from 'expo-file-system'

export const storageService = {
  async uploadImage(bucket: string, path: string, fileUri: string): Promise<string> {
    // Check if the new File API is available (Expo File System v19+)
    // If not, fall back to the older method
    try {
      if ((FileSystem as any).File) {
        const file = new (FileSystem as any).File(fileUri)
        const arrayBuffer = await file.arrayBuffer()
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        return publicUrl
      } else {
        // Fallback for older versions if needed
        const base64 = await FileSystem.readAsStringAsync(fileUri, { 
          encoding: (FileSystem as any).EncodingType?.Base64 || 'base64'
        })
        const { decode } = require('base64-arraybuffer')
        const arrayBuffer = decode(base64)
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        return publicUrl
      }
    } catch (e) {
      console.error('Upload failed:', e)
      throw e
    }
  }
}
