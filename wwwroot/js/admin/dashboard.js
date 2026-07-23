//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    // 1. Who is logged in? (cookie -> /api/auth/me). Redirects if not Admin.
    const user = await requireLogin("Admin");

    if (!user) return;

    // 2. Build the navbar into <div id="navbar">
    renderNavbar(user, "/admin/dashboard.html");

    // 3. Put the user's name into the page
    document.getElementById("welcomeText").textContent = "Welcome back, " + user.firstName;

    // 4. Fetch the numbers
    await loadDashboard();
});

//                               load dashboard stats                               //

async function loadDashboard() {
    // DATA FLOW: GET /api/dashboard/admin -> DashboardController -> DashboardService
    // returns { success, data: { totalStudents, totalInstructors, totalCourses } }
    const result = await apiGet("/api/dashboard/admin");

    if (!result.success) return;

    // JSON property names are camelCase versions of the C# DTO properties
    document.getElementById("statStudents").textContent = result.data.totalStudents;
    document.getElementById("statInstructors").textContent = result.data.totalInstructors;
    document.getElementById("statCourses").textContent = result.data.totalCourses;
}
