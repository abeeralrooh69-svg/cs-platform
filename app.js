addEventListener('error',e=>{const m=document.getElementById('main');if(m)m.innerHTML='<div class="card auth"><b>حدث خطأ في تشغيل الموقع</b><p class="mu" dir="ltr" style="word-break:break-all">'+String(e.message).replace(/</g,'&lt;')+'</p><p class="mu">تأكد من ضبط config.js ثم أعد تحميل الصفحة.</p></div>'});
const {createClient}=supabase,sb=createClient(CFG.URL,CFG.KEY),BK='content';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// [المفتاح، الاسم، الأيقونة، اللون، الأنواع المقبولة للرفع، تلميح]
const RES=[
['pdf','مستند PDF','file-text','#e11d48','.pdf,application/pdf','ارفع ملف PDF من هاتفك أو ألصق رابطه.'],
['video','الشرح المرئي','play-circle','#ea580c','video/*','للفيديوهات الطويلة الأفضل رابط YouTube؛ الرفع المباشر حدّه 50 ميغابايت.'],
['mind','الخريطة الذهنية','network','#7c3aed','.html,.htm,.pdf,image/*','ارفع صفحة HTML للخريطة (تُعرض داخل الموقع) أو PDF أو صورة، أو ألصق رابطاً.'],
['flash','البطاقات التعليمية','layers','#0891b2','.html,.htm,.pdf,image/*','صفحة HTML للبطاقات أو رابط (Quizlet وغيره).'],
['qs','بنك الأسئلة','list-checks','#16a34a','.html,.htm,.pdf,image/*','صفحة HTML للأسئلة أو PDF أو رابط.'],
['exam','اختبار الوحدة (Google Forms)','clipboard-check','#2563eb','.html,.htm,.pdf','ألصق رابط Google Forms مباشرة.']];
let me=null,cats=[],mode='login',dp=null,draft={},ukey='';
const $=s=>document.querySelector(s),C=id=>cats.find(c=>c.id===id),UN=(c,u)=>C(c)?.units.find(x=>x.id===u);
const uid=()=>Math.random().toString(36).slice(2,9);
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;$('#tc').append(t);setTimeout(()=>t.remove(),2800)};
const icons=()=>{try{lucide.createIcons()}catch(e){}};
const show=h=>{$('#main').innerHTML=h;icons()};
const I=(n,c='')=>`<i data-lucide="${n}" class="${c}"></i>`;
const crumb=a=>`<nav class="crumb"><a href="#/">الرئيسية</a>${a.map(([t,h])=>`<span>›</span>${h?`<a href="${h}">${esc(t)}</a>`:`<span>${esc(t)}</span>`}`).join('')}</nav>`;
const hasRes=r=>!!(r&&(r.path||(r.u&&r.u.trim())));

/* ---------- Auth ---------- */
const authV=()=>`<div class="card auth"><div class="abrand"><img src="logo.png" alt="" width="84" height="84"><b>أكاديمية المعراج الرقمي</b><small dir="ltr">Al-Me'raj Digital Academy</small></div><h1>${mode==='login'?'تسجيل الدخول':'إنشاء حساب طالب'}</h1>
${mode==='signup'?'<label>الاسم الكامل</label><input id="a-n"><label>رقم الهاتف</label><input id="a-p" dir="ltr" type="tel" placeholder="05xxxxxxxx">':''}
<label>البريد الإلكتروني</label><input id="a-e" dir="ltr" type="email"><label>كلمة المرور (6 أحرف على الأقل)</label><input id="a-w" dir="ltr" type="password">
<button class="btn p full" data-act="${mode}">${mode==='login'?'دخول':'تسجيل'}</button>
<p class="mu" style="text-align:center;font-size:14px;margin:14px 0 0">${mode==='login'?'ليس لديك حساب؟ <a href="#" style="color:var(--ac);font-weight:700" data-act="sw">سجّل الآن</a>':'لديك حساب؟ <a href="#" style="color:var(--ac);font-weight:700" data-act="sw">تسجيل الدخول</a>'}</p>${mode==='signup'?'<p class="hint" style="text-align:center">بعد التسجيل ينتظر حسابك موافقة الإدارة.</p>':''}</div>`;
const pendV=()=>`<div class="card auth" style="text-align:center"><div class="tile" style="margin:0 auto 12px;background:#fef3c7;color:#d97706">${I('clock')}</div><h1>حسابك بانتظار الموافقة</h1><p class="mu">سيتم تفعيل حسابك من قبل الإدارة قريبًا.</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn" data-act="recheck">تحديث الحالة</button><button class="btn" data-act="logout">خروج</button></div></div>`;
async function enter(session){me=null;
 if(session){const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();me=data}
 $('#adm').classList.toggle('hidden',!(me&&me.is_admin));document.querySelectorAll('.si').forEach(e=>e.classList.toggle('hidden',!session));
 if(!session)return show(authV());
 if(!me||!(me.approved||me.is_admin))return show(pendV());
 await load();render()}
