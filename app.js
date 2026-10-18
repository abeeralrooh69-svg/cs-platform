const {createClient}=supabase,sb=createClient(CFG.URL,CFG.KEY);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RES=[['pdf','مستند PDF','file-text','#dc2626','#fee2e2'],['video','الشرح المرئي','video','#ea580c','#ffedd5'],['mind','الخريطة الذهنية','brain','#9333ea','#f3e8ff'],['flash','البطاقات التعليمية','layers','#0891b2','#cffafe'],['qs','بنك الأسئلة','clipboard-list','#16a34a','#dcfce7'],['exam','اختبار الوحدة (Google Forms)','clipboard-check','#4f46e5','#e0e7ff']];
let me=null,cats=[],mode='login',dp=null;
const $=s=>document.querySelector(s),C=id=>cats.find(c=>c.id===id),UN=(c,u)=>C(c)?.units.find(x=>x.id===u);
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;$('#tc').append(t);setTimeout(()=>t.remove(),2600)};
const icons=()=>{try{lucide.createIcons()}catch(e){}};
const show=h=>{$('#main').innerHTML=h;icons()};
const crumb=a=>`<nav class="text-sm mu mb-4 flex gap-2 flex-wrap"><a href="#/" class="hover:underline">الرئيسية</a>${a.map(([t,h])=>`<span>›</span>${h?`<a class="hover:underline" href="${h}">${esc(t)}</a>`:`<span>${esc(t)}</span>`}`).join('')}</nav>`;

/* ---------- Auth ---------- */
const authV=()=>`<div class="card p-6 max-w-md mx-auto mt-6"><div class="text-center mb-4"><div class="ic mx-auto mb-2" style="background:var(--acs)"><i data-lucide="graduation-cap" class="ac"></i></div><h1 class="font-extrabold text-xl">${mode==='login'?'تسجيل الدخول':'إنشاء حساب طالب'}</h1></div>
${mode==='signup'?'<label>الاسم الكامل</label><input id="a-n"><label>رقم الهاتف</label><input id="a-p" dir="ltr" type="tel" placeholder="05xxxxxxxx">':''}
<label>البريد الإلكتروني</label><input id="a-e" dir="ltr" type="email"><label>كلمة المرور (6 أحرف على الأقل)</label><input id="a-w" dir="ltr" type="password">
<button class="btn p w-full justify-center" data-act="${mode}">${mode==='login'?'دخول':'تسجيل'}</button>
<p class="text-sm mu mt-4 text-center">${mode==='login'?'ليس لديك حساب؟ <a href="#" class="ac" data-act="sw">سجّل الآن</a>':'لديك حساب؟ <a href="#" class="ac" data-act="sw">تسجيل الدخول</a>'}</p>${mode==='signup'?'<p class="text-xs mu text-center mt-2">بعد التسجيل ينتظر حسابك موافقة الإدارة.</p>':''}</div>`;
const pendV=()=>`<div class="card p-8 max-w-md mx-auto mt-6 text-center"><div class="ic mx-auto mb-3" style="background:#fef3c7;color:#d97706"><i data-lucide="clock"></i></div><h1 class="font-extrabold text-xl mb-2">حسابك بانتظار الموافقة</h1><p class="mu">سيتم تفعيل حسابك من قبل الإدارة قريبًا. أعد المحاولة لاحقًا.</p><div class="flex gap-2 justify-center mt-4"><button class="btn" data-act="recheck">تحديث الحالة</button><button class="btn" data-act="logout">خروج</button></div></div>`;
async function enter(session){me=null;
 if(session){const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();me=data}
 $('#adm').classList.toggle('hidden',!(me&&me.is_admin));$('#lo').classList.toggle('hidden',!session);
 if(!session)return show(authV());
 if(!me||!(me.approved||me.is_admin))return show(pendV());
 await load();render()}
async function load(){const {data,error}=await sb.from('categories').select('*,units(*)').order('pos');if(error)return toast('تعذر تحميل البيانات');cats=data.map(c=>({...c,units:c.units.sort((a,b)=>a.pos-b.pos)}))}

