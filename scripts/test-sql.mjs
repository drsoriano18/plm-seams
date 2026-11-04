// PGlite runs real Postgres SQL/PLpgSQL/RLS. Supabase Auth and Storage schemas below are test doubles.
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import {readFile,readdir} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]$/,'')
export const db=new PGlite({ extensions: { btree_gist } })
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema extensions;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated; grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;`)
for(const f of (await readdir(root+'/supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) {
 try{await db.exec(await readFile(root+'/supabase/migrations/'+f,'utf8')); console.log('Migration OK',f)}catch(e){console.error('Migration FAILED',f,e.message);process.exit(1)}
}
let roleFixturesLoaded=false
for(const f of (process.argv.length>2 ? process.argv.slice(2) : ['portal_completion.sql','registration_notifications.sql','rbac.sql','proposal_notice.sql','proposal_review.sql'])) {
 if (['rbac.sql','proposal_review.sql'].includes(f) && !roleFixturesLoaded) {
   const fixture = await readFile(root+'/supabase/tests/portal_completion.sql','utf8')
   await db.exec(fixture.slice(0,fixture.indexOf('set constraints all immediate;'))+'set constraints all immediate; commit;')
   await db.exec(`insert into public.users(user_id,plm_email,role) values('TEST-SECOND-STUDENT','second@example.invalid','Student'); insert into public.students values('TEST-SECOND-STUDENT','Second','2','CISTM','BSCS',null);`)
   roleFixturesLoaded=true
 }
 try{const r=await db.exec(await readFile(root+'/supabase/tests/'+f,'utf8'));console.log('TEST OK',f,JSON.stringify(r.at(-1)))}catch(e){console.error('TEST FAILED',f,e.message,e.where);process.exit(1)}
}
await db.close()
