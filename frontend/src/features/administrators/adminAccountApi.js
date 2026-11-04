export const ADMIN_PHOTO_BUCKET = 'admin-profile-images'

export async function validateAdminPhoto(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024 || file.size === 0) throw new Error('Choose a JPEG or PNG image no larger than 2 MB.')
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!(file.type === 'image/png' ? png : jpeg)) throw new Error('The file content does not match its image type.')
}

export async function replaceAdminPhoto(client, file, oldPath) {
  await validateAdminPhoto(file)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Please sign in again.')
  const path = `${user.id}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const bucket = client.storage.from(ADMIN_PHOTO_BUCKET)
  const uploaded = await bucket.upload(path, file, { upsert: false, contentType: file.type })
  if (uploaded.error) throw new Error(uploaded.error.message)
  const saved = await client.rpc('set_admin_profile_image', { path })
  if (saved.error) { await bucket.remove([path]); throw new Error(saved.error.message) }
  const cleanup = oldPath ? await bucket.remove([oldPath]) : null
  return { path, warning: cleanup?.error ? 'Photo saved. The previous image could not be removed; please contact support for cleanup.' : '' }
}

export async function adminPhotoUrl(client, path) {
  if (!path) return ''
  const { data, error } = await client.storage.from(ADMIN_PHOTO_BUCKET).createSignedUrl(path, 3600)
  return error ? '' : data?.signedUrl || ''
}
