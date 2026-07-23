//                               page load                               //

window.addEventListener("DOMContentLoaded", async function () {
    const user = await requireLogin("Admin");

    if (!user) return;

    renderNavbar(user, "/admin/dashboard.html");

    await loadCategories();
});

//                               load categories                               //

async function loadCategories() {
    const result = await apiGet("/api/categories");

    const categoriesList = document.getElementById("categoriesList");

    if (!result.success || result.data.length === 0) {
        categoriesList.innerHTML = `<p class="text-muted">No categories yet.</p>`;
        return;
    }

    let itemsHtml = "";

    for (const category of result.data) {
        // each category gets its own small BorderGlow card
        itemsHtml += `<div class="border-glow-card chip">\uD83C\uDFF7\uFE0F ${escapeHtml(category.name)}</div>`;
    }

    categoriesList.innerHTML = itemsHtml;
}

//                               create category                               //

document.getElementById("createCategoryForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        name: document.getElementById("categoryName").value
    };

    // DATA FLOW: body -> JSON -> POST /api/categories -> CategoriesController.CreateCategory
    const result = await apiPost("/api/categories", body);

    if (result.success) {
        showAlert("pageAlert", result.message, "success");
        document.getElementById("categoryName").value = "";
        await loadCategories();
    } else {
        showAlert("pageAlert", result.message, "danger");
    }
});