let noLessons=false;
async function load(){noLessons=false;let r=await sb.from('categories').select('*,units(*,lessons(*))').order('pos');
 if(r.error){r=await sb.from('categories').select('*,units(*)').order('pos');noLessons=true}
 if(r.error)return toast('تعذر تحميل البيانات');
 cats=r.data.map(c=>({...c,units:c.units.sort((a,b)=>a.pos-b.pos).map(u=>({...u,lessons:(u.lessons||[]).sort((a,b)=>a.pos-b.pos)}))}))}

/* ---------- Student views ---------- */
const PAL=[['#4facfe','#00f2fe'],['#8b7bff','#4facfe'],['#00d4a8','#00f2fe'],['#f59e0b','#fb7185'],['#a78bfa','#22d3ee']];
const WORDS=['البرمجة','مايكروسوفت أوفيس','إدارة التشغيل','مهارات التقنية'];
const FEAT=[['file-text','ملخصات وبنك PDF','حقائب تعليمية شاملة ومصممة لكل وحدة دراسية جاهزة للتحميل والمذاكرة.'],['play-circle','شروحات فيديو تفاعلية','دروس مبسطة تغطي مفاهيم البرمجة وأساسيات إدارة وتشغيل الحاسوب.'],['list-checks','كويزات واختبارات ذاتية','تقييمات فورية بعد كل وحدة لمساعدتك على قياس فهمك وتثبيت معلوماتك.'],['network','خرائط ذهنية ومخططات','Diagrams وشروحات بصرية لتسهيل فهم الخوارزميات وبنية الأنظمة.']];
const LS=(c,u,l)=>UN(c,u)?.lessons?.find(x=>x.id===l);
const cnt=r=>RES.filter(([k])=>hasRes(r?.[k])).length;
const rowCard=(c,u,i)=>`<a class="row-card" href="#/unit/${c.id}/${u.id}"><span class="num">${i+1}</span><div class="cat-b"><b>${esc(u.title)}</b><small>${u.lessons?.length?u.lessons.length+' دروس · ':''}${esc(u.descr)}</small></div>${I('chevron-left','chev')}</a>`;
const lessonCard=(c,u,l,i)=>`<a class="row-card" href="#/lesson/${c.id}/${u.id}/${l.id}"><span class="num">${i+1}</span><div class="cat-b"><b>${esc(l.title)}</b><small>${cnt(l.res)} من 6 وسائل${l.descr?' · '+esc(l.descr):''}</small></div>${I('chevron-left','chev')}</a>`;
const home=()=>{const nu=cats.reduce((a,c)=>a+c.units.length,0),nl=cats.reduce((a,c)=>a+c.units.reduce((x,u)=>x+(u.lessons?.length||0),0),0);
return`<section id="s-home" class="hero"><div class="rv"><span class="badge"><i></i>مرحبًا ${esc(me.name||'')} · منصتك التعليمية المتكاملة</span>
<h1>ارتقِ بمهاراتك التقنية إلى آفاق جديدة مع <span class="gr">أكاديمية المعراج الرقمي</span></h1>
<p class="lead">منصة شاملة لتأسيس وتدريب طلاب الحاسوب في مجالات البرمجة، إدارة التشغيل، وبرامج مايكروسوفت أوفيس بأحدث الأساليب التفاعلية.</p>
<div class="rline">ابدأ رحلتك في <span class="rot" id="rot">${WORDS[0]}</span></div>
<div class="hero-btns"><button class="btn p" data-act="go" data-id="courses">استكشف الكورسات ${I('arrow-left')}</button><button class="btn o" data-act="go" data-id="about">${I('play-circle')}عن الأكاديمية</button></div></div>
<div class="vis rv"><span class="orb a"></span><span class="orb b"></span><div class="glass-card main-card glow"><div class="ic">${I('cpu')}</div><h3>تعلّم، اختبر، وارتقِ</h3><p>ملخصات PDF • كويزات تفاعلية • شروحات فيديو • خرائط ذهنية</p><div class="counts"><div><b class="count" data-n="${cats.length}">0</b><small>كورسات</small></div><div><b class="count" data-n="${nu}">0</b><small>وحدات</small></div><div><b class="count" data-n="6">0</b><small>مصادر تعلّم</small></div></div></div></div></section>
<section id="s-features" class="blk"><div class="sec-t rv"><h2>مميزات الوحدات التعليمية</h2><p>كل ما يحتاجه طالب الحاسوب لتفوقه الأكاديمي والمهني في مكان واحد</p></div><div class="features-grid">${FEAT.map(f=>`<div class="glass-card feature-card glow rv"><div class="icon-wrapper">${I(f[0])}</div><h3>${f[1]}</h3><p>${f[2]}</p></div>`).join('')}</div></section>
<section id="s-courses" class="blk"><div class="sec-t rv"><h2>الكورسات المقدَّمة</h2><p>اختر الكورس وابدأ بوحداته ومحتواه</p></div><div class="srch rv">${I('search')}<input id="q" placeholder="ابحث عن وحدة أو درس…" autocomplete="off"></div>
<div id="sr"></div><div id="cg" class="bento">${cats.map((c,i)=>{const p=PAL[i%PAL.length];return`<a class="course glow rv" style="--c1:${p[0]};--c2:${p[1]}" href="#/cat/${c.id}"><span class="tile lg">${I(esc(c.icon||'folder'))}</span><b>${esc(c.name)}</b><small>${c.units.length} وحدات</small><ul>${c.units.slice(0,3).map(u=>`<li>${esc(u.title)}</li>`).join('')}</ul><span class="more">استعرض الكورس ${I('arrow-left')}</span></a>`}).join('')||'<p class="mu" style="text-align:center">لا توجد كورسات بعد.</p>'}</div></section>
<section id="s-about" class="blk"><div class="about"><div class="glass-card profile glow rv"><div class="avatar">${I('graduation-cap')}</div><h3>إسراء النور</h3><span dir="ltr">Software Consultant &amp; Tech Trainer</span></div>
<div class="rv"><h2>إشراف وإعداد أكاديمي محترف</h2><p>تم تطوير وتصميم كافة المناهج والوحدات التعليمية تحت إشراف الأستاذة <strong style="color:#fff">إسراء النور</strong>، استشارية البرمجيات والمدربة التقنية، لتقديم تجربة تعليمية تدمج بين الجانب الأكاديمي والخبرة البرمجية العملية.</p>
<ul><li>${I('circle-check')}مناهج مخصصة لطلاب علوم الحاسوب وتقنية المعلومات.</li><li>${I('circle-check')}تركيز على أساسيات التطبيق العملي والمهارات الحديثة.</li><li>${I('circle-check')}متابعة مستمرة وتحديث دوري للمحتوى التعليمي.</li></ul></div></div></section>
<footer class="footer"><div><h3>أكاديمية المعراج الرقمي</h3><p dir="ltr" style="text-align:right">Al-Me'raj Digital Academy</p><small dir="ltr" style="text-align:right">Esraa Alnour for software consulting &amp; tech training</small></div><div class="cp">© 2026 Al-Me'raj Digital Academy. جميع الحقوق محفوظة.</div></footer>`};
let pend=null,rotT=null;
const homeHash=()=>{const h=location.hash;return h===''||h==='#'||h==='#/'};
const SID={home:'s-home',features:'s-features',courses:'s-courses',about:'s-about'};
function scrollToId(k){if(k==='home')return scrollTo({top:0,behavior:'smooth'});const el=document.getElementById(SID[k]);if(el)el.scrollIntoView({behavior:'smooth'})}
function go(k){if(homeHash())scrollToId(k);else{pend=k;location.hash='#/'}}
function fx(){const rv=[...document.querySelectorAll('.rv')];
 if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)rv.forEach(e=>e.classList.add('in'));
 else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});rv.forEach((e,i)=>{e.style.transitionDelay=(i%3)*80+'ms';io.observe(e)})}
 document.querySelectorAll('.count').forEach(el=>{const n=+el.dataset.n,t0=performance.now(),st=t=>{const p=Math.min(1,(t-t0)/1100);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(st)};requestAnimationFrame(st)});
 clearInterval(rotT);const r=$('#rot');if(r){let i=0;rotT=setInterval(()=>{r.classList.add('out');setTimeout(()=>{i=(i+1)%WORDS.length;r.textContent=WORDS[i];r.classList.remove('out')},260)},2400)}}
