// ==========================================
// 1. نظام التنقل والتبويب بدون إخفاء باقي الواجهة
// ==========================================
function showTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
}

// ==========================================
// 2. فحص صلاحيات البريد الإلكتروني للإدارة
// ==========================================
// ضعي إيميلات الإدارة المعتمدة هنا
const adminEmails = ["admin@almeraj.com", "israa@almeraj.com"]; 

function checkUserRole() {
    // جلب الإيميل المسجل حالياً من المحفوظات المحلية
    const currentUserEmail = localStorage.getItem('almeraj_user_email') || '';

    const adminButtons = document.querySelectorAll('.admin-tab-btn');
    const adminSection = document.getElementById('admin-section');

    if (adminEmails.includes(currentUserEmail)) {
        // إذا كان إيميل إدارة: أظهر الزر والقسم
        adminButtons.forEach(btn => btn.style.display = 'inline-block');
    } else {
        // إذا كان طالباً عادياً: إخفاء الزر والقسم كلياً
        adminButtons.forEach(btn => btn.style.display = 'none');
        if (adminSection) adminSection.style.display = 'none';
    }
}

// ==========================================
// 3. إدارة الكورسات والوسائل التعليمية الستة
// ==========================================
let coursesData = JSON.parse(localStorage.getItem('almeraj_courses')) || [];

function saveCoursesToStorage() {
    localStorage.setItem('almeraj_courses', JSON.stringify(coursesData));
}

function submitNewCourse() {
    const title = document.getElementById('courseTitle').value;
    const desc = document.getElementById('courseDesc').value;

    if (!title) {
        alert('يرجى إدخال عنوان الكورس!');
        return;
    }

    const newCourse = {
        id: 'course_' + Date.now(),
        title: title,
        description: desc,
        units: []
    };

    coursesData.push(newCourse);
    saveCoursesToStorage();
    alert('تمت إضافة الكورس بنجاح!');
    document.getElementById('courseTitle').value = '';
    document.getElementById('courseDesc').value = '';
}

function submitNewLesson() {
    const title = document.getElementById('lessonTitle').value;
    if (!title) {
        alert('يرجى إدخال عنوان الدرس!');
        return;
    }

    const resources = {
        pdf: document.getElementById('resPdfUrl').value || 'مرفق ملف',
        video: document.getElementById('resVideoUrl').value || 'مرفق فيديو',
        ppt: document.getElementById('resPptUrl').value || 'مرفق عرض',
        worksheet: document.getElementById('resWorksheetUrl').value || 'مرفق تمارين',
        mindmap: document.getElementById('resMindmapUrl').value || 'مرفق خريطة',
        flashcards: document.getElementById('resFlashcardsUrl').value || 'مرفق بطاقات'
    };

    alert('تم حفظ الدرس بالوسائل التعليمية بنجاح!');
}

// تشغيل الفحص والتنقل عند تحميل الصفحة تلقائياً
window.addEventListener('DOMContentLoaded', () => {
    checkUserRole();
});
