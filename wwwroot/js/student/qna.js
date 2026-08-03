//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Student");

    if (!user) return;

    renderNavbar(user, "/Student/Qna");

    await loadCourseDropdown();
    await loadHistory();

    //          when the course changes, reload the chapter dropdown          //

    document.getElementById("qnaCourse").addEventListener("change", async function () {
        await loadChapterDropdown(this.value);
    });
});

//                               course dropdown                               //

//          small GET just to fill the dropdown -          //
//          only courses I am ENROLLED in (GET /api/enrollments/my)          //

async function loadCourseDropdown() {
    const result = await apiGet("/api/enrollments/my");

    const courseSelect = document.getElementById("qnaCourse");
    let optionsHtml = `<option value="">-- Select a course --</option>`;

    if (result.success) {
        for (const course of result.data) {
            optionsHtml += `<option value="${course.courseId}">${escapeHtml(course.title)}</option>`;
        }
    }

    courseSelect.innerHTML = optionsHtml;
}

//                               chapter dropdown                               //

//          filled from GET /api/courses/{id} when a course is picked          //

async function loadChapterDropdown(courseId) {
    const chapterSelect = document.getElementById("qnaChapter");

    chapterSelect.innerHTML = `<option value="">-- Whole course --</option>`;

    if (!courseId) return;

    const result = await apiGet("/api/courses/" + courseId);

    if (!result.success) return;

    let optionsHtml = `<option value="">-- Whole course --</option>`;

    for (const chapter of result.data.chapters) {
        optionsHtml += `<option value="${chapter.chapterId}">${escapeHtml(chapter.title)}</option>`;
    }

    chapterSelect.innerHTML = optionsHtml;
}

//                               ask question                               //

document.getElementById("askForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const courseValue = document.getElementById("qnaCourse").value;
    const chapterValue = document.getElementById("qnaChapter").value;

    if (!courseValue) {
        showAlert("pageAlert", "Please pick a course first.", "danger");
        return;
    }

    const body = {
        courseId: Number(courseValue),
        chapterId: chapterValue ? Number(chapterValue) : null,
        questionText: document.getElementById("qnaQuestion").value
    };

    // DATA FLOW: body -> JSON -> POST /api/qna -> QnaController.AskQuestion
    const result = await apiPost("/api/qna", body);

    if (result.success) {
        showAlert("pageAlert", result.message, "success");
        document.getElementById("qnaQuestion").value = "";
        await loadHistory();
    } else {
        showAlert("pageAlert", result.message, "danger");
    }
});

//                               my question history                               //

async function loadHistory() {
    const result = await apiGet("/api/qna/my");

    const historyList = document.getElementById("historyList");

    if (!result.success || result.data.length === 0) {
        historyList.innerHTML = `<p>You have not asked any questions yet.</p>`;
        return;
    }

    let html = "";

    for (const q of result.data) {

        //          every question links back to its course          //

        const chapterText = q.chapterTitle ? " - Chapter: " + escapeHtml(q.chapterTitle) : "";
        const askedOn = new Date(q.askedAt).toLocaleString();

        const answerHtml = q.answerText
            ? `<p><b>Instructor reply:</b> ${escapeHtml(q.answerText)}</p>`
            : `<p><i>No reply yet.</i></p>`;

        html += `
            <div class="border-glow-card mb-3">
                <p>Course: <a href="/Course?id=${q.courseId}">${escapeHtml(q.courseTitle)}</a>${chapterText}</p>
                <p><b>My question (${askedOn}):</b> ${escapeHtml(q.questionText)}</p>
                ${answerHtml}
            </div>`;
    }

    historyList.innerHTML = html;
}
