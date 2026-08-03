//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Admin");

    if (!user) return;

    renderNavbar(user, "/Admin/Courses");

    await loadInstructorDropdown();
    await loadCategoryDropdown();
});

//                               load instructor dropdown                               //



async function loadInstructorDropdown() {
    const instructors = await apiGet("/api/users?role=Instructor");

    const instructorSelect = document.getElementById("courseInstructor");
    let optionsHtml = `<option value="">-- Select an instructor --</option>`;

    if (instructors.success) {
        for (const instructor of instructors.data) {
            optionsHtml += `<option value="${escapeHtml(instructor.id)}">${escapeHtml(instructor.firstName + " " + instructor.lastName)}</option>`;
        }
    }

    instructorSelect.innerHTML = optionsHtml;
}

//                               load category dropdown                               //

async function loadCategoryDropdown() {
    const result = await apiGet("/api/categories");

    const categorySelect = document.getElementById("courseCategory");
    let optionsHtml = "";

    if (result.success) {
        for (const category of result.data) {
            optionsHtml += `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`;
        }
    }

    categorySelect.innerHTML = optionsHtml;
}

//                               create course                               //

document.getElementById("createCourseForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        title: document.getElementById("courseTitle").value,
        shortDescription: document.getElementById("courseShortDescription").value,
        description: document.getElementById("courseDescription").value,
        thumbnailUrl: document.getElementById("courseThumbnailUrl").value,
        price: Number(document.getElementById("coursePrice").value || 0),
        durationHours: Number(document.getElementById("courseDurationHours").value || 0),
        category: document.getElementById("courseCategory").value,
        level: document.getElementById("courseLevel").value,
        language: document.getElementById("courseLanguage").value,
        instructorId: document.getElementById("courseInstructor").value
    };

    // DATA FLOW: body -> JSON -> POST /api/courses -> CourseController.CreateCourse
    const result = await apiPost("/api/courses", body);

    if (result.success) {
        alert(result.message);
        window.location.href = "/Admin/Courses";
    } else {
        showAlert("courseAlert", result.message, "danger");
    }
});