document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.glow');if(!c)return;const b=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-b.left)+'px');c.style.setProperty('--my',(e.clientY-b.top)+'px')});
function cat(id){const c=C(id);if(!c)return'<p>الكورس غير موجود.</p>';
return crumb([[c.name]])+`<div class="row" style="gap:14px;margin-bottom:18px"><span class="tile lg">${I(esc(c.icon||'folder'))}</span><div><h1>${esc(c.name)}</h1><small>${c.units.length} وحدات</small></div></div><div class="grid">${c.units.map((u,i)=>rowCard(c,u,i)).join('')||'<p class="mu">لا توجد وحدات.</p>'}</div>`}
const tiles=(res,onlyOn)=>RES.map(([k,lbl,ic,col])=>{const r=res?.[k]||{},on=hasRes(r);if(onlyOn&&!on)return'';return`<button class="res ${on?'':'off'}" style="--c:${col}" ${on?`data-act="open" data-k="${k}"`:'disabled'}><span class="tile">${I(ic)}</span><b>${esc(r.t||lbl)}</b><small>${on?lbl:'غير متاح بعد'}</small>${on?`<span class="go">${I('arrow-up-left')}</span>`:''}</button>`}).join('');
async function unit(ci,ui){const c=C(ci),u=UN(ci,ui);if(!u)return'<p>الوحدة غير موجودة.</p>';
const {data:cm}=await sb.from('comments').select('*').eq('unit_id',ui).order('created_at',{ascending:false});
const hasU=cnt(u.res)>0,ls=u.lessons||[];
return crumb([[c.name,'#/cat/'+c.id],[u.title]])+`<h1>${esc(u.title)}</h1><p class="mu" style="margin:0 0 20px">${esc(u.descr)}</p>`+
(hasU?`<div class="res-grid">${tiles(u.res,true)}</div>`:'')+
(ls.length?`<h2 class="sec">${I('book-open')}الدروس (${ls.length})</h2><div class="grid">${ls.map((l,i)=>lessonCard(c,u,l,i)).join('')}</div>`:'')+
(!hasU&&!ls.length?'<p class="mu">لا يوجد محتوى في هذه الوحدة بعد.</p>':'')+
`<h2 class="sec">${I('messages-square')}النقاش (${cm?.length||0})</h2><div class="panel"><label>سؤالك أو تعليقك</label><textarea id="cm" rows="3"></textarea><button class="btn p" data-act="comment">${I('send')}إرسال</button></div>
${(cm||[]).map(m=>`<div class="bub"><span class="av">${esc((m.name||'ط').trim().charAt(0))}</span><div style="flex:1;min-width:0"><div class="row sp"><b>${esc(m.name)}</b><small>${new Date(m.created_at).toLocaleDateString('ar')}</small></div><p style="margin:4px 0 0">${esc(m.body)}</p>${me.is_admin||m.user_id===me.id?`<button class="btn d" style="margin-top:8px;padding:4px 12px" data-act="cdel" data-id="${m.id}">حذف</button>`:''}</div></div>`).join('')}`}


