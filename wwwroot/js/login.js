//                               login                               //

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value
    };

    const result = await apiPost("/api/auth/login", body);

    if (!result.success) {
        const alertBox = document.getElementById("loginAlert");
        alertBox.className = "alert alert-danger";
        alertBox.textContent = result.message;
        return;
    }

    const role = result.data;

    if (role === "Admin") {
        window.location.href = "/admin/dashboard.html";
    }
    else if (role === "Instructor") {
        window.location.href = "/instructor/dashboard.html";
    }
    else if (role === "Student") {
        window.location.href = "/student/dashboard.html";
    }
    else {
        // custom roles have no dashboard yet -> go to profile
        window.location.href = "/profile.html";
    }
});