//                               reset password                               //

const params = new URLSearchParams(window.location.search);
const email = params.get("email");
const token = params.get("token");

document.getElementById("resetForm").addEventListener("submit", async function (event) {

    event.preventDefault();

    const result = await apiPost("/api/auth/reset-password", {
        email: email,
        token: token,
        newPassword: document.getElementById("newPassword").value
    });

    if (!result.success) {
        const message = result.errors ? result.errors.join(" ") : result.message;
        showAlert("pageAlert", message, "danger");
        return;
    }

    showAlert("pageAlert", result.message + " Redirecting...", "success");
    setTimeout(function () { window.location.href = "/index.html"; }, 2000);
});