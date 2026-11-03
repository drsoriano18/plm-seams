export const PHOTO_BUCKET = 'student-profile-images'
export function passwordError(current, password, confirmation) {
  if (!current) return 'Enter your current password.'
  if (password.length < 8) return 'Use at least 8 characters for your new password.'
  if (password !== confirmation) return 'The new passwords do not match.'
  if (password === current) return 'Choose a different new password.'
  return ''
}
export async function changePassword(client, verificationClient, current, password, confirmation) {
  const invalid = passwordError(current, password, confirmation)
  if (invalid) throw new Error(invalid)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user?.email) throw new Error('Please sign in again before changing your password.')
  try {
    // Isolated client prevents a verification login from replacing the active app session.
    const verified = await verificationClient.auth.signInWithPassword({ email: user.email, password: current })
    if (verified.error || verified.data.user?.id !== user.id) throw new Error('Your current password could not be verified.')
    const updated = await client.auth.updateUser({ password, current_password: current })
    if (updated.error) throw new Error(updated.error.message)
  } finally { await verificationClient.auth.signOut({ scope: 'local' }) }
}
export async function validatePhoto(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024 || file.size === 0) throw new Error('Choose a JPEG or PNG image no larger than 2 MB.')
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const png = [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!(file.type === 'image/png' ? png : jpeg)) throw new Error('The file content does not match its image type.')
}
export async function replacePhoto(client, file, oldPath) {
  await validatePhoto(file)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Please sign in again.')
  const path = `${user.id}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const bucket = client.storage.from(PHOTO_BUCKET)
  const uploaded = await bucket.upload(path, file, { upsert: false, contentType: file.type })
  if (uploaded.error) throw new Error(uploaded.error.message)
  const saved = await client.rpc('set_student_profile_image', { path })
  if (saved.error) { await bucket.remove([path]); throw new Error(saved.error.message) }
  const cleanup = oldPath ? await bucket.remove([oldPath]) : null
  return { path, warning: cleanup?.error ? 'Photo saved. The previous image could not be removed; please contact support for cleanup.' : '' }
}
