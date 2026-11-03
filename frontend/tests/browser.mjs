// No live credentials or database writes: all Supabase HTTP traffic is mocked.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}) })
const errors=[]
async function contextFor(role, withEvent=false) {
  const context=await browser.newContext()
  const page=await context.newPage()
  page.on('pageerror',error=>errors.push(error.message))
  const uid='11111111-1111-4111-8111-111111111111'
  const user={id:uid,aud:'authenticated',role:'authenticated',email:'test@plm.edu.ph',app_metadata:{},user_metadata:{role:'Admin'},created_at:new Date().toISOString()}
  const profile={auth_user_id:uid,user_id:role==='Student'?'TEST-STUDENT':role==='Admin'?'TEST-ADMIN':'TEST-ORG',plm_email:user.email,role}
  const requests=[]
  const detail={event_id:'TEST-EVENT',event_name:'Program event',event_type:'Keynote',organization_name:'Test organization',event_description:'Safe event description',eligible_college:'CISTM',eligibility_mode:'Program-Specific',allowed_programs:['BSCS'],starts_at:'2099-01-01T08:00:00Z',ends_at:'2099-01-01T10:00:00Z',published_at:'2026-11-01T08:00:00Z',publication_status:'Published',event_status:'Upcoming',registration_status:'Open',registration_capacity:10,confirmed_registrations:2,waitlisted_registrations:1,venue_name:'Test venue',building:'Test building',floor_number:'2',room_number:'201',modality:'On-Site',can_register:true,can_cancel:false}

  await page.route('https://*.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url())
    if(request.method()==='OPTIONS') return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}})
    const headers={'content-type':'application/json','access-control-allow-origin':'*'}
    if(url.pathname==='/auth/v1/token') {
      const jwtPart=value=>Buffer.from(JSON.stringify(value)).toString('base64url')
      const token=`${jwtPart({alg:'HS256',typ:'JWT'})}.${jwtPart({sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.test`
      return route.fulfill({headers,body:JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user})})
    }
    if(url.pathname==='/auth/v1/user') return route.fulfill({headers,body:JSON.stringify(user)})
    if(url.pathname==='/auth/v1/logout') return route.fulfill({status:204,headers})
    requests.push({url:url.pathname,method:request.method(),body:request.postDataJSON()})
    if(url.pathname==='/rest/v1/users') return route.fulfill({headers,body:JSON.stringify([profile])})
    if(url.pathname.includes('/rpc/')) {
      let data=[]
      if(url.pathname.endsWith('get_student_event_details')) data=detail
      if(withEvent && /get_student_(dashboard_events|discover_events|registration_history)$/.test(url.pathname)) data=[detail]
      if(url.pathname.endsWith('register_event')) { detail.student_reg_id='REG';detail.student_reg_status='Waitlisted';detail.can_register=false;detail.can_cancel=true;data='REG' }
      if(url.pathname.endsWith('cancel_registration')) { detail.student_reg_status='Cancelled';detail.can_register=true;detail.can_cancel=false;data=null }
      if(url.pathname.endsWith('set_student_profile_image')) data=null
      return route.fulfill({headers,body:JSON.stringify(data)})
    }
    if(url.pathname==='/rest/v1/students') return route.fulfill({headers,body:JSON.stringify([{student_number:profile.user_id,name:'Test Student',year_level:'2',college:'CISTM',program:'BSCS',profile_image_path:null}])})
    if(request.method()!=='GET') return route.fulfill({headers,body:JSON.stringify([request.postDataJSON()])})
    return route.fulfill({headers,body:'[]'})
  })
  return {context,page,requests}
}
try {
  for(const [role,portal,route] of [['Student','student','student'],['Student Organization','student-organization','student-organization'],['Admin','admin','admin']]) {
    const {context,page}=await contextFor(role)
    await page.goto(`${base}/${route}/dashboard`)
    await page.waitForURL(`**/${portal}/login`)
    await page.getByLabel('PLM Email').fill('test@plm.edu.ph')
    await page.getByLabel('Password',{exact:true}).fill('mock-password')
    await page.getByRole('button',{name:'Sign In',exact:true}).click()
    await page.waitForURL(`**/${route}/dashboard`)
    if(role==='Student') {
      await page.getByRole('heading',{name:'Events'}).waitFor()
      await page.getByText('No upcoming events yet').waitFor()
    } else {
      await page.getByRole('heading',{name:`${role} workspace`}).waitFor()
      await page.getByText('No records available for your account.').waitFor()
    }
    const wrong=role==='Admin'?'student':'admin'
    await page.goto(`${base}/${wrong}/dashboard`)
    await page.waitForURL(`**/${route}/dashboard`)
    if(role!=='Student') await page.getByRole('heading',{name:`${role} workspace`}).waitFor()
    if(role==='Student Organization') {
      await page.getByRole('button',{name:'Create',exact:true}).click()
      await page.getByRole('heading',{name:'Create event proposal'}).waitFor()
      assert.ok(await page.getByLabel('Event name').isVisible())
    }
    await page.setViewportSize({width:390,height:844})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth))
    if(role==='Student') {
      await page.getByRole('button',{name:'Open profile menu'}).click()
      await page.getByRole('menuitem',{name:'Sign Out'}).click()
    } else await page.getByRole('button',{name:'Sign out',exact:true}).click()
    await page.waitForURL(base+'/')
    await context.close()
    console.log(`PASS ${role}: anonymous redirect, login, wrong-role redirect, mobile layout and logout`)
  }
  { // Event details must use the authoritative RPC and server registration state.
    const {context,page,requests}=await contextFor('Student',true)
    await page.goto(base+'/student/login')
    await page.getByLabel('PLM Email').fill('test@plm.edu.ph')
    await page.getByLabel('Password',{exact:true}).fill('mock-password')
    await page.getByRole('button',{name:'Sign In',exact:true}).click()
    await page.waitForURL('**/student/dashboard')
    await page.getByRole('heading',{name:'Program event'}).waitFor()
    await page.goto(base+'/student/events/TEST-EVENT')
    await page.getByRole('heading',{name:'Program event'}).waitFor()
    await page.getByText('Test building',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Register With Student ID',exact:true}).click()
    await page.getByRole('heading',{name:'You’re on the waitlist'}).waitFor()
    await page.getByRole('button',{name:'OK',exact:true}).click()
    await page.getByRole('button',{name:'Cancel Registration',exact:true}).click()
    await page.getByRole('button',{name:'Yes',exact:true}).click()
    await page.getByRole('heading',{name:'Registration Cancelled',exact:true}).waitFor()
    assert.ok(requests.some(r=>r.url.endsWith('/get_student_event_details')))
    assert.ok(!requests.some(r=>r.url==='/rest/v1/event_proposal' || r.url==='/rest/v1/venue_booking'))
    await page.goto(base+'/student/profile/settings')
    await page.getByLabel('Current password',{exact:true}).fill('old-password')
    await page.getByLabel('New password',{exact:true}).fill('new-password')
    await page.getByLabel('Confirm new password',{exact:true}).fill('new-password')
    await page.getByRole('button',{name:'Save password'}).click()
    await page.getByText('Password updated.',{exact:false}).waitFor()
    await context.close()
  }
  const {context,page}=await contextFor('Student')
  await page.goto(base+'/admin/login')
  await page.getByLabel('PLM Email').fill('test@plm.edu.ph')
  await page.getByLabel('Password',{exact:true}).fill('mock-password')
  await page.getByRole('button',{name:'Sign In',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'different portal'}).waitFor()
  assert.ok(page.url().endsWith('/admin/login'))
  await context.close()
  assert.deepEqual(errors,[])
  console.log('PASS wrong login portal denied; user_metadata role ignored; no browser errors')
} finally { await browser.close() }
