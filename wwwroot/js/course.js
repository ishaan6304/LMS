//                               page load                               //

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

let currentUser = null;
let trackingEnabled = false;   // true only for enrolled students

//          one tracker per video, keyed by contentId          //
//          { player, watched (Set of second-marks), duration, ... }          //

const videoTrackers = {};
let pendingVideos = [];
let ytApiReady = false;

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();

    if (!user) return;

    currentUser = user;

    renderNavbar(user, "");

    await loadCourse();
});

//                               load course                               //

async function loadCourse() {
    // DATA FLOW: GET /api/courses/5 -> { success, data: { title, ..., chapters:
    //   [ { contents: [ { chapterContentId, contentType, isCompleted,
    //     watchedSeconds, durationSeconds } ] } ] } }
    const result = await apiGet("/api/courses/" + courseId);

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    const course = result.data;

    document.getElementById("courseTitle").textContent = course.title;
    document.getElementById("courseMeta").textContent = "By " + course.instructorName + " \u2022 " + course.category + " \u2022 " + course.level + " \u2022 " + course.language;
    document.getElementById("courseDescription").textContent = course.description;

    setBreadcrumbLeaf(course.title);

    renderEnrollArea(course);

    //          students can only track progress when actually enrolled          //

    const isEnrolled = course.myEnrollmentStatus === "Active" || course.myEnrollmentStatus === "Completed";

    trackingEnabled = currentUser.role === "Student" && isEnrolled;

    const accordion = document.getElementById("chaptersAccordion");

    if (course.chapters.length === 0) {
        accordion.innerHTML = `<p class="text-muted">No chapters added to this course yet.</p>`;
        return;
    }

    pendingVideos = [];

    let accordionHtml = "";
    let isFirst = true;

    //          for the initial overall bar (before any heartbeat)          //

    let fractionSum = 0;
    let contentCount = 0;

    for (const chapter of course.chapters) {
        let contentsHtml = "";

        for (const content of chapter.contents) {
            contentCount = contentCount + 1;

            if (content.contentType === "Video") {

                //          videos complete automatically via watch time - no button          //

                if (content.isCompleted) {
                    fractionSum += 1;
                } else if (content.durationSeconds > 0) {
                    fractionSum += Math.min(1, content.watchedSeconds / content.durationSeconds);
                }

                const doneBadge = content.isCompleted
                    ? `<span class="badge bg-success">\u2714 Completed</span>`
                    : "";

                //          enablejsapi=1 lets our JS talk to the player          //

                let embed = getYoutubeEmbedUrl(content.contentUrl);
                embed += (embed.includes("?") ? "&" : "?") + "enablejsapi=1&origin=" + window.location.origin;

                let progressHtml = "";

                if (trackingEnabled) {
                    pendingVideos.push({
                        contentId: content.chapterContentId,
                        watchedSeconds: content.watchedSeconds,
                        durationSeconds: content.durationSeconds,
                        isCompleted: content.isCompleted
                    });

                    const startPct = content.isCompleted
                        ? 100
                        : (content.durationSeconds > 0 ? Math.round(Math.min(100, content.watchedSeconds * 100 / content.durationSeconds)) : 0);

                    progressHtml = `
                        <div class="progress-line">
                            <div class="progress-track"><div class="progress-fill" id="bar-${content.chapterContentId}" style="width: ${startPct}%;"></div></div>
                            <span class="progress-pct" id="pct-${content.chapterContentId}">${startPct}% watched</span>
                        </div>`;
                }

                contentsHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                            <strong>\uD83C\uDFAC ${escapeHtml(content.title)}</strong>
                            <span id="done-${content.chapterContentId}">${doneBadge}</span>
                        </div>
                        <></>
                        <div class="ratio ratio-16x9" style="max-width: 480px;">
                            <iframe id="player-${content.chapterContentId}" src="${escapeHtml(embed)}" title="${escapeHtml(content.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        ${progressHtml}
                    </div>`;
            } else {

                //          assignments keep the manual toggle button          //

                if (content.isCompleted) fractionSum += 1;

                const completeButton = trackingEnabled
                    ? `<button id="toggle-${content.chapterContentId}" class="btn btn-sm ${content.isCompleted ? "btn-success" : "btn-outline-success"} ms-2"
                           onclick="toggleProgress(${content.chapterContentId})">
                           ${content.isCompleted ? "\u2714 Completed" : "Mark complete"}
                       </button>`
                    : "";

                contentsHtml += `
                    <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                        <a href="${escapeHtml(content.contentUrl)}" target="_blank">\uD83D\uDCC4 ${escapeHtml(content.title)}</a>
                        ${completeButton}
                    </div>`;
            }
        }

        if (chapter.contents.length === 0) {
            contentsHtml = `<div class="list-group-item text-muted">No content added to this chapter yet.</div>`;
        }

        accordionHtml += `
            <div class="accordion-item border-glow-card">
                <h2 class="accordion-header">
                    <button class="accordion-button ${isFirst ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#chapter-${chapter.chapterId}">
                        Chapter ${chapter.displayOrder}: ${escapeHtml(chapter.title)}
                    </button>
                </h2>
                <></>
                <div id="chapter-${chapter.chapterId}" class="accordion-collapse collapse ${isFirst ? "show" : ""}" data-bs-parent="#chaptersAccordion">
                    <div class="accordion-body p-0">
                        <div class="list-group list-group-flush">${contentsHtml}</div>
                    </div>
                </div>
            </div>`;

        isFirst = false;
    }

    accordion.innerHTML = accordionHtml;

    //          overall course progress bar (enrolled students only)          //

    if (trackingEnabled) {
        if (!document.getElementById("courseProgressWrap")) {
            accordion.insertAdjacentHTML("beforebegin", `
                <div id="courseProgressWrap" class="course-progress">
                    <div class="progress-line">
                        <div class="progress-track"><div class="progress-fill" id="courseBar"></div></div>
                        <span class="progress-pct" id="coursePct"></span>
                    </div>
                </div>`);
        }

        const initialPercent = contentCount === 0 ? 0 : Math.round(fractionSum * 100 / contentCount);
        updateCourseBar(initialPercent);

        loadYouTubeApi();
    }
}

//                               youtube iframe api                               //

// DATA FLOW: we load YouTube's iframe_api script -> YouTube calls the global
// onYouTubeIframeAPIReady() -> we attach a YT.Player to every video iframe.
// The player lets us read getCurrentTime(), getDuration() and the play state.

function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
        ytApiReady = true;
        createAllPlayers();
        return;
    }

    if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    }
}

window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
    createAllPlayers();
};

function createAllPlayers() {
    if (!ytApiReady || !trackingEnabled) return;

    for (const video of pendingVideos) {
        if (videoTrackers[video.contentId]) continue;

        try {
            const player = new YT.Player("player-" + video.contentId, {
                events: {
                    "onReady": function () { onPlayerReady(video.contentId); },
                    "onStateChange": function (event) { onPlayerStateChange(video.contentId, event); }
                }
            });

            videoTrackers[video.contentId] = {
                player: player,
                watched: new Set(),                    // unique second-marks actually played
                duration: video.durationSeconds,
                savedSeconds: video.watchedSeconds,    // progress saved on the server
                isCompleted: video.isCompleted,
                timer: null,
                ticks: 0
            };
        } catch (err) {
            console.log("Could not attach a player for content " + video.contentId, err);
        }
    }
}

//                               player events                               //

function onPlayerReady(contentId) {
    const t = videoTrackers[contentId];

    //          the real video length comes from the player itself          //

    const realDuration = Math.floor(t.player.getDuration());

    if (realDuration > 0) t.duration = realDuration;

    //          seed the set with saved progress so it carries over sessions          //

    const seed = Math.min(t.savedSeconds, t.duration || t.savedSeconds);

    for (let s = 0; s < seed; s++) t.watched.add(s);

    updateContentBar(contentId);
}

function onPlayerStateChange(contentId, event) {
    const t = videoTrackers[contentId];

    if (event.data === YT.PlayerState.PLAYING) {
        //          count one second-mark per real second of playback          //
        if (!t.timer) t.timer = setInterval(function () { tick(contentId); }, 1000);
    } else {
        //          paused / ended / buffering -> stop counting, save now          //
        if (t.timer) {
            clearInterval(t.timer);
            t.timer = null;
        }

        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            sendWatchTime(contentId);
        }
    }
}

function tick(contentId) {
    const t = videoTrackers[contentId];

    if (!t.duration) {
        const d = Math.floor(t.player.getDuration());
        if (d > 0) t.duration = d;
    }

    //          a Set ignores duplicates: skipping ahead adds nothing,          //
    //          rewatching the same part adds nothing -> honest percent          //

    t.watched.add(Math.floor(t.player.getCurrentTime()));

    updateContentBar(contentId);

    //          heartbeat: save every 15 seconds of playback          //

    t.ticks = t.ticks + 1;

    if (t.ticks % 15 === 0) sendWatchTime(contentId);
}

//                               save to server                               //

async function sendWatchTime(contentId) {
    const t = videoTrackers[contentId];

    if (!t || !t.duration || t.watched.size === 0) return;

    // DATA FLOW: POST /api/progress/content/7/watch { watchedSeconds, durationSeconds }
    //   -> { success, data: { contentPercent, isCompleted, coursePercent } }
    const result = await apiPost("/api/progress/content/" + contentId + "/watch", {
        watchedSeconds: t.watched.size,
        durationSeconds: t.duration
    });

    if (!result.success || !result.data) return;

    if (result.data.isCompleted && !t.isCompleted) {
        t.isCompleted = true;

        const badge = document.getElementById("done-" + contentId);

        if (badge) badge.innerHTML = `<span class="badge bg-success">\u2714 Completed</span>`;

        updateContentBar(contentId);
    }

    updateCourseBar(result.data.coursePercent);
}

//          save whatever we have when the user switches tab / closes the page          //

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
        for (const contentId in videoTrackers) sendWatchTime(contentId);
    }
});

//                               progress bars                               //

function updateContentBar(contentId) {
    const t = videoTrackers[contentId];

    const bar = document.getElementById("bar-" + contentId);
    const pct = document.getElementById("pct-" + contentId);

    if (!bar || !pct || !t.duration) return;

    let percent = Math.round(Math.min(100, t.watched.size * 100 / t.duration));

    if (t.isCompleted) percent = 100;

    bar.style.width = percent + "%";
    pct.textContent = percent + "% watched";
}

function updateCourseBar(percent) {
    const bar = document.getElementById("courseBar");
    const pct = document.getElementById("coursePct");

    if (!bar || !pct) return;

    bar.style.width = percent + "%";
    pct.textContent = percent + "% complete";
}

//                               enroll area                               //

function renderEnrollArea(course) {
    const enrollArea = document.getElementById("enrollArea");

    //          only students see the enroll area          //

    if (currentUser.role !== "Student") {
        enrollArea.innerHTML = course.isActive
            ? ""
            : `<span class="badge bg-secondary">Disabled</span>`;
        return;
    }

    if (course.myEnrollmentStatus === "Active") {
        enrollArea.innerHTML = `<span class="badge bg-success">Enrolled</span> <small class="text-muted ms-2">Your watch time is being tracked.</small>`;
    }
    else if (course.myEnrollmentStatus === "Completed") {
        enrollArea.innerHTML = `<span class="badge bg-primary">Completed</span>`;
    }
    else if (course.myEnrollmentStatus === "Pending") {
        enrollArea.innerHTML = `<span class="badge bg-warning text-dark">Request Pending</span> <small class="text-muted ms-2">Waiting for instructor approval. You can audit the course meanwhile.</small>`;
    }
    else {
        //          auditing: can watch everything, but no progress / certificate          //

        enrollArea.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="requestEnroll()">Request Enroll</button>
            <small class="text-muted ms-2">You are auditing this course. Enroll to track progress and earn a certificate later.</small>`;
    }
}

//                               request enroll                               //

async function requestEnroll() {
    const result = await apiPost("/api/enrollments/request", { courseId: Number(courseId) });

    showAlert("pageAlert", result.message, result.success ? "success" : "danger");

    await loadCourse();
}

//                               toggle progress (assignments only)                               //

async function toggleProgress(contentId) {
    // DATA FLOW: POST /api/progress/content/9/toggle -> { success, data: { isCompleted, coursePercent } }
    const result = await apiPost("/api/progress/content/" + contentId + "/toggle", {});

    if (!result.success) {
        showAlert("pageAlert", result.message, "danger");
        return;
    }

    //          update the button in place - a full reload would reset the videos          //

    const done = result.data && result.data.isCompleted;

    const btn = document.getElementById("toggle-" + contentId);

    if (btn) {
        btn.className = "btn btn-sm ms-2 " + (done ? "btn-success" : "btn-outline-success");
        btn.innerHTML = done ? "\u2714 Completed" : "Mark complete";
    }

    if (result.data) updateCourseBar(result.data.coursePercent);
}
