# منصة الحاسب التعليمية (Supabase + PWA)

موقع ثابت على Vercel، حسابات الطلاب وبيانات المحتوى في Supabase، ويُثبَّت كتطبيق (PWA).

## 1) إعداد Supabase (مجاني)
1. supabase.com > New project.
2. SQL Editor > New query > الصق محتوى supabase/schema.sql > Run.
3. Project Settings > API: انسخ Project URL و anon public key إلى js/config.js.
4. Authentication > Providers > Email: فعّل. (اختياري للتجربة: عطّل Confirm email لتسجيل أسرع.)
5. Authentication > URL Configuration: ضع رابط موقعك في Site URL.

## 2) أول مدير
سجّل حسابًا من الموقع، ثم في SQL Editor شغّل (بريدك):
    update profiles set is_admin=true, approved=true where email='you@example.com';
ثم أعد فتح الموقع: سيظهر زر «الإدارة».

## 3) النشر
ارفع كل الملفات إلى GitHub ثم استورد المستودع في Vercel (Framework: Other).
لا حاجة لمتغيرات بيئة. (anon key مفتاح عام؛ الحماية الفعلية من سياسات RLS في schema.sql.)

## كيف تعمل الصلاحيات
- الطالب يسجّل (اسم + بريد + هاتف) فيبقى «بانتظار الموافقة».
- المدير يقبل أو يوقف الطلاب من لوحة الإدارة. الطالب غير المقبول لا يستطيع قراءة أي محتوى (محمي في قاعدة البيانات).
- المدير وحده يضيف ويعدّل ويحذف الأقسام والوحدات.

## تثبيت التطبيق (PWA)
- أندرويد/كروم: زر «تثبيت» في الأعلى.
- آيفون/سفاري: مشاركة > إضافة إلى الشاشة الرئيسية.
- يتطلب HTTPS (يوفره Vercel).

## تنبيه
روابط PDF/فيديو/Google Forms التي تضيفها تبقى مفتوحة لمن يعرف الرابط المباشر.
