const API_URL = "http://localhost:5200/api";

document.addEventListener("DOMContentLoaded", () => {
    loadEditorDashboard();
});

async function loadEditorDashboard() {
    try {
        const [assignmentResponse, bookingResponse] = await Promise.all([
            fetch(`${API_URL}/assignments`),
            fetch(`${API_URL}/bookings`)
        ]);

        if (!assignmentResponse.ok || !bookingResponse.ok) {
            throw new Error("Backend API error");
        }

        const assignments = await assignmentResponse.json();
        const bookings = await bookingResponse.json();

        // Editor login information
        const user = JSON.parse(
            sessionStorage.getItem("loggedInUser") || "null"
        );

        const email = (user?.email || "").toLowerCase();

        // Show assignments belonging to this editor
        const myAssignments = assignments.filter(a =>
            (a.editor || "").toLowerCase() === email
        );

        const jobs = myAssignments.map(a => {
            const booking = bookings.find(b =>
                String(b._id) === String(a.bookingId)
            );

            return {
                ...a,
                booking,
                status: a.status || "Pending"
            };
        });

        // Dashboard statistics
        const cards = document.querySelectorAll(".stat-card");

        if (cards[0]) {
            cards[0].querySelector("strong").textContent = jobs.length;
        }

        if (cards[1]) {
            cards[1].querySelector("strong").textContent =
                jobs.filter(j =>
                    j.status.toLowerCase() === "in progress"
                ).length;
        }

        if (cards[2]) {
            cards[2].querySelector("strong").textContent = "—";
        }

        if (cards[3]) {
            cards[3].querySelector("strong").textContent =
                jobs.filter(j =>
                    j.status.toLowerCase() === "completed"
                ).length;
        }

        // Assigned jobs list
        const jobList = document.querySelector(".job-list");

        if (jobList) {
            jobList.replaceChildren();

            if (jobs.length === 0) {
                jobList.textContent =
                    "No assignments found for this editor.";
            }

            jobs.forEach(job => {
                const row = document.createElement("div");
                row.className = "job";

                const info = document.createElement("div");
                info.className = "job-info";

                const title = document.createElement("h3");
                title.textContent =
                    job.booking?.event || "Photography Assignment";

                const venue = document.createElement("p");
                venue.textContent =
                    job.booking?.venue || "Venue not specified";

                const status = document.createElement("span");
                status.className = "job-status pending";
                status.textContent = job.status;

                info.append(title, venue);
                row.append(info, status);
                jobList.appendChild(row);
            });
        }

        // Current status counts
        const statusValues = document.querySelectorAll(
            ".status-item strong"
        );

        if (statusValues[0]) {
            statusValues[0].textContent =
                jobs.filter(j => j.status.toLowerCase() === "in progress").length;
        }

        if (statusValues[1]) {
            statusValues[1].textContent =
                jobs.filter(j => j.status.toLowerCase() === "completed").length;
        }

        if (statusValues[2]) {
            statusValues[2].textContent =
                jobs.filter(j => j.status.toLowerCase() === "pending").length;
        }

    } catch (error) {
        console.error("Editor dashboard error:", error);
        alert("Backend connection failed. Check server.js and port 5100.");
    }
}