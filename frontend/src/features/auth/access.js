export const roleRoutes = Object.freeze({ Student: '/student/dashboard', 'Student Organization': '/student-organization/dashboard', Admin: '/admin/dashboard' })
export const portalRoles = Object.freeze({ student: 'Student', organization: 'Student Organization', administrator: 'Admin' })
export function routeForRole(role) { return Object.hasOwn(roleRoutes, role) ? roleRoutes[role] : null }
export function matchesPortal(role, portal) { return role === portalRoles[portal] }
export const profileColumns = 'user_id,plm_email,role,created_at,auth_user_id'
export async function readProfile(client, userId) {
  const { data, error } = await client.from('users').select(profileColumns).eq('auth_user_id', userId).maybeSingle()
  if (error) throw new Error('Unable to load account access. Please try again.')
  if (!data || !routeForRole(data.role)) throw new Error('Your account is not linked to an authorized PLM-SEAMS profile. Contact your administrator.')
  return data
}
