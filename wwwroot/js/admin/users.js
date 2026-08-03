//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Admin");

    if (!user) return;

    renderNavbar(user, "/Admin/Users");

    await loadUsers();

    // When the dropdown changes, re-fetch the table with the new role
    document.getElementById("userListRole").addEventListener("change", loadUsers);
});




//                               load dropdowns                               //

async function loadDropdowns() {
    // Two GETs fill two <select> elements.
    const students = await apiGet("/api/users?role=Student");
    const courses = await apiGet("/api/courses");

    let studentOptions = `<option value="">-- Select a student --</option>`;

    if (students.success) {
        for (const student of students.data) {
            // value = the id the API needs; text = the name the human sees
            studentOptions += `<option value="${escapeHtml(student.id)}">${escapeHtml(student.firstName + " " + student.lastName)}</option>`;
        }
    }

    document.getElementById("assignStudent").innerHTML = studentOptions;

    let courseOptions = `<option value="">-- Select a course --</option>`;

    if (courses.success) {
        for (const course of courses.data) {
            courseOptions += `<option value="${course.courseId}">${escapeHtml(course.title)}</option>`;
        }
    }

    document.getElementById("assignCourse").innerHTML = courseOptions;
}






//                               load users table                               //

async function loadUsers() {
    // 1. Read which role is selected in the dropdown
    const role = document.getElementById("userListRole").value;

    // 2. DATA FLOW: GET /api/users?role=Student -> UserController ->
    //    { success, data: [ { id, firstName, lastName, email, role }, ... ] }
    const result = await apiGet("/api/users?role=" + role);

    const tableBody = document.getElementById("usersTableBody");

    if (!result.success || result.data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3">No users found.</td></tr>`;
        return;
    }

    // 3. Build one <tr> string per user object
    let rowsHtml = "";

    for (const user of result.data) {
        rowsHtml += `
            <tr>
                <td>${escapeHtml(user.firstName + " " + user.lastName)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.role)}</td>
            </tr>`;
    }

    // 4. Inject all rows at once into the tbody
    tableBody.innerHTML = rowsHtml;
}
