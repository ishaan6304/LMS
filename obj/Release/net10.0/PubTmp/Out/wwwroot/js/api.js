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
        const active = href === activePage ? "active" : "";

        linksHtml += `<li class="${active}"><a href="${href}">${label}</a></li>`;
    }

    const profileActive = activePage === "/profile.html" ? "active" : "";

    // GooeyNav (react bit) markup: the two .effect spans are the gooey
    // blob + text flash layers that /js/fx/effects.js animates.
    document.getElementById("navbar").innerHTML = `
        <header class="topbar">
            <a class="brand" href="${links.length > 0 ? links[0][0] : "/index.html"}">\uD83D\uDCDA PaceLMS</a>
            <div class="gooey-nav-container">
                <nav>
                    <ul>
                        ${linksHtml}
                        <li class="${profileActive}"><a href="/profile.html">My Profile</a></li>
                    </ul>
                </nav>
                <span class="effect filter"></span>
                <span class="effect text"></span>
            </div>
            <div class="topbar-right">
                <span class="topbar-user">Hi, ${escapeHtml(user.firstName)} \u2022 ${escapeHtml(user.role)}</span>
                <button class="btn-sm danger" onclick="logout()">Logout</button>
            </div>
        </header>`;

    // wire up the gooey pill + particle burst
    if (window.initGooeyNav) window.initGooeyNav();

    renderBreadcrumbs(user);
}

//                               breadcrumbs                               //

// Every page points to its parent page. We start at the current page and walk
// UP the tree until we hit the dashboard, then print the trail in order:
// Dashboard > Courses > Create Course. Last crumb = the page you are on.

function renderBreadcrumbs(user) {
    const navbar = document.getElementById("navbar");

    if (!navbar || document.querySelector(".breadcrumbs")) return;

    const home = {
        "Admin": "/admin/dashboard.html",
        "Instructor": "/instructor/dashboard.html",
        "Student": "/student/dashboard.html"
    }[user.role];

    if (!home) return;

    //          shared pages live under a different parent per role          //

    const coursesPage = user.role === "Admin" ? "/admin/courses.html" : "/instructor/courses.html";

    const tree = {
        "/admin/users.html": { label: "Users", parent: home },
        "/admin/create-user.html": { label: "Create User", parent: "/admin/users.html" },
        "/admin/courses.html": { label: "Courses", parent: home },
        "/admin/create-course.html": { label: "Create Course", parent: "/admin/courses.html" },
        "/admin/assign.html": { label: "Assign Course", parent: home },
        "/admin/categories.html": { label: "Categories", parent: home },
        "/admin/roles.html": { label: "Roles", parent: home },
        "/instructor/courses.html": { label: "My Courses", parent: home },
        "/instructor/create-course.html": { label: "Create Course", parent: "/instructor/courses.html" },
        "/instructor/requests.html": { label: "Enroll Requests", parent: home },
        "/instructor/qna.html": { label: "Q&A", parent: home },
        "/instructor/assign.html": { label: "Assign Course", parent: home },
        "/student/catalog.html": { label: "Browse Courses", parent: home },
        "/student/qna.html": { label: "Q&A", parent: home },
        "/profile.html": { label: "My Profile", parent: home },
        "/manage-course.html": { label: "Course", parent: coursesPage },
        "/course.html": { label: "Course", parent: user.role === "Student" ? "/student/catalog.html" : coursesPage }
    };

    tree[home] = { label: "Dashboard", parent: null };

    const path = window.location.pathname;

    // unknown page, or we are already at the root -> nothing to show
    if (!tree[path] || path === home) return;

    //          walk up the tree collecting crumbs (root ends up first)          //

    const trail = [];
    let current = path;
    let guard = 0;

    while (current && tree[current] && guard < 10) {
        trail.unshift({ href: current, label: tree[current].label });
        current = tree[current].parent;
        guard = guard + 1;
    }

    let html = "";

    for (let i = 0; i < trail.length; i++) {
        if (i === trail.length - 1) {
            html += `<span class="crumb-current">${trail[i].label}</span>`;
        } else {
            html += `<a class="crumb" href="${trail[i].href}">${trail[i].label}</a><span class="crumb-sep">\u203A</span>`;
        }
    }

    const nav = document.createElement("nav");
    nav.className = "breadcrumbs";
    nav.setAttribute("aria-label", "breadcrumb");
    nav.innerHTML = html;

    navbar.insertAdjacentElement("afterend", nav);
}

//          course pages call this once they know the real course title          //

function setBreadcrumbLeaf(label) {
    const leaf = document.querySelector(".breadcrumbs .crumb-current");

    if (leaf) leaf.textContent = label;
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