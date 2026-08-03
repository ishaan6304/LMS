//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();   // any logged-in role

    if (!user) return;

    renderNavbar(user, "/Profile");

    // Prefill: API object -> input values (the reverse of a form submit)
    document.getElementById("profileEmail").value = user.email;
    document.getElementById("profileFirstName").value = user.firstName;
    document.getElementById("profileLastName").value = user.lastName;
});

//                               save profile                               //

document.getElementById("profileForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        firstName: document.getElementById("profileFirstName").value,
        lastName: document.getElementById("profileLastName").value
    };

    const result = await apiPut("/api/auth/profile", body);

    if (result.success) {
        showAlert("profileAlert", result.message, "success");
    } else {
        showAlert("profileAlert", result.message, "danger");
    }
});

//                               change password                               //

document.getElementById("passwordForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        currentPassword: document.getElementById("currentPassword").value,
        newPassword: document.getElementById("newPassword").value
    };

    const result = await apiPost("/api/auth/change-password", body);

    if (result.success) {
        showAlert("passwordAlert", result.message, "success");
        this.reset();
    } else {
        const errorText = result.errors && result.errors.length > 0 ? result.errors.join(" ") : result.message;
        showAlert("passwordAlert", errorText, "danger");
    }
});
