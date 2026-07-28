//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Instructor");

    if (!user) return;

    renderNavbar(user, "/instructor/courses.html");

    await loadCourses();

    //          live search: re-fetch whenever the instructor types          //

    document.getElementById("courseSearch").addEventListener("input", async function () {
        await loadCourses(this.value.trim());
    });
});

//                               load my courses                               //

async function loadCourses(searchTerm) {
    // DATA FLOW: GET /api/courses?search=... -> instructor only gets THEIR courses
    let url = "/api/courses";

    if (searchTerm) {
        url += "?search=" + encodeURIComponent(searchTerm);
    }

    const result = await apiGet(url);

    const coursesList = document.getElementById("coursesList");

    if (!result.success || result.data.length === 0) {
        coursesList.innerHTML = `<p class="text-muted">No courses found.</p>`;
        return;
    }

    let cardsHtml = "";

    for (const course of result.data) {

        //          disabled = soft deleted; only an ADMIN can re-enable it          //

        const statusBadge = course.isActive
            ? ""
            : `<span class="badge bg-secondary ms-2">Disabled</span>`;

        const disableButton = course.isActive
            ? `<button class="btn btn-outline-danger btn-sm" onclick="disableCourse(${course.courseId})">Disable</button>`
            : `<small class="text-muted align-self-center">Ask an admin to re-enable</small>`;

        cardsHtml += `
            <div class="card border-glow-card mb-3 ${course.isActive ? "" : "opacity-75"}">
                <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">${escapeHtml(course.title)}${statusBadge}</h6>
                        <small class="text-muted">${escapeHtml(course.category)} \u2022 ${escapeHtml(course.level)} \u2022 ${escapeHtml(course.language)} \u2022 ${course.chapterCount} chapter(s)</small>
                    </div>
                    <div class="d-flex gap-2">
                        <a class="btn btn-outline-primary btn-sm" href="/manage-course.html?id=${course.courseId}">Manage / Edit</a>
                        ${disableButton}
                    </div>
                </div>
            </div>`;
    }

    coursesList.innerHTML = cardsHtml;
}

//                               disable course (soft delete)                               //

async function disableCourse(courseId) {
    if (!confirm("Disable this course? Students will no longer see it. Only an admin can re-enable it.")) return;

    const result = await apiDelete("/api/courses/" + courseId);

    if (!result.success) {
        alert(result.message);
        return;
    }

    await loadCourses(document.getElementById("courseSearch").value.trim());
}
