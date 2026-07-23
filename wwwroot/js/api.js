//                               csrf token                               //
let csrfToken = null;

async function getCsrfToken() {
    if (csrfToken) return csrfToken;

    const response = await fetch("/api/auth/csrf-token");
    const result = await response.json();

    csrfToken = result.data.token;
    return csrfToken;
}

//                               api helpers                               //

async function apiGet(url) {
    const response = await fetch(url);
    return await readResponse(response);
}

async function apiPost(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": await getCsrfToken()
        },
        body: JSON.stringify(body)
    });
    return await readResponse(response);
}

async function apiPut(url, body) {
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": await getCsrfToken()
        },
        body: JSON.stringify(body)
    });
    return await readResponse(response);
}

async function apiDelete(url) {
    const response = await fetch(url, {
        method: "DELETE",
        headers: { "X-CSRF-TOKEN": await getCsrfToken() }
    });
    return await readResponse(response);
}

async function readResponse(response) {
    try {
        return await response.json();
    }
    catch {
        return { success: false, message: "Request failed. Please try again." };
    }
}

//                               login check                               //

async function requireLogin(expectedRole) {
    const result = await apiGet("/api/auth/me");

    if (!result.success) {
        window.location.href = "/index.html";
        return null;
    }

    const user = result.data;

    if (expectedRole && user.role !== expectedRole) {
        window.location.href = "/index.html";
        return null;
    }

    return user;
}

//                               logout                               //

async function logout() {
    await apiPost("/api/auth/logout", {});
    csrfToken = null;
    window.location.href = "/index.html";
}

//                               navbar                               //

function renderNavbar(user, activePage) {
    const linksByRole = {
        Admin: [
            ["/admin/dashboard.html", "Dashboard"],
            ["/admin/users.html", "Users"],
            ["/admin/courses.html", "Courses"],
            ["/admin/assign.html", "Assign"]
        ],
        Instructor: [
            ["/instructor/dashboard.html", "Dashboard"],
            ["/instructor/courses.html", "My Courses"],
            ["/instructor/requests.html", "Requests"],
            ["/instructor/qna.html", "Q&A"],
            ["/instructor/assign.html", "Assign"]
        ],
        Student: [
            ["/student/dashboard.html", "Dashboard"],
            ["/student/catalog.html", "Browse Courses"],
            ["/student/qna.html", "Q&A"]
        ]
    };

    const links = linksByRole[user.role] || [];

    let linksHtml = "";

    for (const link of links) {
        const href = link[0];
        const label = link[1];
        const active = href === activePage ? " active" : "";

        linksHtml += `<li class="nav-item"><a class="nav-link${active}" href="${href}">${label}</a></li>`;
    }

    const profileActive = activePage === "/profile.html" ? " active" : "";

    document.getElementById("navbar").innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark navbar-lms shadow-sm">
            <div class="container">
                <a class="navbar-brand fw-semibold" >\uD83D\uDCDA PaceLMS</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarMain">
                    <ul class="navbar-nav me-auto">
                        ${linksHtml}
                        <li class="nav-item"><a class="nav-link${profileActive}" href="/profile.html">My Profile</a></li>
                    </ul>
                    <span class="navbar-text text-light small me-3 d-none d-lg-inline">Hi, ${escapeHtml(user.firstName)} \u2022 ${escapeHtml(user.role)}</span>
                    <button class="btn btn-sm danger" onclick="logout()">Logout</button>
                </div>
            </div>
        </nav>`;
}

//                               show alert message                               //

function showAlert(elementId, message, type) {
    const alertBox = document.getElementById(elementId);
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

//                               escape html                               //

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

//                               youtube embed url                               //

function getYoutubeEmbedUrl(url) {
    let videoId = "";

    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1];
    } else if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1];
    } else if (url.includes("/embed/")) {
        return url;
    } else {
        return url;
    }

    if (videoId.includes("&")) {
        videoId = videoId.split("&")[0];
    }

    if (videoId.includes("?")) {
        videoId = videoId.split("?")[0];
    }

    return "https://www.youtube.com/embed/" + videoId;
}