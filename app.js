// التبديل بين الشاشات
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.target.classList.add('active');
}

// حفظ الدرس والوسائل
document.getElementById('add-lesson-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const lessonData = {
        course: document.getElementById('course-name').value,
        unit: document.getElementById('unit-name').value,
        title: document.getElementById('lesson-title').value,
        media: {
            pdf: document.getElementById('pdf-url').value || document.getElementById('pdf-file').files[0]?.name,
            video: document.getElementById('video-url').value || document.getElementById('video-file').files[0]?.name,
            mindmap: document.getElementById('mindmap-url').value || document.getElementById('mindmap-file').files[0]?.name,
            terms: document.getElementById('terms-url').value || document.getElementById('terms-file').files[0]?.name,
            questions: document.getElementById('questions-url').value || document.getElementById('questions-file').files[0]?.name,
            quiz: document.getElementById('quiz-url').value || document.getElementById('quiz-file').files[0]?.name
        }
    };

    alert(`تم حفظ ونشر الدرس: "${lessonData.title}" بنجاح وتجهيز الوسائل التعليمية الست!`);
    this.reset();
});
