//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Student");

    if (!user) return;

    renderNavbar(user, "/student/catalog.html");

    await loadCatalog();

    //          live search: re-fetch whenever the user types          //

    document.getElementById("catalogSearch").addEventListener("input", async function () {
        await loadCatalog(this.value.trim());
    });
});

//                               load catalog                               //

async function loadCatalog(searchTerm) {
    // DATA FLOW: GET /api/courses/catalog?search=... ->
    // { success, data: [ { courseId, title, shortDescription, instructorName,
    //   chapterCount, enrollmentStatus (null | "Pending" | "Active" | "Completed") } ] }
    let url = "/api/courses/catalog";

    if (searchTerm) {
        url += "?search=" + encodeURIComponent(searchTerm);
    }

    const result = await apiGet(url);

    const cardsContainer = document.getElementById("catalogCards");

    if (!result.success || result.data.length === 0) {
        cardsContainer.innerHTML = `<p class="text-muted">No courses found.</p>`;
        return;
    }

    let cardsHtml = "";

    for (const course of result.data) {
        cardsHtml += `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card border-glow-card h-100">
                    ${course.thumbnailUrl ? `<img src="${escapeHtml(course.thumbnailUrl)}" class="card-img-top course-thumbnail" alt="" />` : ""}
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="fw-semibold mb-0">${escapeHtml(course.title)}</h6>
                            ${statusBadge(course.enrollmentStatus)}
                        </div>
                        <p class="text-muted small mb-2">${escapeHtml(course.shortDescription || "")}</p>
                        <small class="text-muted mb-3">By ${escapeHtml(course.instructorName)} \u2022 ${escapeHtml(course.category)} \u2022 ${escapeHtml(course.level)} \u2022 ${course.chapterCount} chapter(s)</small>
                        <div class="mt-auto d-flex gap-2">
                            <a class="btn btn-outline-primary btn-sm" href="/course.html?id=${course.courseId}">View / Audit</a>
                            ${enrollButton(course)}
                        </div>
                    </div>
                </div>
            </div>`;
    }

    cardsContainer.innerHTML = cardsHtml;
}

//                               status badge                               //

function statusBadge(status) {
    if (status === "Active" || status === "Completed") {
        return `<span class="badge bg-success">Enrolled</span>`;
    }

    if (status === "Pending") {
        return `<span class="badge bg-warning text-dark">Pending</span>`;
    }

    return "";
}

//                               enroll button                               //

function enrollButton(course) {
    if (course.enrollmentStatus === "Active" || course.enrollmentStatus === "Completed") {
        return `<a class="btn btn-success btn-sm" href="/course.html?id=${course.courseId}">Continue Learning</a>`;
    }

    if (course.enrollmentStatus === "Pending") {
        return `<button class="btn btn-secondary btn-sm" disabled>Request Pending</button>`;
    }

    return `<button class="btn btn-primary btn-sm" onclick="requestEnroll(${course.courseId})">Request Enroll</button>`;
}

//                               request enroll                               //

async function requestEnroll(courseId) {
    const result = await apiPost("/api/enrollments/request", { courseId: courseId });

    if (result.success) {
        showAlert("pageAlert", result.message, "success");
    } else {
        showAlert("pageAlert", result.message, "danger");
    }

    // re-render so the button flips to "Request Pending"
    await loadCatalog(document.getElementById("catalogSearch").value.trim());
}