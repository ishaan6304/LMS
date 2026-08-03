//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Student");

    if (!user) return;

    renderNavbar(user, "/Student/Dashboard");

    document.getElementById("welcomeText").textContent = "Welcome back, " + user.firstName;

    await Promise.all([loadDashboard(), loadMyCourses()]);
});

//                               load dashboard stats                               //

async function loadDashboard() {
    const result = await apiGet("/api/dashboard/student");

    if (!result.success) return;

    document.getElementById("statEnrolled").textContent = result.data.enrolledCourses;
}

//                               load my courses                               //

async function loadMyCourses() {
    // DATA FLOW: GET /api/enrollments/my -> EnrollmentController -> EnrollmentService.GetMyCoursesAsync
    // returns { success, data: [ MyCourseDto ] } where MyCourseDto (C#) becomes camelCase JSON:
    // { courseId, title, shortDescription, instructorName, chapterCount, status, progressPercentage, thumbnailUrl }
    const result = await apiGet("/api/enrollments/my");

    const courseCards = document.getElementById("courseCards");

    if (!result.success || result.data.length === 0) {
        courseCards.innerHTML = `<p>No courses have been assigned to you yet.</p>`;
        return;
    }

    let html = "";

    for (const course of result.data) {
        // progressPercentage was CALCULATED live on the server:
        // completed contents / total contents * 100
        html += `
            <div class="border-glow-card mb-3">
                <img class="thumimg" src="${course.thumbnailUrl}" />
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.shortDescription || "")}</p>
                <p>By ${escapeHtml(course.instructorName)} - ${course.chapterCount} chapters - Status: ${escapeHtml(course.status)}</p>
                <p>Progress: ${course.progressPercentage}%</p>
                <a class="btn btn-success btn-sm" href="/Course?id=${course.courseId}">Continue Learning</a>
            </div>
            `;
    }

    courseCards.innerHTML = html;
}
