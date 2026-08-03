//                               page load                               //

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();

    if (!user) return;

    if (user.role !== "Admin" && user.role !== "Instructor") {
        window.location.href = "/";
        return;
    }

    renderNavbar(user, "");

    await Promise.all([loadCourse(), loadEnrollments()]);
});

//                               load course                               //

async function loadCourse() {
    const result = await apiGet("/api/courses/" + courseId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    const course = result.data;

    document.getElementById("courseTitle").textContent = "Manage: " + course.title;

    const leaf = document.querySelector(".breadcrumbs .crumb-current");
    if (leaf) leaf.textContent = course.title;
    document.getElementById("courseMeta").textContent = "By " + course.instructorName + " - " + course.category + " - " + course.level + " - " + course.language;

    // Prefill the edit form: API data -> input .value (opposite direction of a submit)
    document.getElementById("editTitle").value = course.title;
    document.getElementById("editDescription").value = course.description;
    document.getElementById("editThumbnail").value = course.thumbnailUrl || "";
    await loadCategoryDropdown(course.category);
    document.getElementById("editLevel").value = course.level;
    document.getElementById("editLanguage").value = course.language;

    const chaptersList = document.getElementById("chaptersList");

    if (course.chapters.length === 0) {
        chaptersList.innerHTML = `<p class="text-muted">No chapters yet. Add your first chapter above.</p>`;
        return;
    }

    let html = "";

    for (const chapter of course.chapters) {
        // one BorderGlow card per chapter: header row, content rows, add-content row
        html += `
            <div class="border-glow-card mb-3">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h3 class="mb-0 mt-0">Chapter ${chapter.displayOrder}: ${escapeHtml(chapter.title)}</h3>
                    <button class="btn-sm danger" onclick="deleteChapter(${chapter.chapterId})">Delete Chapter</button>
                </div>`;

        if (chapter.contents.length === 0) {
            html += `<p class="text-muted">No content in this chapter yet.</p>`;
        }

        for (const content of chapter.contents) {
            // IMPORTANT: the id field is chapterContentId (the DTO property name),
            // NOT contentId - using the wrong name here was the original delete bug!
            html += `
                <div class="content-row d-flex justify-content-between align-items-center gap-2">
                    <span><span class="badge">${escapeHtml(content.contentType)}</span> ${escapeHtml(content.title)}</span>
                    <button class="btn-sm danger" onclick="deleteContent(${content.chapterContentId})">Delete</button>
                </div>`;
        }

        // Inline add-content inputs. Each chapter gets UNIQUE ids by putting
        // the chapterId into the id string: contentTitle-4, contentTitle-7 ...
        html += `
                <div class="add-content-row d-flex flex-wrap gap-2 align-items-center mt-3">
                    <input type="text" id="contentTitle-${chapter.chapterId}" placeholder="Content title" />
                    <select id="contentType-${chapter.chapterId}">
                        <option>Video</option>
                        <option>Assignment</option>
                    </select>
                    <input type="url" id="contentUrl-${chapter.chapterId}" placeholder="YouTube or assignment link" />
                    <button onclick="addContent(${chapter.chapterId})">Add Content</button>
                </div>
            </div>`;
    }

    chaptersList.innerHTML = html;
}

//                               edit course                               //

document.getElementById("editCourseForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Must match the C# UpdateCourseRequest DTO
    const body = {
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDescription").value,
        thumbnailUrl: document.getElementById("editThumbnail").value,
        category: document.getElementById("editCategory").value,
        level: document.getElementById("editLevel").value,
        language: document.getElementById("editLanguage").value
    };

    const result = await apiPut("/api/courses/" + courseId, body);

    if (result.success) {
        showAlert("editAlert", result.message, "success");
        await loadCourse();
    } else {
        showAlert("editAlert", result.message, "danger");
    }
});

//                               add chapter                               //

document.getElementById("addChapterForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = { title: document.getElementById("chapterTitle").value };

    const result = await apiPost("/api/courses/" + courseId + "/chapters", body);

    if (result.success) {
        this.reset();
        await loadCourse();
    } else {
        showAlert("pageAlert", result.message, "danger");
    }
});

//                               add content                               //

async function addContent(chapterId) {
    // Read the three inputs that belong to THIS chapter (ids end with the chapterId)
    const body = {
        title: document.getElementById("contentTitle-" + chapterId).value,
        contentType: document.getElementById("contentType-" + chapterId).value,
        contentUrl: document.getElementById("contentUrl-" + chapterId).value
    };

    if (!body.title || !body.contentUrl) {
        showAlert("pageAlert", "Please fill in the content title and link.", "warning");
        return;
    }

    const result = await apiPost("/api/chapters/" + chapterId + "/contents", body);

    if (result.success) {
        await loadCourse();
    } else {
        showAlert("pageAlert", result.message, "danger");
    }
}

//                               delete chapter                               //

async function deleteChapter(chapterId) {
    if (!(await showConfirm("Delete this chapter and all its content?", "Delete Chapter", "Delete", true))) return;

    const result = await apiDelete("/api/chapters/" + chapterId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    await loadCourse();
}

//                               delete content                               //

async function deleteContent(contentId) {
    if (!(await showConfirm("Delete this content?", "Delete Content", "Delete", true))) return;

    const result = await apiDelete("/api/chapters/contents/" + contentId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    await loadCourse();
}

//                               enrolled students                               //

async function loadEnrollments() {
    // DATA FLOW: GET /api/enrollments/course/5 ->
    // { success, data: [ { enrollmentId, fullName, email, progressPercentage } ] }
    const result = await apiGet("/api/enrollments/course/" + courseId);

    const tableBody = document.getElementById("enrolledTableBody");

    if (!result.success || result.data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">No students enrolled yet.</td></tr>`;
        return;
    }

    let rowsHtml = "";

    for (const student of result.data) {
        rowsHtml += `
            <tr>
                <td>${escapeHtml(student.studentName)}</td>
                <td>${escapeHtml(student.email)}</td>
                <td>${student.progressPercentage}%</td>
                <td class="text-end"><button class="btn-sm danger" onclick="removeStudent(${student.enrollmentId})">Remove</button></td>
            </tr>`;
    }

    tableBody.innerHTML = rowsHtml;
}

//                               remove student                               //

async function removeStudent(enrollmentId) {
    if (!(await showConfirm("Remove this student from the course?", "Remove Student", "Remove", true))) return;

    const result = await apiDelete("/api/enrollments/" + enrollmentId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    await loadEnrollments();
}

//                               load category dropdown                               //

//          categories are dynamic now (admin can add new ones),          //
//          so the dropdown is filled from GET /api/categories          //

async function loadCategoryDropdown(selectedName) {
    const result = await apiGet("/api/categories");

    const categorySelect = document.getElementById("editCategory");

    if (!result.success) {
        categorySelect.value = selectedName;
        return;
    }

    let optionsHtml = "";

    for (const category of result.data) {
        optionsHtml += `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`;
    }

    categorySelect.innerHTML = optionsHtml;
    categorySelect.value = selectedName;
}
