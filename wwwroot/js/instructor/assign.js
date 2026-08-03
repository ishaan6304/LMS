//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Instructor");

    if (!user) return;

    renderNavbar(user, "/Instructor/Assign");

    await loadDropdowns();
});

//                               load dropdowns                               //

async function loadDropdowns() {
    const students = await apiGet("/api/users?role=Student");
    const courses = await apiGet("/api/courses");   // server returns only MY courses

    let studentOptions = `<option value="">-- Select a student --</option>`;

    if (students.success) {
        for (const student of students.data) {
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

//                               assign course                               //

document.getElementById("assignForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        studentId: document.getElementById("assignStudent").value,
        courseId: Number(document.getElementById("assignCourse").value)
    };

    if (!body.studentId || !body.courseId) {
        showAlert("assignAlert", "Please select a student and a course.", "warning");
        return;
    }

    const result = await apiPost("/api/enrollments", body);

    if (result.success) {
        showAlert("assignAlert", result.message, "success");
        this.reset();
    } else {
        showAlert("assignAlert", result.message, "danger");
    }
});
