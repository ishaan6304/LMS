//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin();

    if (!user) return;

    //          this page is for instructors AND admins          //

    if (user.role !== "Instructor" && user.role !== "Admin") {
        window.location.href = "/";
        return;
    }

    renderNavbar(user, "/Instructor/Qna");

    await loadQuestions();
});

//                               load received questions                               //

async function loadQuestions() {
    // DATA FLOW: GET /api/qna/received -> only questions on MY courses (admin sees all)
    const result = await apiGet("/api/qna/received");

    const questionsList = document.getElementById("questionsList");

    if (!result.success || result.data.length === 0) {
        questionsList.innerHTML = `<p>No questions yet.</p>`;
        return;
    }

    let html = "";

    for (const q of result.data) {

        const chapterText = q.chapterTitle ? " - Chapter: " + escapeHtml(q.chapterTitle) : " - Whole course";
        const askedOn = new Date(q.askedAt).toLocaleString();

        //          answered questions show my reply,          //
        //          unanswered ones show a reply box          //

        let answerArea = "";

        if (q.answerText) {
            answerArea = `<p><b>My reply:</b> ${escapeHtml(q.answerText)}</p>`;
        } else {
            answerArea = `
                <textarea id="answer-${q.questionId}" rows="3" cols="60" placeholder="Type your reply..."></textarea><br />
                <button onclick="sendAnswer(${q.questionId})">Send Reply</button>`;
        }

        html += `
            <div class="border-glow-card mb-3">
                <p><b>${escapeHtml(q.studentName)}</b> asked on ${askedOn}</p>
                <p>Course: <a href="/Course?id=${q.courseId}">${escapeHtml(q.courseTitle)}</a>${chapterText}</p>
                <p><b>Q:</b> ${escapeHtml(q.questionText)}</p>
                ${answerArea}
            </div>`;
    }

    questionsList.innerHTML = html;
}

//                               send reply                               //

async function sendAnswer(questionId) {
    const answerText = document.getElementById("answer-" + questionId).value.trim();

    if (!answerText) {
        alert("Please type a reply first.");
        return;
    }

    // DATA FLOW: POST /api/qna/7/answer -> QnaController.AnswerQuestion
    const result = await apiPost("/api/qna/" + questionId + "/answer", { answerText: answerText });

    alert(result.message);

    if (result.success) {
        await loadQuestions();
    }
}
