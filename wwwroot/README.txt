PLAIN (NO-UI) STUDY VERSION OF THE LMS FRONTEND
================================================

What this is:
- Same file names, same element IDs, same JS functions, same API calls as the real project.
- ALL Bootstrap and CSS removed. Only raw HTML elements remain.
- Extra comments marked "DATA FLOW" show how JSON moves from the API into the page.

How to run it:
1. In your project, rename the existing wwwroot folder to wwwroot-ui (keep it safe).
2. Copy this wwwroot folder into the project in its place.
3. dotnet run, then open http://localhost:5202 as usual.
4. When done studying, delete this wwwroot and rename wwwroot-ui back.

The universal pattern on every page:
1. HTML has empty elements with ids  ->  <tbody id="usersTableBody"></tbody>
2. JS calls the API                  ->  const result = await apiGet("/api/users?role=Student")
3. API returns JSON                  ->  { success: true, data: [ { firstName: "...", ... } ] }
4. JS loops over result.data and builds HTML strings
5. JS injects them                   ->  element.innerHTML = html

Forms are the same in reverse:
1. JS reads input values by id       ->  document.getElementById("userEmail").value
2. Builds a JS object (body)
3. apiPost turns it into JSON and sends it -> controller [FromBody] request DTO
4. Response { success, message } decides which alert text to show.

Note: forgot-password / reset-password pages are not included here (same patterns, nothing new).