function lessonView(ci,ui,li){const c=C(ci),u=UN(ci,ui),l=LS(ci,ui,li);if(!l)return'<p>الدرس غير موجود.</p>';
const ls=u.lessons,i=ls.indexOf(l),pv=ls[i-1],nx=ls[i+1];
return crumb([[c.name,'#/cat/'+c.id],[u.title,'#/unit/'+c.id+'/'+u.id],[l.title]])+`<h1>${esc(l.title)}</h1><p class="mu" style="margin:0 0 20px">${esc(l.descr)}</p><div class="res-grid">${tiles(l.res,false)}</div>
<div class="row sp" style="margin-top:22px">${pv?`<a class="btn" href="#/lesson/${c.id}/${u.id}/${pv.id}">→ ${esc(pv.title)}</a>`:'<span></span>'}${nx?`<a class="btn p" href="#/lesson/${c.id}/${u.id}/${nx.id}">${esc(nx.title)} ←</a>`:''}</div>
<p style="margin-top:18px"><a class="btn" href="#/unit/${c.id}/${u.id}">${I('messages-square')}نقاش الوحدة</a></p>`}

/* ---------- Open resources ---------- */
function modal(title,url,html){$('#mt').textContent=title;const f=$('#mf');
 if(html!=null){f.removeAttribute('src');f.setAttribute('sandbox','allow-scripts allow-popups allow-forms allow-modals');f.srcdoc=html;$('#mo').classList.add('hidden')}
 else{f.removeAttribute('srcdoc');f.removeAttribute('sandbox');f.src=url;$('#mo').href=url;$('#mo').classList.remove('hidden')}
 $('#modal').classList.remove('hidden');icons()}
