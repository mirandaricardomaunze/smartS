import * as FileSystem from 'expo-file-system/legacy'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const TOKEN_KEY = '@smarts_google_access_token'
const REFRESH_TOKEN_KEY = '@smarts_google_refresh_token'
const FOLDER_ID_KEY = '@smarts_drive_folder_id'
const DRIVE_FOLDER_NAME = 'SmartS Backups'
const DRIVE_LIST_PAGE_SIZE = 50

export const googleTokenStore = {
  async saveTokens(accessToken: string, refreshToken?: string | null) {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
  },
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY)
  },
  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(FOLDER_ID_KEY),
    ])
  },
  async isConnected(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    return !!token
  },
}

async function driveRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await googleTokenStore.getAccessToken()
  if (!token) throw new Error('Google Drive: not authenticated')

  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    await googleTokenStore.clearTokens()
    throw new Error('Google Drive: session expired. Please reconnect.')
  }

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Google Drive API error ${res.status}: ${body}`)
  }

  return res
}

async function getOrCreateFolder(): Promise<string> {
  const cached = await AsyncStorage.getItem(FOLDER_ID_KEY)
  if (cached) return cached

  const query = encodeURIComponent(
    `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )
  const searchRes = await driveRequest(`${DRIVE_FILES_URL}?q=${query}&fields=files(id)`)
  const { files } = await searchRes.json()

  if (files?.length > 0) {
    await AsyncStorage.setItem(FOLDER_ID_KEY, files[0].id)
    return files[0].id
  }

  const createRes = await driveRequest(DRIVE_FILES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const folder = await createRes.json()
  await AsyncStorage.setItem(FOLDER_ID_KEY, folder.id)
  return folder.id
}

export const googleDriveService = {
  async uploadFile(localPath: string, fileName: string): Promise<string> {
    const folderId = await getOrCreateFolder()

    // Search first — avoids reading the file into memory if we hit a network error
    const query = encodeURIComponent(
      `name='${fileName}' and '${folderId}' in parents and trashed=false`
    )
    const searchRes = await driveRequest(`${DRIVE_FILES_URL}?q=${query}&fields=files(id)`)
    const { files: existing } = await searchRes.json()

    // Read file only after confirming upload is viable
    const base64 = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const metadata = JSON.stringify({
      name: fileName,
      mimeType: 'application/x-sqlite3',
      parents: existing?.length ? undefined : [folderId],
    })

    const boundary = 'smartsbackup_boundary'
    const body =
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}` +
      `\r\n--${boundary}\r\nContent-Type: application/x-sqlite3\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64}` +
      `\r\n--${boundary}--`

    const uploadUrl = existing?.length
      ? `${DRIVE_UPLOAD_URL}/${existing[0].id}?uploadType=multipart`
      : `${DRIVE_UPLOAD_URL}?uploadType=multipart`

    const res = await driveRequest(uploadUrl, {
      method: existing?.length ? 'PATCH' : 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    })
    const file = await res.json()
    return file.id
  },

  async downloadFile(driveFileId: string, destPath: string): Promise<void> {
    const token = await googleTokenStore.getAccessToken()
    if (!token) throw new Error('Google Drive: not authenticated')

    const result = await FileSystem.downloadAsync(
      `${DRIVE_FILES_URL}/${driveFileId}?alt=media`,
      destPath,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (result.status !== 200) throw new Error(`Drive download failed: ${result.status}`)
  },

  async listBackups(): Promise<{ id: string; name: string; modifiedTime: string }[]> {
    const folderId = await getOrCreateFolder()
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
    const res = await driveRequest(
      `${DRIVE_FILES_URL}?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=${DRIVE_LIST_PAGE_SIZE}`
    )
    const { files } = await res.json()
    return files ?? []
  },

  async deleteFile(driveFileId: string): Promise<void> {
    await driveRequest(`${DRIVE_FILES_URL}/${driveFileId}`, { method: 'DELETE' })
  },
}