/* ---------- Student views ---------- */
const home=()=>`<section class="card p-6 sm:p-10 mb-8" style="background:linear-gradient(135deg,var(--ac),#7c3aed);color:#fff;border:0"><h1 class="text-2xl sm:text-4xl font-extrabold mb-2">مرحبًا ${esc(me.name||'')} 💻</h1><p class="opacity-90">اختر قسمًا لتصفّح وحداته: مستندات، فيديو، خرائط ذهنية، بطاقات، أسئلة واختبارات.</p></section><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${cats.map(c=>`<a href="#/cat/${c.id}" class="card p-5 hover:shadow-lg transition block"><div class="ic mb-3" style="background:var(--acs)"><i data-lucide="${esc(c.icon||'folder')}" class="ac"></i></div><h2 class="font-bold text-lg">${esc(c.name)}</h2><p class="mu text-sm">${c.units.length} وحدات</p></a>`).join('')||'<p class="mu">لا توجد أقسام.</p>'}</div>`;
function cat(id){const c=C(id);if(!c)return'<p>القسم غير موجود.</p>';return crumb([[c.name]])+`<h1 class="text-2xl font-extrabold mb-5">${esc(c.name)}</h1><div class="grid gap-4 sm:grid-cols-2">${c.units.map(u=>`<a href="#/unit/${c.id}/${u.id}" class="card p-5 hover:shadow-lg transition block"><h2 class="font-bold">${esc(u.title)}</h2><p class="mu text-sm">${esc(u.descr)}</p><span class="ac text-sm inline-flex items-center gap-1 mt-3">فتح الوحدة <i data-lucide="arrow-left" class="w-4 h-4"></i></span></a>`).join('')||'<p class="mu">لا توجد وحدات.</p>'}</div>`}
async function unit(ci,ui){const c=C(ci),u=UN(ci,ui);if(!u)return'<p>الوحدة غير موجودة.</p>';
const {data:cm}=await sb.from('comments').select('*').eq('unit_id',ui).order('created_at',{ascending:false});
return crumb([[c.name,'#/cat/'+c.id],[u.title]])+`<h1 class="text-2xl font-extrabold">${esc(u.title)}</h1><p class="mu mb-6">${esc(u.descr)}</p><div class="grid gap-3 sm:grid-cols-2">${RES.map(([k,lbl,ic,col,bg])=>{const r=u.res?.[k]||{},on=r.u&&r.u.trim();return`<button class="card res ${on?'':'off'}" ${on?`data-act="open" data-k="${k}"`:'disabled'}><span class="ic" style="background:${bg};color:${col}"><i data-lucide="${ic}"></i></span><span class="flex-1"><b class="block">${esc(r.t||lbl)}</b><small class="mu">${on?lbl:'غير متاح بعد'}</small></span><i data-lucide="${k==='pdf'||k==='mind'?'maximize-2':'external-link'}" class="mu w-4 h-4"></i></button>`}).join('')}</div>
<h2 class="font-bold text-lg mt-10 mb-3 flex items-center gap-2"><i data-lucide="messages-square" class="ac"></i>النقاش (${cm?.length||0})</h2><div class="card p-4"><label>سؤالك أو تعليقك</label><textarea id="cm" rows="3"></textarea><button class="btn p" data-act="comment"><i data-lucide="send"></i>إرسال</button></div>
<div class="mt-4 grid gap-3">${(cm||[]).map(m=>`<div class="card p-4"><div class="flex justify-between text-sm"><b>${esc(m.name)}</b><span class="mu">${new Date(m.created_at).toLocaleDateString('ar')}</span></div><p class="mt-1">${esc(m.body)}</p>${me.is_admin||m.user_id===me.id?`<button class="btn d mt-2" data-act="cdel" data-id="${m.id}">حذف</button>`:''}</div>`).join('')}</div>`}