async function openRes(k){const r=holder().res[k],lbl=RES.find(x=>x[0]===k)[1],t=r.t||lbl;
 if(r.path){toast('جارٍ التحميل…');const ext=r.path.split('.').pop().toLowerCase();
  if(ext==='html'||ext==='htm'){const {data,error}=await sb.storage.from(BK).download(r.path);if(error)return toast('تعذر فتح الملف');return modal(t,null,await data.text())}
  const {data,error}=await sb.storage.from(BK).createSignedUrl(r.path,3600);if(error)return toast('تعذر فتح الملف');return modal(t,data.signedUrl)}
 const u=r.u.trim();if(k==='pdf'||k==='mind')modal(t,u);else window.open(u,'_blank','noopener')}

/* ---------- Admin ---------- */
async function adminV(){const {data:st}=await sb.from('profiles').select('*').order('created_at',{ascending:false});const stu=(st||[]).filter(s=>!s.is_admin),nu=cats.reduce((a,c)=>a+c.units.length,0),nl=cats.reduce((a,c)=>a+c.units.reduce((x,u)=>x+(u.lessons?.length||0),0),0);
return`<div class="row sp" style="margin-bottom:16px"><h1>لوحة الإدارة</h1><a class="btn p" href="#/admin/cat/new">${I('plus')}كورس جديد</a></div>
${noLessons?`<div class="panel" style="border-color:#f59e0b"><b>⚠️ جدول الدروس غير موجود في قاعدة البيانات</b><p class="mu" style="margin:4px 0 0">شغّل ملف lessons.sql في Supabase (SQL Editor) ثم حدّث الصفحة لتفعيل الدروس.</p></div>`:''}
<div class="stats"><div class="stat"><b>${stu.length}</b><small>الطلاب</small></div><div class="stat"><b>${stu.filter(s=>!s.approved).length}</b><small>بانتظار الموافقة</small></div><div class="stat"><b>${cats.length}</b><small>الكورسات</small></div><div class="stat"><b>${nu} / ${nl}</b><small>وحدات / دروس</small></div></div>
<div class="panel"><div class="hd2">${I('users')}الطلاب</div>${stu.map(s=>`<div class="sep"><span><b>${esc(s.name||'—')}</b> ${s.approved?'':'<span class="tag w">بانتظار الموافقة</span>'}<br><small dir="ltr">${esc(s.email)} · ${esc(s.phone||'')}</small></span><button class="btn ${s.approved?'d':'p'}" data-act="appr" data-id="${s.id}" data-v="${!s.approved}">${s.approved?'إيقاف':'قبول'}</button></div>`).join('')||'<p class="mu">لا يوجد طلاب مسجلون بعد.</p>'}</div>
<h2 class="sec">${I('folders')}الكورسات والوحدات والدروس</h2>`+
cats.map(c=>`<div class="panel"><div class="row sp"><b class="row">${I(esc(c.icon||'folder'))}${esc(c.name)} <span class="tag">كورس</span></b><div class="row"><a class="btn" href="#/admin/cat/${c.id}">${I('pencil')}تعديل</a><button class="btn d" data-act="cdelcat" data-id="${c.id}">${I('trash-2')}</button></div></div>
${c.units.map(u=>`<div class="sep" style="align-items:flex-start"><div style="flex:1;min-width:210px"><b>${esc(u.title)}</b> <small>· وحدة${cnt(u.res)?' · '+cnt(u.res)+'/6 وسائل':''}</small>
${u.lessons.map(l=>`<div class="sep" style="border-top:1px dashed var(--bd);padding:6px 0"><span>📘 ${esc(l.title)} <small>${cnt(l.res)}/6 وسائل</small></span><div class="row"><a class="btn" href="#/admin/lesson/${c.id}/${u.id}/${l.id}">${I('pencil')}تعديل</a><button class="btn d" data-act="ldel" data-id="${l.id}">${I('trash-2')}</button></div></div>`).join('')}
<a class="btn" style="margin-top:6px" href="#/admin/lesson/${c.id}/${u.id}/new">${I('plus')}درس جديد</a></div>
<div class="row"><a class="btn" href="#/admin/unit/${c.id}/${u.id}">${I('pencil')}تعديل الوحدة</a><button class="btn d" data-act="udel" data-id="${u.id}">${I('trash-2')}</button></div></div>`).join('')}
<a class="btn" style="margin-top:8px" href="#/admin/unit/${c.id}/new">${I('plus')}وحدة جديدة</a></div>`).join('')}
function catForm(id){const c=id==='new'?{name:'',icon:'folder'}:C(id);if(!c)return'<p>غير موجود</p>';return crumb([['الإدارة','#/admin'],[id==='new'?'كورس جديد':'تعديل كورس']])+`<div class="panel" style="max-width:520px"><label>اسم الكورس</label><input id="f-n" value="${esc(c.name)}"><label>اسم الأيقونة (code, monitor, hard-drive, database, network, cpu, globe, shield)</label><input id="f-i" dir="ltr" value="${esc(c.icon)}"><button class="btn p" data-act="csave" data-id="${id}">حفظ</button></div>`}
const fileLbl=r=>r&&r.path?'📎 '+esc(r.fname||'ملف مرفوع'):'لم يُرفع ملف';
function resEditor(res){draft=JSON.parse(JSON.stringify(res||{}));
return RES.map(([k,lbl,ic,col,acc,hint])=>`<div class="panel"><div class="hd2"><span class="tile" style="background:${col}1f;color:${col}">${I(ic)}</span>${lbl}</div><label>العنوان الظاهر للطالب</label><input data-t="${k}" value="${esc(res?.[k]?.t)}"><label>رابط (اختياري — يمكن أيضاً مسار ملف داخل الموقع مثل maps/unit1.html)</label><input data-u="${k}" dir="ltr" value="${esc(res?.[k]?.u)}"><div class="upl"><label class="btn" style="margin:0">${I('upload')}رفع ملف من الهاتف<input type="file" hidden data-f="${k}" accept="${acc}"></label><span id="fs-${k}" class="mu" style="font-size:13px">${fileLbl(draft[k])}</span><button class="btn d ${draft[k]?.path?'':'hidden'}" id="fr-${k}" data-act="frm" data-k="${k}">إزالة</button></div><p class="hint">${hint} إن وُجد ملف مرفوع فله الأولوية على الرابط.</p></div>`).join('')}
function collectRes(){const res={};RES.forEach(([k])=>res[k]={t:document.querySelector(`[data-t=${k}]`).value,u:document.querySelector(`[data-u=${k}]`).value,path:draft[k]?.path||'',fname:draft[k]?.fname||''});return res}
function unitForm(ci,ui){const u=ui==='new'?{title:'',descr:'',res:{}}:UN(ci,ui);if(!u)return'<p>غير موجود</p>';ukey=ui==='new'?'new-'+uid():ui;
return crumb([['الإدارة','#/admin'],[ui==='new'?'وحدة جديدة':'تعديل وحدة']])+`<div class="panel"><label>عنوان الوحدة</label><input id="f-t" value="${esc(u.title)}"><label>وصف مختصر</label><input id="f-d" value="${esc(u.descr)}"></div><h2 class="sec">${I('layers')}وسائل الوحدة نفسها (اختياري)</h2><p class="hint" style="margin-top:-6px">إن كانت للوحدة وسائل عامة (مثل الوحدة الأولى) املأها هنا، وإلا اتركها فارغة وأضف دروساً من لوحة الإدارة.</p>`+resEditor(u.res)+`<button class="btn p" data-act="usave" data-c="${ci}" data-id="${ui}">${I('save')}حفظ الوحدة</button>`}
function lessonForm(ci,ui,li){const un=UN(ci,ui);if(!un)return'<p>الوحدة غير موجودة</p>';const l=li==='new'?{title:'',descr:'',res:{}}:LS(ci,ui,li);if(!l)return'<p>الدرس غير موجود</p>';ukey=li==='new'?'new-'+uid():li;
return crumb([['الإدارة','#/admin'],[un.title],[li==='new'?'درس جديد':'تعديل درس']])+`<div class="panel"><label>عنوان الدرس</label><input id="f-t" value="${esc(l.title)}"><label>وصف مختصر</label><input id="f-d" value="${esc(l.descr)}"></div><h2 class="sec">${I('layers')}وسائل الدرس الست</h2>`+resEditor(l.res)+`<button class="btn p" data-act="lsave" data-c="${ci}" data-u="${ui}" data-id="${li}">${I('save')}حفظ الدرس</button>`}

