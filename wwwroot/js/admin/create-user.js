//                               page load                               //


window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Admin");

    if (!user) return;

    await renderNavbar(user, "/Admin/Users");
    await loadDropdowns();
});
//           render roles

async function loadDropdowns() {

    const roles = await apiGet("/api/roles");

    let roleOptions = `<option value="">-- Select a role --</option>`;

    if (roles.success) {
        for (const role of roles.data) {
            roleOptions += `
                <option value="${escapeHtml(role)}">
                    ${escapeHtml(role)}
                </option>`;
        }
    }

    document.getElementById("userRole").innerHTML = roleOptions;
}




//                               create user                               //

document.getElementById("createUserForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // 1. Read every input by its id -> build the request body object.
    //    Property names must match the C# CreateUserRequest DTO (camelCase).
    const body = {
        firstName: document.getElementById("userFirstName").value,
        lastName: document.getElementById("userLastName").value,
        email: document.getElementById("userEmail").value,
        password: document.getElementById("userPassword").value,
        role: document.getElementById("userRole").value
    };

    // 2. DATA FLOW: body -> JSON -> POST /api/users -> UserController.CreateUser
    const result = await apiPost("/api/users", body);

    if (result.success) {
        alert(result.message);
        window.location.href = "/Admin/Users";
    } else {
        const errorText = result.errors && result.errors.length > 0 ? result.errors.join(" ") : result.message;
        showAlert("userAlert", errorText, "danger");
    }
});


