import { test } from 'node:test'
import assert from 'node:assert/strict'
import { routeForRole, matchesPortal, readProfile, profileColumns } from '../src/features/auth/access.js'
for (const [role,portal,path] of [
  ['Student','student','/student/dashboard'],
  ['Student Organization','organization','/student-organization/dashboard'],
  ['Admin','administrator','/admin/dashboard'],
]) test(`${role} is routed only to its portal`, () => {
  assert.equal(routeForRole(role),path)
  assert.equal(matchesPortal(role,portal),true)
  for (const wrong of ['student','organization','administrator'].filter(p => p!==portal)) assert.equal(matchesPortal(role,wrong),false)
})
test('unknown and prototype roles are denied', () => {
  for (const role of [null,undefined,'Developer','student','__proto__','toString']) assert.equal(routeForRole(role),null)
})
function client(result) {
  return { from(table) {
    assert.equal(table,'users')
    return { select(columns) {
      assert.equal(columns,profileColumns); assert.ok(!columns.includes('password'))
      return { eq(column,value) {
        assert.equal(column,'auth_user_id'); assert.equal(value,'verified-auth-user')
        return { maybeSingle: async () => result }
      } }
    } }
  } }
}
test('loads role from linked database account', async () => {
  const profile = { user_id:'business-id',role:'Student' }
  assert.equal(await readProfile(client({data:profile,error:null}),'verified-auth-user'),profile)
})
test('unlinked accounts are denied', async () => {
  await assert.rejects(readProfile(client({data:null,error:null}),'verified-auth-user'),/not linked/)
})
test('unsupported database roles are denied', async () => {
  await assert.rejects(readProfile(client({data:{role:'Developer'},error:null}),'verified-auth-user'),/not linked/)
})
test('profile query failures do not grant access', async () => {
  await assert.rejects(readProfile(client({data:null,error:{message:'failure'}}),'verified-auth-user'),/Unable to load/)
})