async function render(){if(!me)return;const p=(location.hash||'#/').slice(2).split('/');let h;
if(p[0]==='cat')h=cat(p[1]);else if(p[0]==='unit')h=await unit(p[1],p[2]);else if(p[0]==='lesson')h=lessonView(p[1],p[2],p[3]);
else if(p[0]==='admin')h=!me.is_admin?'<p>غير مصرح لك.</p>':p[1]==='cat'?catForm(p[2]):p[1]==='unit'?unitForm(p[2],p[3]):p[1]==='lesson'?lessonForm(p[2],p[3],p[4]):await adminV();else h=home();
show(h);if(pend){const t=pend;pend=null;setTimeout(()=>scrollToId(t),80)}else scrollTo(0,0);fx()}
addEventListener('hashchange',render);
const cur=()=>{const p=location.hash.split('/');return UN(p[2],p[3])};
const holder=()=>{const p=location.hash.split('/');return p[1]==='lesson'?LS(p[2],p[3],p[4]):UN(p[2],p[3])};
const fail=(r,ok)=>{if(r.error){toast('تعذر الحفظ: '+r.error.message);return true}toast(ok);return false};

document.addEventListener('change',async e=>{const i=e.target.closest('[data-f]');if(!i||!i.files[0])return;const k=i.dataset.f,f=i.files[0];
 if(f.size>50*1024*1024)return toast('الحد الأقصى للملف 50 ميغابايت');
 const ext=(f.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin',path=`${ukey}/${k}-${Date.now()}.${ext}`;
 toast('جارٍ رفع الملف…');
 const r=await sb.storage.from(BK).upload(path,f,{contentType:f.type||undefined,upsert:true});
 if(r.error)return toast('فشل الرفع: '+r.error.message);
 if(draft[k]?.path)sb.storage.from(BK).remove([draft[k].path]);
 draft[k]={...(draft[k]||{}),path,fname:f.name};$('#fs-'+k).textContent='📎 '+f.name;$('#fr-'+k).classList.remove('hidden');toast('تم رفع الملف ✓ — اضغط «حفظ الوحدة» لتثبيته');i.value=''});

document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,d=b.dataset;
if(a==='sw'){e.preventDefault();mode=mode==='login'?'signup':'login';show(authV())}
else if(a==='login'){const r=await sb.auth.signInWithPassword({email:$('#a-e').value.trim(),password:$('#a-w').value});if(r.error)return toast('بيانات الدخول غير صحيحة');enter(r.data.session)}
else if(a==='signup'){const n=$('#a-n').value.trim(),ph=$('#a-p').value.trim();if(!n||!ph)return toast('الاسم والهاتف مطلوبان');
 const r=await sb.auth.signUp({email:$('#a-e').value.trim(),password:$('#a-w').value,options:{data:{name:n,phone:ph}}});if(r.error)return toast(r.error.message);
 if(r.data.session)enter(r.data.session);else{mode='login';show(authV());toast('تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول')}}
else if(a==='logout'){await sb.auth.signOut();enter(null)}
else if(a==='recheck'){enter((await sb.auth.getSession()).data.session)}
else if(a==='install'){if(dp){dp.prompt();dp=null;$('#inst').classList.add('hidden')}else toast('في آيفون: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»')}
else if(a==='go'){go(d.id)}
else if(a==='open')openRes(d.k);
else if(a==='close'){$('#modal').classList.add('hidden');const f=$('#mf');f.removeAttribute('srcdoc');f.src='about:blank'}
else if(a==='comment'){const t=$('#cm').value.trim();if(!t)return toast('اكتب تعليقك أولاً');if(!fail(await sb.from('comments').insert({unit_id:cur().id,user_id:me.id,name:me.name||'طالب',body:t}),'تمت إضافة التعليق'))render()}
else if(a==='cdel'){await sb.from('comments').delete().eq('id',d.id);render()}
else if(a==='appr'){if(!fail(await sb.from('profiles').update({approved:d.v==='true'}).eq('id',d.id),'تم التحديث'))render()}
else if(a==='cdelcat'){if(confirm('حذف الكورس وكل وحداته ودروسه؟')&&!fail(await sb.from('categories').delete().eq('id',d.id),'تم الحذف')){await load();render()}}
else if(a==='udel'){if(confirm('حذف الوحدة وكل دروسها؟')&&!fail(await sb.from('units').delete().eq('id',d.id),'تم الحذف')){await load();render()}}
else if(a==='frm'){const k=d.k;if(draft[k]?.path)sb.storage.from(BK).remove([draft[k].path]);if(draft[k]){delete draft[k].path;delete draft[k].fname}$('#fs-'+k).textContent='لم يُرفع ملف';b.classList.add('hidden');toast('أُزيل الملف — اضغط «حفظ الوحدة»')}
else if(a==='csave'){const n=$('#f-n').value.trim();if(!n)return toast('الاسم مطلوب');const v={name:n,icon:$('#f-i').value.trim()||'folder'};
 const r=d.id==='new'?await sb.from('categories').insert({...v,pos:cats.length}):await sb.from('categories').update(v).eq('id',d.id);if(!fail(r,'تم الحفظ')){await load();location.hash='#/admin'}}
else if(a==='usave'){const t=$('#f-t').value.trim();if(!t)return toast('العنوان مطلوب');const v={title:t,descr:$('#f-d').value,res:collectRes()};
 const r=d.id==='new'?await sb.from('units').insert({...v,cat_id:d.c,pos:C(d.c).units.length}):await sb.from('units').update(v).eq('id',d.id);if(!fail(r,'تم حفظ الوحدة')){await load();location.hash='#/admin'}}
else if(a==='lsave'){const t=$('#f-t').value.trim();if(!t)return toast('العنوان مطلوب');const v={title:t,descr:$('#f-d').value,res:collectRes()};
 const r=d.id==='new'?await sb.from('lessons').insert({...v,unit_id:d.u,pos:UN(d.c,d.u).lessons.length}):await sb.from('lessons').update(v).eq('id',d.id);if(!fail(r,'تم حفظ الدرس')){await load();location.hash='#/admin'}}
else if(a==='ldel'){if(confirm('حذف الدرس؟')&&!fail(await sb.from('lessons').delete().eq('id',d.id),'تم الحذف')){await load();render()}}
});
document.addEventListener('input',e=>{if(e.target.id!=='q')return;const q=e.target.value.trim().toLowerCase(),out=[];
 cats.forEach(c=>c.units.forEach((u,i)=>{if((u.title+' '+u.descr+' '+c.name).toLowerCase().includes(q))out.push(rowCard(c,u,i));(u.lessons||[]).forEach((l,j)=>{if((l.title+' '+(l.descr||'')+' '+u.title).toLowerCase().includes(q))out.push(lessonCard(c,u,l,j))})}));
 $('#cg').classList.toggle('hidden',!!q);$('#sr').innerHTML=q?`<h2 class="sec">${I('search')}نتائج البحث (${out.length})</h2><div class="grid">${out.join('')||'<p class="mu">لا توجد نتائج.</p>'}</div>`:'';icons()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('[data-act=close]').click()});
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#inst').classList.remove('hidden')});
if(/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone)$('#inst').classList.remove('hidden');
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
icons();
if(CFG.URL.includes('YOUR-PROJECT'))show('<div class="card auth"><h1>لم يتم ضبط Supabase بعد</h1><p class="mu">عدّل config.js بالرابط والمفتاح.</p></div>');
else sb.auth.getSession().then(r=>enter(r.data.session));
