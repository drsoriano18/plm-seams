// No live credentials or database writes: all Supabase HTTP traffic is mocked.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}) })
const errors=[]
async function contextFor(role, withEvent=false, eligible=true, notifications=[]) {
  const context=await browser.newContext()
  const page=await context.newPage()
  page.on('pageerror',error=>errors.push(error.message))
  const uid='11111111-1111-4111-8111-111111111111'
  const user={id:uid,aud:'authenticated',role:'authenticated',email:'test@plm.edu.ph',app_metadata:{},user_metadata:{role:'Admin'},created_at:new Date().toISOString()}
  const profile={auth_user_id:uid,user_id:role==='Student'?'TEST-STUDENT':role==='Admin'?'TEST-ADMIN':'TEST-ORG',plm_email:user.email,role}
  const requests=[]
  const detail={event_id:'TEST-EVENT',event_name:'Program event',event_type:'Keynote',organization_name:'Test organization',event_description:'Safe event description',eligible_college:'CISTM',eligibility_mode:'Program-Specific',allowed_programs:['BSCS'],starts_at:'2099-01-01T08:00:00Z',ends_at:'2099-01-01T10:00:00Z',published_at:'2026-11-01T08:00:00Z',publication_status:'Published',event_status:'Upcoming',registration_status:'Open',registration_capacity:10,confirmed_registrations:2,waitlisted_registrations:1,venue_name:'Test venue',building:'Test building',floor_number:'2',room_number:'201',modality:'On-Site',can_register:eligible,is_eligible:eligible,can_cancel:false}

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
    if(url.pathname==='/rest/v1/notifications') {
      if(request.method()==='PATCH') {
        for(const notification of notifications) if(url.searchParams.get('notification_id')===`eq.${notification.notification_id}`) Object.assign(notification,request.postDataJSON())
      }
      return route.fulfill({headers,body:JSON.stringify(notifications)})
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
      await page.getByRole('heading',{name:'Events',exact:true}).waitFor()
      await page.getByText('No upcoming events yet').waitFor()
    } else if(role==='Admin') {
      await page.getByRole('heading',{name:'Administrator Dashboard'}).waitFor()
      await page.getByText('No proposals need your review').waitFor()
    } else {
      await page.getByRole('heading',{name:`${role} workspace`}).waitFor()
      await page.getByText('No records available for your account.').waitFor()
    }
    const wrong=role==='Admin'?'student':'admin'
    await page.goto(`${base}/${wrong}/dashboard`)
    await page.waitForURL(`**/${route}/dashboard`)
    if(role==='Admin') await page.getByRole('heading',{name:'Administrator Dashboard'}).waitFor()
    else if(role!=='Student') await page.getByRole('heading',{name:`${role} workspace`}).waitFor()
    if(role==='Student Organization') {
      await page.getByRole('button',{name:'Create',exact:true}).click()
      await page.getByRole('heading',{name:'Create event proposal'}).waitFor()
      assert.ok(await page.getByLabel('Event name').isVisible())
    }
    await page.setViewportSize({width:390,height:844})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth))
    if(role==='Student' || role==='Admin') {
      await page.getByRole('button',{name:'Open profile menu'}).click()
      await page.getByRole('menuitem',{name:'Sign Out'}).click()
    } else await page.getByRole('button',{name:'Sign out',exact:true}).click()
    await page.waitForURL(role==='Student' ? base+'/student/login' : base+'/')
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
    const dialog=page.getByRole('dialog',{name:'Cancel Registration?',exact:true})
    await dialog.waitFor()
    assert.equal(await dialog.locator('.event-dialog-symbol img').evaluate(image=>image.complete && image.naturalWidth>0),true)
    assert.equal(await dialog.getByRole('button',{name:'Yes',exact:true}).evaluate(button=>getComputedStyle(button).backgroundColor),'rgb(156, 35, 35)')
    await dialog.getByLabel('Cancellation reason',{exact:true}).fill('Schedule conflict')
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
  { // Published events remain visible to students outside the allowed college/program.
    const {context,page,requests}=await contextFor('Student',true,false)
    await page.goto(base+'/student/login')
    await page.getByLabel('PLM Email').fill('test@plm.edu.ph')
    await page.getByLabel('Password',{exact:true}).fill('mock-password')
    await page.getByRole('button',{name:'Sign In',exact:true}).click()
    await page.waitForURL('**/student/dashboard')
    await page.goto(base+'/student/discover')
    await page.getByRole('heading',{name:'Program event',exact:true}).waitFor()
    await page.getByRole('combobox').selectOption('eligible')
    await page.getByText('No events match your search',{exact:true}).waitFor()
    await page.getByRole('combobox').selectOption('all')
    await page.getByRole('heading',{name:'Program event',exact:true}).click()
    await page.getByRole('button',{name:'Register With Student ID',exact:true}).click()
    const dialog=page.getByRole('dialog',{name:'Not Eligible to Register',exact:true})
    await dialog.waitFor()
    assert.ok(await dialog.getByText('Unfortunately, your college is not eligible for this event. Eligibility is subject to selected colleges.',{exact:true}).isVisible())
    assert.ok(!requests.some(r=>r.url.endsWith('/register_event')))
    await dialog.getByRole('button',{name:'OK',exact:true}).click()
    assert.equal(await page.getByRole('dialog').count(),0)
    await context.close()
    console.log('PASS ineligible student: discovery, eligibility filter, event details, and registration dialog without write')
  }
  { // Bell clicks must keep the panel open while crossing the gap and reading notifications.
    const notice={notification_id:'TEST-NOTICE',notification_type:'Registration Confirmed',message:'Your registration is confirmed.',created_at:'2026-11-04T06:54:00Z',read_at:null,event_id:'TEST-EVENT'}
    const {context,page,requests}=await contextFor('Student',true,true,[notice])
    await page.goto(base+'/student/login')
    await page.getByLabel('PLM Email').fill('test@plm.edu.ph')
    await page.getByLabel('Password',{exact:true}).fill('mock-password')
    await page.getByRole('button',{name:'Sign In',exact:true}).click()
    await page.waitForURL('**/student/dashboard')
    for(const path of ['dashboard','discover','profile','profile/settings','events/TEST-EVENT']) {
      await page.goto(`${base}/student/${path}`)
      const bell=page.getByRole('button',{name:/^Notifications/})
      await bell.waitFor()
      await bell.hover()
      assert.equal(await page.getByRole('dialog',{name:'Notifications',exact:true}).count(),0)
      await bell.click()
      const panel=page.getByRole('dialog',{name:'Notifications',exact:true})
      await panel.waitFor()
      const bounds=await bell.boundingBox()
      await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height+4)
      await panel.getByText('Your registration is confirmed.',{exact:true}).click()
      assert.ok(await panel.isVisible())
      const dismiss=panel.getByRole('button',{name:/Mark .* as read/})
      if(await dismiss.count()) {
        notice.read_at=null
        await dismiss.click()
        await page.waitForFunction(()=>document.querySelector('.student-notification.is-read'))
        assert.ok(await panel.isVisible())
      }
      await panel.getByRole('button',{name:'Close notifications',exact:true}).click()
      assert.equal(await panel.count(),0)
      await bell.click()
      await panel.waitFor()
      await bell.click()
      assert.equal(await panel.count(),0)
      await bell.click()
      await panel.waitFor()
      await page.locator('main').click({position:{x:5,y:200}})
      assert.equal(await panel.count(),0)
    }
    assert.ok(requests.some(r=>r.url==='/rest/v1/notifications'&&r.method==='PATCH'))
    await context.close()
    console.log('PASS notification bell: click toggle, pointer gap, content click, mark read, close and outside click across student pages')
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