/* ---------- Admin ---------- */
async function adminV(){const {data:st}=await sb.from('profiles').select('*').order('created_at',{ascending:false});const stu=(st||[]).filter(s=>!s.is_admin);
return`<div class="flex flex-wrap gap-2 justify-between items-center mb-5"><h1 class="text-2xl font-extrabold">لوحة الإدارة</h1><a class="btn p" href="#/admin/cat/new"><i data-lucide="plus"></i>قسم جديد</a></div>
<div class="card p-4 mb-5"><b class="flex items-center gap-2 mb-2"><i data-lucide="users" class="ac"></i>الطلاب (${stu.length}) — بانتظار الموافقة: ${stu.filter(s=>!s.approved).length}</b>${stu.map(s=>`<div class="flex flex-wrap gap-2 justify-between items-center border-t py-2" style="border-color:var(--bd)"><span><b>${esc(s.name||'—')}</b> <small class="mu" dir="ltr">${esc(s.email)} · ${esc(s.phone||'')}</small></span><button class="btn ${s.approved?'d':'p'}" data-act="appr" data-id="${s.id}" data-v="${!s.approved}">${s.approved?'إيقاف':'قبول'}</button></div>`).join('')||'<p class="mu text-sm">لا يوجد طلاب مسجلون بعد.</p>'}</div>`+
cats.map(c=>`<div class="card p-4 mb-4"><div class="flex flex-wrap gap-2 justify-between items-center"><b class="flex items-center gap-2"><i data-lucide="${esc(c.icon||'folder')}" class="ac"></i>${esc(c.name)}</b><div class="flex gap-2"><a class="btn" href="#/admin/cat/${c.id}"><i data-lucide="pencil"></i>تعديل</a><button class="btn d" data-act="cdelcat" data-id="${c.id}"><i data-lucide="trash-2"></i></button></div></div>${c.units.map(u=>`<div class="flex flex-wrap gap-2 justify-between items-center border-t py-2 mt-2" style="border-color:var(--bd)"><span>${esc(u.title)}</span><div class="flex gap-2"><a class="btn" href="#/admin/unit/${c.id}/${u.id}"><i data-lucide="pencil"></i>تعديل</a><button class="btn d" data-act="udel" data-id="${u.id}"><i data-lucide="trash-2"></i></button></div></div>`).join('')}<a class="btn mt-3" href="#/admin/unit/${c.id}/new"><i data-lucide="plus"></i>وحدة جديدة</a></div>`).join('')}
function catForm(id){const c=id==='new'?{name:'',icon:'folder'}:C(id);if(!c)return'<p>غير موجود</p>';return crumb([['الإدارة','#/admin'],[id==='new'?'قسم جديد':'تعديل قسم']])+`<div class="card p-5 max-w-lg"><label>اسم القسم</label><input id="f-n" value="${esc(c.name)}"><label>أيقونة Lucide (code, monitor, hard-drive, database, network)</label><input id="f-i" dir="ltr" value="${esc(c.icon)}"><button class="btn p" data-act="csave" data-id="${id}">حفظ</button></div>`}
function unitForm(ci,ui){const u=ui==='new'?{title:'',descr:'',res:{}}:UN(ci,ui);if(!u)return'<p>غير موجود</p>';
return crumb([['الإدارة','#/admin'],[ui==='new'?'وحدة جديدة':'تعديل وحدة']])+`<div class="card p-5 mb-4"><label>عنوان الوحدة</label><input id="f-t" value="${esc(u.title)}"><label>وصف مختصر</label><input id="f-d" value="${esc(u.descr)}"></div>`+RES.map(([k,lbl,ic])=>`<div class="card p-5 mb-3"><b class="flex items-center gap-2 mb-2"><i data-lucide="${ic}" class="ac"></i>${lbl}</b><label>العنوان الجذاب</label><input data-t="${k}" value="${esc(u.res?.[k]?.t)}"><label>الرابط / مسار الملف (فارغ = إخفاء الزر)</label><input data-u="${k}" dir="ltr" value="${esc(u.res?.[k]?.u)}"></div>`).join('')+`<button class="btn p" data-act="usave" data-c="${ci}" data-id="${ui}"><i data-lucide="save"></i>حفظ الوحدة</button>`}

async function render(){if(!me)return;const p=(location.hash||'#/').slice(2).split('/');let h;
if(p[0]==='cat')h=cat(p[1]);else if(p[0]==='unit')h=await unit(p[1],p[2]);
else if(p[0]==='admin')h=!me.is_admin?'<p>غير مصرح لك.</p>':p[1]==='cat'?catForm(p[2]):p[1]==='unit'?unitForm(p[2],p[3]):await adminV();else h=home();
show(h);scrollTo(0,0)}
addEventListener('hashchange',render);
const cur=()=>{const p=location.hash.split('/');return UN(p[2],p[3])};
const fail=(r,ok)=>{if(r.error){toast('تعذر الحفظ: '+r.error.message);return true}toast(ok);return false};

