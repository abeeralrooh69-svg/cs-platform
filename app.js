// ==========================================
// نظام إدارة المحتوى - أكاديمية المعراج الرقمية
// ==========================================

// الهيكل الأساسي لتخزين الكورسات والدروس في المحفوظات المحلية (LocalStorage)
let coursesData = JSON.parse(localStorage.getItem('almeraj_courses')) || [];

// 1. حفظ البيانات
function saveCoursesToStorage() {
    localStorage.setItem('almeraj_courses', JSON.stringify(coursesData));
    renderCoursesAdminList();
}

// 2. إضافة كورس جديد
function addCourse(title, description, category) {
    const newCourse = {
        id: 'course_' + Date.now(),
        title: title,
        description: description,
        category: category,
        units: []
    };
    coursesData.push(newCourse);
    saveCoursesToStorage();
    alert('تم إضافة الكورس بنجاح!');
}

// 3. إضافة وحدة دراسية داخل كورس معين
function addUnit(courseId, unitTitle) {
    const course = coursesData.find(c => c.id === courseId);
    if (course) {
        const newUnit = {
            id: 'unit_' + Date.now(),
            title: unitTitle,
            lessons: []
        };
        course.units.push(newUnit);
        saveCoursesToStorage();
        alert('تمت إضافة الوحدة الدراسية!');
    }
}

// 4. إضافة درس مع الوسائل التعليمية الستة (ملف أو رابط)
function addLesson(courseId, unitId, lessonTitle, resources) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;
    const unit = course.units.find(u => u.id === unitId);
    if (!unit) return;

    const newLesson = {
        id: 'lesson_' + Date.now(),
        title: lessonTitle,
        // الوسائل التعليمية الستة:
        resources: {
            pdf: resources.pdf || '',           // مستند PDF / ملخص
            video: resources.video || '',       // فيديو تعليمي / رابط
            presentation: resources.presentation || '', // عرض تقديمي
            worksheet: resources.worksheet || '',   // ورقة عمل / أسئلة
            mindmap: resources.mindmap || '',     // خريطة ذهنية
            flashcards: resources.flashcards || ''  // بطاقات تعليمية
        }
    };

    unit.lessons.push(newLesson);
    saveCoursesToStorage();
    alert('تم إضافة الدرس بالوسائل التعليمية بنجاح!');
}

// 5. دالة قراءة وتمرير الملف المرفوع وتحويله إلى Base64 أو رابط مؤقت
function handleFileUpload(fileInput, callback) {
    const file = fileInput.files[0];
    if (!file) {
        callback('');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        callback(e.target.result); // يُرجع رابط البيانات (Base64) الخاص بالملف
    };
    reader.readAsDataURL(file);
}
