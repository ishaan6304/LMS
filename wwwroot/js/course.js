//                               page load                               //

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

let currentUser = null;

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();

    if (!user) return;

    currentUser = user;

    renderNavbar(user, "");

    await loadCourse();
});

//                               load course                               //

async function loadCourse() {
    // DATA FLOW: GET /api/courses/5 -> { success, data: { title, ..., isActive,
    //   myEnrollmentStatus (null = auditing | "Pending" | "Active" | "Completed"), chapters } }
    const result = await apiGet("/api/courses/" + courseId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    const course = result.data;

    document.getElementById("courseTitle").textContent = course.title;
    document.getElementById("courseMeta").textContent = "By " + course.instructorName + " \u2022 " + course.category + " \u2022 " + course.level + " \u2022 " + course.language;
    document.getElementById("courseDescription").textContent = course.description;

    renderEnrollArea(course);

    //          students can only track progress when actually enrolled          //

    const isEnrolled = course.myEnrollmentStatus === "Active" || course.myEnrollmentStatus === "Completed";

    const accordion = document.getElementById("chaptersAccordion");

    if (course.chapters.length === 0) {
        accordion.innerHTML = `<p class="text-muted">No chapters added to this course yet.</p>`;
        return;
    }

    let accordionHtml = "";
    let isFirst = true;

    for (const chapter of course.chapters) {
        let contentsHtml = "";

        for (const content of chapter.contents) {

            const completeButton = (currentUser.role === "Student" && isEnrolled)
                ? `<button class="btn btn-sm ${content.isCompleted ? "btn-success" : "btn-outline-success"} ms-2"
                       onclick="toggleProgress(${content.chapterContentId})">
                       ${content.isCompleted ? "\u2714 Completed" : "Mark complete"}
                   </button>`
                : "";

            if (content.contentType === "Video") {
                contentsHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                            <strong>\uD83C\uDFAC ${escapeHtml(content.title)}</strong>
                            ${completeButton}
                        </div>
                        <div class="ratio ratio-16x9" style="max-width: 480px;">
                            <iframe src="${escapeHtml(getYoutubeEmbedUrl(content.contentUrl))}" title="${escapeHtml(content.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>`;
            } else {
                contentsHtml += `
                    <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                        <a href="${escapeHtml(content.contentUrl)}" target="_blank">\uD83D\uDCC4 ${escapeHtml(content.title)}</a>
                        ${completeButton}
                    </div>`;
            }
        }

        if (chapter.contents.length === 0) {
            contentsHtml = `<div class="list-group-item text-muted">No content added to this chapter yet.</div>`;
        }

        accordionHtml += `
            <div class="accordion-item border-glow-card">
                <h2 class="accordion-header">
                    <button class="accordion-button ${isFirst ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#chapter-${chapter.chapterId}">
                        Chapter ${chapter.displayOrder}: ${escapeHtml(chapter.title)}
                    </button>
                </h2>
                <div id="chapter-${chapter.chapterId}" class="accordion-collapse collapse ${isFirst ? "show" : ""}" data-bs-parent="#chaptersAccordion">
                    <div class="accordion-body p-0">
                        <div class="list-group list-group-flush">${contentsHtml}</div>
                    </div>
                </div>
            </div>`;

        isFirst = false;
    }

    accordion.innerHTML = accordionHtml;
}

//                               enroll area                               //

function renderEnrollArea(course) {
    const enrollArea = document.getElementById("enrollArea");

    //          only students see the enroll area          //

    if (currentUser.role !== "Student") {
        enrollArea.innerHTML = course.isActive
            ? ""
            : `<span class="badge bg-secondary">Disabled</span>`;
        return;
    }

    if (course.myEnrollmentStatus === "Active") {
        enrollArea.innerHTML = `<span class="badge bg-success">Enrolled</span> <small class="text-muted ms-2">Your progress is being tracked.</small>`;
    }
    else if (course.myEnrollmentStatus === "Completed") {
        enrollArea.innerHTML = `<span class="badge bg-primary">Completed</span>`;
    }
    else if (course.myEnrollmentStatus === "Pending") {
        enrollArea.innerHTML = `<span class="badge bg-warning text-dark">Request Pending</span> <small class="text-muted ms-2">Waiting for instructor approval. You can audit the course meanwhile.</small>`;
    }
    else {
        //          auditing: can watch everything, but no progress / certificate          //

        enrollArea.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="requestEnroll()">Request Enroll</button>
            <small class="text-muted ms-2">You are auditing this course. Enroll to track progress and earn a certificate later.</small>`;
    }
}

//                               request enroll                               //

async function requestEnroll() {
    const result = await apiPost("/api/enrollments/request", { courseId: Number(courseId) });

    showAlert("pageAlert", result.message, result.success ? "success" : "danger");

    await loadCourse();
}

//                               toggle progress                               //

async function toggleProgress(contentId) {
    const result = await apiPost("/api/progress/content/" + contentId + "/toggle", {});

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    await loadCourse();
}