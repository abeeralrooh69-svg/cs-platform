-- شغّل هذا الملف كاملاً في Supabase: SQL Editor > New query > Run
create table profiles(id uuid primary key references auth.users on delete cascade,email text,name text,phone text,approved boolean default false,is_admin boolean default false,created_at timestamptz default now());
create table categories(id uuid primary key default gen_random_uuid(),name text not null,icon text default 'folder',pos int default 0);
create table units(id uuid primary key default gen_random_uuid(),cat_id uuid references categories on delete cascade,title text not null,descr text default '',res jsonb default '{}',pos int default 0);
create table comments(id uuid primary key default gen_random_uuid(),unit_id uuid references units on delete cascade,user_id uuid references auth.users on delete cascade,name text,body text not null,created_at timestamptz default now());

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,email,name,phone) values(new.id,new.email,new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'phone'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function is_ok() returns boolean language sql security definer stable set search_path=public as $$ select coalesce((select approved or is_admin from profiles where id=auth.uid()),false) $$;

alter table profiles enable row level security;alter table categories enable row level security;alter table units enable row level security;alter table comments enable row level security;
create policy p_sel on profiles for select using(id=auth.uid() or is_admin());
create policy p_upd on profiles for update using(is_admin()) with check(is_admin());
create policy c_sel on categories for select using(is_ok());
create policy c_all on categories for all using(is_admin()) with check(is_admin());
create policy u_sel on units for select using(is_ok());
create policy u_all on units for all using(is_admin()) with check(is_admin());
create policy m_sel on comments for select using(is_ok());
create policy m_ins on comments for insert with check(is_ok() and user_id=auth.uid());
create policy m_del on comments for delete using(is_admin() or user_id=auth.uid());

-- بيانات تجريبية
with c as (insert into categories(name,icon,pos) values('البرمجة','code',0),('أساسيات الحاسب','monitor',1),('أنظمة التشغيل','hard-drive',2) returning id,name)
insert into units(cat_id,title,descr,res,pos)
select c.id,t.title,t.d,'{"pdf":{"t":"📄 تحميل ملخص الوحدة (PDF)","u":"https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"},"video":{"t":"🎥 مشاهدة الشرح المرئي للوحدة","u":"https://www.youtube.com/watch?v=rfscVS0vtbw"},"mind":{"t":"🧠 استعراض الخريطة الذهنية التفاعلية","u":"https://en.wikipedia.org/wiki/Mind_map"},"flash":{"t":"🃏 مراجعة المصطلحات بالبطاقات","u":"https://quizlet.com/"},"qs":{"t":"📝 بنك الأسئلة والتدريبات العامة","u":"https://www.w3schools.com/quiztest/quiztest.asp?qtest=HTML"},"exam":{"t":"📋 الانتقال لاختبار الوحدة (Google Forms)","u":"https://docs.google.com/forms/"}}'::jsonb,0
from c join (values('البرمجة','الوحدة 1: أساسيات البرمجة','المتغيرات وأنواع البيانات والعمليات.'),('أساسيات الحاسب','الوحدة 1: مكونات الحاسب','المكونات المادية والبرمجية.'),('أنظمة التشغيل','الوحدة 1: مدخل إلى أنظمة التشغيل','وظائف نظام التشغيل وأنواعه.')) t(cn,title,d) on c.name=t.cn;

-- بعد أن تسجّل حسابك الأول في الموقع، شغّل هذا السطر لتصبح مديرًا (غيّر البريد):
-- update profiles set is_admin=true, approved=true where email='your@email.com';