document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,d=b.dataset;
if(a==='sw'){e.preventDefault();mode=mode==='login'?'signup':'login';show(authV())}
else if(a==='login'){const r=await sb.auth.signInWithPassword({email:$('#a-e').value.trim(),password:$('#a-w').value});if(r.error)return toast('بيانات الدخول غير صحيحة');enter(r.data.session)}
else if(a==='signup'){const n=$('#a-n').value.trim(),ph=$('#a-p').value.trim();if(!n||!ph)return toast('الاسم والهاتف مطلوبان');
 const r=await sb.auth.signUp({email:$('#a-e').value.trim(),password:$('#a-w').value,options:{data:{name:n,phone:ph}}});if(r.error)return toast(r.error.message);
 if(r.data.session)enter(r.data.session);else{mode='login';show(authV());toast('تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول')}}
else if(a==='logout'){await sb.auth.signOut();enter(null)}
else if(a==='recheck'){enter((await sb.auth.getSession()).data.session)}
else if(a==='install'){if(dp){dp.prompt();dp=null;$('#inst').classList.add('hidden')}else toast('في آيفون: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»')}
else if(a==='theme'){const r=document.documentElement,dk=getComputedStyle(r).getPropertyValue('--bg').trim()==='#0f172a';r.dataset.theme=dk?'light':'dark'}
else if(a==='open'){const r=cur().res[d.k],u=r.u.trim();toast('جارٍ فتح: '+RES.find(x=>x[0]===d.k)[1]);
 if(d.k==='pdf'||d.k==='mind'){$('#mt').textContent=r.t;$('#mo').href=u;$('#mf').src=u;$('#modal').classList.remove('hidden');icons()}else window.open(u,'_blank','noopener')}
else if(a==='close'){$('#modal').classList.add('hidden');$('#mf').src='about:blank'}
else if(a==='comment'){const t=$('#cm').value.trim();if(!t)return toast('اكتب تعليقك أولاً');if(!fail(await sb.from('comments').insert({unit_id:cur().id,user_id:me.id,name:me.name||'طالب',body:t}),'تمت إضافة التعليق'))render()}
else if(a==='cdel'){await sb.from('comments').delete().eq('id',d.id);render()}
else if(a==='appr'){if(!fail(await sb.from('profiles').update({approved:d.v==='true'}).eq('id',d.id),'تم التحديث'))render()}
else if(a==='cdelcat'){if(confirm('حذف القسم وكل وحداته؟')&&!fail(await sb.from('categories').delete().eq('id',d.id),'تم الحذف')){await load();render()}}
else if(a==='udel'){if(confirm('حذف الوحدة؟')&&!fail(await sb.from('units').delete().eq('id',d.id),'تم الحذف')){await load();render()}}
else if(a==='csave'){const n=$('#f-n').value.trim();if(!n)return toast('الاسم مطلوب');const v={name:n,icon:$('#f-i').value.trim()||'folder'};
 const r=d.id==='new'?await sb.from('categories').insert({...v,pos:cats.length}):await sb.from('categories').update(v).eq('id',d.id);if(!fail(r,'تم الحفظ')){await load();location.hash='#/admin'}}
else if(a==='usave'){const t=$('#f-t').value.trim();if(!t)return toast('العنوان مطلوب');const res={};
 RES.forEach(([k])=>res[k]={t:document.querySelector(`[data-t=${k}]`).value,u:document.querySelector(`[data-u=${k}]`).value});const v={title:t,descr:$('#f-d').value,res};
 const r=d.id==='new'?await sb.from('units').insert({...v,cat_id:d.c,pos:C(d.c).units.length}):await sb.from('units').update(v).eq('id',d.id);if(!fail(r,'تم حفظ الوحدة')){await load();location.hash='#/admin'}}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('[data-act=close]').click()});
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#inst').classList.remove('hidden')});
if(/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone)$('#inst').classList.remove('hidden');
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
icons();
if(CFG.URL.includes('YOUR-PROJECT'))show('<div class="card p-6 max-w-lg mx-auto"><h1 class="font-bold text-lg mb-2">لم يتم ضبط Supabase بعد</h1><p class="mu">عدّل js/config.js بالرابط والمفتاح، وشغّل supabase/schema.sql. راجع README.md.</p></div>');
else sb.auth.getSession().then(r=>enter(r.data.session));
