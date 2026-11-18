import { validatePhoto } from '../account/accountApi'
export const BANNER_BUCKET = 'event-banners'
export async function replaceEventBanner(client, eventId, file) {
  await validatePhoto(file)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Please sign in again.')
  const path = `${user.id}/${eventId}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const bucket = client.storage.from(BANNER_BUCKET)
  const uploaded = await bucket.upload(path, file, { upsert: false, contentType: file.type })
  if (uploaded.error) throw uploaded.error
  const saved = await client.rpc('set_event_banner', { eid: eventId, path })
  if (saved.error) { await bucket.remove([path]); throw saved.error }
  const cleanup = saved.data ? await bucket.remove([saved.data]) : null
  return { path, warning: cleanup?.error ? 'Banner saved. The previous image could not be removed; please contact support.' : '' }
}
