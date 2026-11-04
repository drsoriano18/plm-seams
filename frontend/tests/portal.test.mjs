import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventDetails, registrationState, canCancel } from '../src/features/dashboard/eventApi.js'
import { changePassword, passwordError, replacePhoto, validatePhoto } from '../src/features/account/accountApi.js'
const starts='2030-01-01T12:00:00Z', before=Date.parse(starts)-1
const event={starts_at:starts,event_status:'Upcoming',can_register:true,registration_capacity:1,confirmed_registrations:0}
test('registration stops at exact start and cancellation stops too',()=>{
 assert.equal(registrationState(event,before),'open')
 assert.equal(registrationState(event,Date.parse(starts)),'expired')
 assert.equal(canCancel({...event,can_cancel:true},Date.parse(starts)),false)
})
test('zero capacity waitlists and server closed events stay closed',()=>{
 assert.equal(registrationState({...event,registration_capacity:0},before),'waitlist-open')
 assert.equal(registrationState({...event,can_register:false},before),'closed')
 assert.equal(registrationState({...event,student_reg_status:'Waitlisted'},before),'waitlisted')
})
test('details distinguishes missing RPC and denied event without feed fallback',async()=>{
 await assert.rejects(eventDetails({rpc:async()=>({error:{code:'PGRST202'}})},'x'),/temporarily unavailable/)
 await assert.rejects(eventDetails({rpc:async()=>({data:null})},'x'),/does not have access/)
 assert.deepEqual(await eventDetails({rpc:async(name,args)=>{assert.equal(name,'get_student_event_details');assert.deepEqual(args,{eid:'x'});return {data:event}}},'x'),event)
})
test('password validation requires current, different password and confirmation',()=>{
 assert.match(passwordError('','longpassword','longpassword'),/current/)
 assert.match(passwordError('old','short','short'),/8 characters/)
 assert.match(passwordError('old','longpassword','no'),/match/)
 assert.equal(passwordError('old','longpassword','longpassword'),'')
})
for (const role of ['Student','Student Organization','Admin']) test(`${role} password updates use Auth only and discard verification session`,async()=>{
 const calls=[]
 const client={auth:{getUser:async()=>({data:{user:{id:'one',email:'test@example.invalid'}}}),updateUser:async values=>{calls.push(values);return {data:{}}}}}
 const verifier={auth:{signInWithPassword:async()=>({data:{user:{id:'one'}}}),signOut:async()=>{calls.push('discard');return {}}}}
 await changePassword(client,verifier,'old','new-password','new-password')
 assert.deepEqual(calls,[{password:'new-password',current_password:'old'},'discard'])
})
test('incorrect current password never updates Auth',async()=>{
 const client={auth:{getUser:async()=>({data:{user:{id:'one',email:'a'}}}),updateUser:async()=>assert.fail()}}
 const verifier={auth:{signInWithPassword:async()=>({error:{message:'invalid'}}),signOut:async()=>({})}}
 await assert.rejects(changePassword(client,verifier,'old','new-password','new-password'),/could not be verified/)
})
const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0])],{type:'image/png'})
test('photos enforce 2 MB, JPEG/PNG, and file signatures',async()=>{
 await validatePhoto(png)
 await assert.rejects(validatePhoto(new Blob(['fake'],{type:'image/png'})),/content/)
 await assert.rejects(validatePhoto(new Blob(['fake'],{type:'image/svg+xml'})),/JPEG/)
 await assert.rejects(validatePhoto(new Blob([new Uint8Array(2097153)],{type:'image/png'})),/2 MB/)
})
test('failed profile save removes only new upload, keeps old reference',async()=>{
 const deleted=[]
 const bucket={upload:async()=>({}),remove:async paths=>{deleted.push(...paths);return {}}}
 const client={auth:{getUser:async()=>({data:{user:{id:'uuid'}}})},storage:{from:()=>bucket},rpc:async()=>({error:{message:'denied'}})}
 await assert.rejects(replacePhoto(client,png,'uuid/old.png'),/denied/)
 assert.equal(deleted.length,1);assert.notEqual(deleted[0],'uuid/old.png');assert.match(deleted[0],/^uuid\//)
})
test('replacement deletes old object after saved profile reference',async()=>{
 const order=[]
 const client={auth:{getUser:async()=>({data:{user:{id:'uuid'}}})},storage:{from:()=>({upload:async()=>{order.push('upload');return {}},remove:async()=>{order.push('delete old');return {}}})},rpc:async()=>{order.push('save reference');return {}}}
 const result=await replacePhoto(client,png,'uuid/old.png')
 assert.deepEqual(order,['upload','save reference','delete old']);assert.match(result.path,/\.png$/)
})
test('ineligible students can attempt registration but closed and existing states take priority',()=>{
 const restricted={...event,registration_status:'Open',is_eligible:false,can_register:false}
 assert.equal(registrationState(restricted,before),'ineligible')
 assert.equal(registrationState({...restricted,registration_status:'Closed'},before),'closed')
 assert.equal(registrationState({...restricted,event_status:'Cancelled'},before),'cancelled-event')
 assert.equal(registrationState(restricted,Date.parse(starts)),'expired')
 assert.equal(registrationState({...restricted,student_reg_status:'Confirmed'},before),'confirmed')
})
