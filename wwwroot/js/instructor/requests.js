//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();

    if (!user) return;

    //          instructors and admins can both review requests          //

    if (user.role !== "Instructor" && user.role !== "Admin") {
        window.location.href = "/index.html";
        return;
    }

    renderNavbar(user, "/instructor/requests.html");

    await loadRequests();
});

//                               load requests                               //

async function loadRequests() {
    // DATA FLOW: GET /api/enrollments/requests ->
    // { success, data: [ { enrollmentId, studentName, studentEmail, courseTitle, requestedOn } ] }
    // The server already filters: instructors only get requests for THEIR courses.
    const result = await apiGet("/api/enrollments/requests");

    const tableBody = document.getElementById("requestsTableBody");

    if (!result.success || result.data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">No pending requests.</td></tr>`;
        return;
    }

    let rowsHtml = "";

    for (const request of result.data) {
        const requestedDate = new Date(request.requestedOn).toLocaleDateString();

        rowsHtml += `
            <tr>
                <td>${escapeHtml(request.studentName)}</td>
                <td>${escapeHtml(request.studentEmail)}</td>
                <td>${escapeHtml(request.courseTitle)}</td>
                <td>${requestedDate}</td>
                <td class="text-end">
                    <button class="btn btn-success btn-sm" onclick="approveRequest(${request.enrollmentId})">Approve</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="rejectRequest(${request.enrollmentId})">Reject</button>
                </td>
            </tr>`;
    }

    tableBody.innerHTML = rowsHtml;
}

//                               approve                               //

async function approveRequest(enrollmentId) {
    // DATA FLOW: POST /api/enrollments/requests/12/approve ->
    // flips Status Pending -> Active + sends the student an email
    const result = await apiPost("/api/enrollments/requests/" + enrollmentId + "/approve", {});

    showAlert("pageAlert", result.message, result.success ? "success" : "danger");

    await loadRequests();
}

//                               reject                               //

async function rejectRequest(enrollmentId) {
    if (!confirm("Reject this enrollment request?")) return;

    const result = await apiPost("/api/enrollments/requests/" + enrollmentId + "/reject", {});

    showAlert("pageAlert", result.message, result.success ? "success" : "danger");

    await loadRequests();
}