//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Instructor");

    if (!user) return;

    renderNavbar(user, "/instructor/dashboard.html");

    document.getElementById("welcomeText").textContent = "Welcome back, " + user.firstName;

    await loadDashboard();
});

//                               load dashboard stats                               //

async function loadDashboard() {
    // DATA FLOW: GET /api/dashboard/instructor ->
    // { success, data: { totalCourses, totalStudentsEnrolled, courseStats: [ { courseId, title, studentCount } ] } }
    const result = await apiGet("/api/dashboard/instructor");

    if (!result.success) return;

    document.getElementById("statMyCourses").textContent = result.data.totalCourses;
    document.getElementById("statMyStudents").textContent = result.data.totalStudentsEnrolled;

    const tableBody = document.getElementById("statsTableBody");

    if (result.data.courseStats.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2">You have not created any courses yet.</td></tr>`;
        return;
    }

    let rowsHtml = "";

    for (const c of result.data.courseStats) {
        rowsHtml += `
            <tr>
                <td><a href="/manage-course.html?id=${c.courseId}">${escapeHtml(c.title)}</a></td>
                <td>${c.studentCount}</td>
            </tr>`;
    }

    tableBody.innerHTML = rowsHtml;
}
