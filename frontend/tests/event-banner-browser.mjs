// Banner upload/replacement/persistence and student display, using mocked Supabase HTTP.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const errors = []
let path = null
let uploads = 0
const deleted = []
let rejectSave = false
async function setup(role) {
 const context = await browser.newContext()
 const page = await context.newPage()
 page.on('pageerror', e => errors.push(e.message))
 const uid = '11111111-1111-4111-8111-111111111111'
 const user = { id: uid, email: 'mock@plm.edu.ph', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} }
 const profile = { user_id: role === 'Student' ? 'S-TEST' : 'ORG-TEST', auth_user_id: uid, role, plm_email: user.email }
 const event = {event_id:'EV-TEST',org_id:'ORG-TEST',starts_at:'2099-01-01T00:00:00Z',ends_at:'2099-01-01T02:00:00Z',event_status:'Upcoming',publication_status:'Published',registration_status:'Open',registration_capacity:30,post_caption:'Test banner event',event_proposal:{event_name:'Banner event'},student_organization:{org_name:'Test organization',acronym:'TEST'},event_type:{description:'Campus Event',modality:'Online'},venue_booking:[]}
 await page.route('https://*.supabase.co/**', async route => {
  const req=route.request(), url=new URL(req.url())
  const headers={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-range':'0-0/0'}
  const respond = (data,status=200) => route.fulfill({status,headers,body:JSON.stringify(data)})
  if(req.method()==='OPTIONS') return route.fulfill({status:204,headers})
  if(url.pathname==='/auth/v1/token') {
   const part = x => Buffer.from(JSON.stringify(x)).toString('base64url')
   return respond({access_token:`${part({alg:'HS256'})}.${part({sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.test`,refresh_token:'mock',expires_in:3600,token_type:'bearer',user})
  }
  if(url.pathname==='/auth/v1/user') return respond(user)
  if(url.pathname==='/rest/v1/users') return respond([profile])
  if(url.pathname==='/rest/v1/event') return respond(url.searchParams.get('select')==='banner_image_path' ? [{banner_image_path:path}] : [event])
  if(url.pathname==='/rest/v1/rpc/set_event_banner') {
   if(rejectSave) return respond({message:'Save rejected'},400)
   const old=path;path=req.postDataJSON().path;return respond(old)
  }
  if(url.pathname.includes('/storage/v1/object/sign/') && req.method()==='POST') return respond({signedURL:'/object/sign/event-banners/mock.png?token=mock'})
  if(url.pathname.includes('/storage/v1/object/sign/') && req.method()==='GET') return route.fulfill({contentType:'image/png',body:png})
  if(url.pathname==='/storage/v1/object/event-banners' && req.method()==='DELETE') {deleted.push(...req.postDataJSON().prefixes);return respond([])}
  if(url.pathname.includes('/storage/v1/object/event-banners/') && req.method()==='POST') { uploads++;return respond({Key:'mock'}) }
  if(url.pathname.includes('/rpc/get_student_')) return respond([{...event,event_name:'Banner event',event_type:'Campus Event',organization_name:'TEST',confirmed_registrations:0,eligibility_mode:'University-Wide',is_eligible:true}])
  return respond([])
 })
 await page.goto(base+(role==='Student'?'/student/login':'/student-organization/login'))
 await page.getByLabel('PLM Email',{exact:true}).fill(user.email)
 await page.getByLabel('Password',{exact:true}).fill('mock-password')
 await page.getByRole('button',{name:'Sign In',exact:true}).click()
 await page.waitForURL('**/dashboard')
 return {page,context}
}
try {
 const {page,context}=await setup('Student Organization')
 await page.goto(base+'/student-organization/events/EV-TEST')
 const camera=page.getByRole('button',{name:'Upload event banner'})
 await camera.waitFor()
 const box=await camera.boundingBox(); assert.equal(box.width,32);assert.equal(box.height,32)
 const upload=()=>page.locator('input[type=file]').setInputFiles({name:'banner.png',mimeType:'image/png',buffer:png})
 await upload(); await page.getByRole('status').filter({hasText:'Banner saved.'}).waitFor()
 const first=path;assert.ok(first)
 await page.reload();await camera.waitFor()
 await page.waitForFunction(()=>document.querySelector('.organization-event-poster')?.style.backgroundImage.includes('/storage/v1/object/sign/'))
 await upload();await page.getByRole('status').filter({hasText:'Banner saved.'}).waitFor()
 assert.notEqual(path,first);assert.ok(deleted.includes(first))
 const second=path;rejectSave=true
 await upload();await page.getByRole('status').filter({hasText:'Save rejected'}).waitFor()
 assert.equal(path,second);assert.equal(uploads,3);assert.equal(deleted.length,2)
 await page.screenshot({path:'/tmp/event-banner-organization.png',fullPage:true})
 await context.close()
 const student=await setup('Student')
 await student.page.goto(base+'/student/discover')
 await student.page.waitForFunction(()=>document.querySelector('.discover-event-image')?.style.backgroundImage.includes('/storage/v1/object/sign/'))
 assert.equal(await student.page.getByRole('button',{name:'Upload event banner'}).count(),0)
 assert.equal(await student.page.locator('input[type=file]').count(),0)
 await student.page.goto(base+'/student/dashboard')
 await student.page.waitForFunction(()=>document.querySelector('.student-event-image')?.style.backgroundImage.includes('/storage/v1/object/sign/'))
 await student.page.screenshot({path:'/tmp/event-banner-student.png',fullPage:true})
 await student.context.close()
 assert.deepEqual(errors,[])
 console.log('PASS: upload, replacement cleanup, refresh persistence, failed-save cleanup, 32px camera, student discover/dashboard display without controls')
} finally {await browser.close()}
