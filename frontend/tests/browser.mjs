// No live credentials or database writes: all Supabase HTTP traffic is mocked.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}) })
const errors=[]
async function contextFor(role) {
  const context=await browser.newContext()
  const page=await context.newPage()
  page.on('pageerror',error=>errors.push(error.message))
  const uid='11111111-1111-4111-8111-111111111111'
  const user={id:uid,aud:'authenticated',role:'authenticated',email:'test@plm.edu.ph',app_metadata:{},user_metadata:{role:'Admin'},created_at:new Date().toISOString()}
  const profile={auth_user_id:uid,user_id:role==='Student'?'TEST-STUDENT':role==='Admin'?'TEST-ADMIN':'TEST-ORG',plm_email:user.email,role}
  const requests=[]
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
