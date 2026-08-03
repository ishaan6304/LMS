//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Instructor");

    if (!user) return;

    renderNavbar(user, "/Instructor/Courses");

    await loadCategoryDropdown();
});

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

//          no instructorId in the body - the server reads MY id          //
//          from the auth cookie (CurrentUserId in the controller)          //

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
        language: document.getElementById("courseLanguage").value
    };

    // DATA FLOW: body -> JSON -> POST /api/courses -> CourseController.CreateCourse
    const result = await apiPost("/api/courses", body);

    if (result.success) {
        alert(result.message);
        window.location.href = "/Instructor/Courses";
    } else {
        showAlert("courseAlert", result.message, "danger");
    }
});
