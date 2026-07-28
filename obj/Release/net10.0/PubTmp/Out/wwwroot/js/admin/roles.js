//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Admin");

    if (!user) return;

    renderNavbar(user, "/admin/dashboard.html");

    await loadRoles();
});

//                               load roles                               //

async function loadRoles() {
    const result = await apiGet("/api/roles");

    const rolesList = document.getElementById("rolesList");

    if (!result.success || result.data.length === 0) {
        rolesList.innerHTML = `<p class="text-muted">No roles found.</p>`;
        return;
    }

    let itemsHtml = "";

    for (const roleName of result.data) {
        // each role gets its own small BorderGlow card
        itemsHtml += `<div class="border-glow-card chip">\uD83D\uDEE1\uFE0F ${escapeHtml(roleName)}</div>`;
    }

    rolesList.innerHTML = itemsHtml;
}

//                               create role                               //

document.getElementById("createRoleForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        name: document.getElementById("roleName").value
    };

    // DATA FLOW: body -> JSON -> POST /api/roles -> RolesController.CreateRole
    const result = await apiPost("/api/roles", body);

    if (result.success) {
        showAlert("pageAlert", result.message, "success");
        document.getElementById("roleName").value = "";
        await loadRoles();
    } else {
        showAlert("pageAlert", result.message, "danger");
    }
});
