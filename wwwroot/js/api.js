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
        window.location.href = "/";
        return null;
    }

    const user = result.data;

    if (expectedRole && user.role !== expectedRole) {
        window.location.href = "/";
        return null;
    }

    return user;
}

//                               logout                               //

function showConfirm(message, title = "Confirm Action", confirmText = "Confirm", isDanger = true) {
    return new Promise((resolve) => {
        let overlay = document.getElementById("confirmModalOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "confirmModalOverlay";
            overlay.className = "confirm-modal-overlay";
            overlay.innerHTML = `
                <div class="confirm-modal-card">
                    <div class="confirm-modal-header">
                        <span class="confirm-modal-icon" id="confirmModalIcon">⚠️</span>
                        <h3 class="confirm-modal-title" id="confirmModalTitle">Confirm Action</h3>
                    </div>
                    <div class="confirm-modal-body" id="confirmModalBody"></div>
                    <div class="confirm-modal-actions">
                        <button class="confirm-modal-btn cancel" id="confirmModalCancelBtn">Cancel</button>
                        <button class="confirm-modal-btn confirm-danger" id="confirmModalOkBtn">Confirm</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
        }

        const titleEl = document.getElementById("confirmModalTitle");
        const bodyEl = document.getElementById("confirmModalBody");
        const iconEl = document.getElementById("confirmModalIcon");
        const okBtn = document.getElementById("confirmModalOkBtn");
        const cancelBtn = document.getElementById("confirmModalCancelBtn");

        titleEl.textContent = title;
        bodyEl.textContent = message;
        iconEl.textContent = isDanger ? "⚠️" : "❓";

        okBtn.textContent = confirmText;
        okBtn.className = isDanger ? "confirm-modal-btn confirm-danger" : "confirm-modal-btn confirm-primary";

        function cleanup(result) {
            overlay.classList.remove("active");
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            overlay.removeEventListener("click", onOverlay);
            document.removeEventListener("keydown", onKeyDown);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlay(e) { if (e.target === overlay) cleanup(false); }
        function onKeyDown(e) { if (e.key === "Escape") cleanup(false); }

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        overlay.addEventListener("click", onOverlay);
        document.addEventListener("keydown", onKeyDown);

        requestAnimationFrame(() => overlay.classList.add("active"));
        okBtn.focus();
    });
}

async function logout() {
    if (!(await showConfirm("Are you sure you want to log out?", "Log Out", "Log Out", true))) return;
    await apiPost("/api/auth/logout", {});
    csrfToken = null;
    window.location.href = "/";
}

//                               navbar                               //

function renderNavbar(user, activePage) {
    const linksByRole = {
        Admin: [
            ["/Admin/Dashboard", "Dashboard"],
            ["/Admin/Users", "Users"],
            ["/Admin/Courses", "Courses"],
            ["/Admin/Assign", "Assign"]
        ],
        Instructor: [
            ["/Instructor/Dashboard", "Dashboard"],
            ["/Instructor/Courses", "My Courses"],
            ["/Instructor/Requests", "Requests"],
            ["/Instructor/Qna", "Q&A"],
            ["/Instructor/Assign", "Assign"]
        ],
        Student: [
            ["/Student/Dashboard", "Dashboard"],
            ["/Student/Catalog", "Browse Courses"],
            ["/Student/Qna", "Q&A"]
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

    const profileActive = activePage === "/Profile" ? "active" : "";

    // GooeyNav (react bit) markup: the two .effect spans are the gooey
    // blob + text flash layers that /js/fx/effects.js animates.
    document.getElementById("navbar").innerHTML = `
        <header class="topbar">
            <a class="brand" href="${links.length > 0 ? links[0][0] : "/"}">📚 PaceLMS</a>
            
            <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle navigation menu" aria-expanded="false">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>

            <div class="gooey-nav-container">
                <nav>
                    <ul>
                        ${linksHtml}
                        <li class="${profileActive}"><a href="/Profile">My Profile</a></li>
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

    const toggleBtn = document.getElementById("mobileNavToggle");
    const topbarEl = document.querySelector(".topbar");
    if (toggleBtn && topbarEl) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = topbarEl.classList.toggle("is-open");
            toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        const navLinks = topbarEl.querySelectorAll(".gooey-nav-container nav a");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                topbarEl.classList.remove("is-open");
                toggleBtn.setAttribute("aria-expanded", "false");
            });
        });

        if (!window._mobileNavOutsideClickWired) {
            window._mobileNavOutsideClickWired = true;
            document.addEventListener("click", (e) => {
                const currentTopbar = document.querySelector(".topbar");
                const currentBtn = document.getElementById("mobileNavToggle");
                if (currentTopbar && currentTopbar.classList.contains("is-open") && !currentTopbar.contains(e.target)) {
                    currentTopbar.classList.remove("is-open");
                    if (currentBtn) currentBtn.setAttribute("aria-expanded", "false");
                }
            });
        }
    }

    if (window.initGooeyNav) window.initGooeyNav();
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