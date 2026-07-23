//                               forgot password                               //

document.getElementById("forgotForm").addEventListener("submit", async function (event) {

    event.preventDefault();

    const result = await apiPost("/api/auth/forgot-password", {
        email: document.getElementById("forgotEmail").value
    });

    showAlert("pageAlert", result.message, "success");
    this.reset();
});