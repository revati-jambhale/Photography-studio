const API_URL = "http://localhost:5500/api/assignments";

// Load assignments from backend
async function loadAssignments() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch assignments");
        }

        const assignments = await response.json();

        console.log("Assignments:", assignments);

        displayAssignments(assignments);
        displayCalendarEvents(assignments);
        displayAssignmentDetails(assignments);
        updateDashboard(assignments);

    } catch (error) {
        console.error("Error loading assignments:", error);
    }
}

// Display assignments
function displayAssignments(assignments) {
    const tableBody = document.querySelector(".events-table");

    if (!tableBody) {
        console.log("Events section not found.");
        return;
    }

    // Remove old dynamic rows only
    tableBody.querySelectorAll(".table-row:not(.table-head)").forEach(row => row.remove());

    assignments.forEach((assignment, index) => {
        const row = document.createElement("div");
        row.className = "table-row dynamic-row";

        const eventName =
            assignment.eventType || assignment.event || 
            assignment.bookingId || "New Event";

        const eventDate = assignment.eventDate
            ? new Date(assignment.eventDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
            : "-";

        const status = assignment.status || "Assigned";

        const eventNameCell = document.createElement("span");

        const title = document.createElement("strong");
        title.textContent = eventName;

        const eventId = document.createElement("small");
        eventId.textContent = "Event #" + (assignment._id || index + 1);

        eventNameCell.append(title, eventId);

        const dateCell = document.createElement("span");
        dateCell.textContent = eventDate;

        const venueCell = document.createElement("span");
        venueCell.textContent = assignment.venue || "-";

        const statusCell = document.createElement("span");
        statusCell.className = status.toLowerCase();
        statusCell.textContent = status;

        row.append(eventNameCell, dateCell, venueCell, statusCell);
        tableBody.appendChild(row);
    });
}

// Update dashboard statistics
function updateDashboard(assignments) {
    const totalEvents = assignments.length;

    const upcomingEvents = assignments.filter(assignment => {
        const eventDate = new Date(assignment.eventDate);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        return eventDate >= today &&
            (assignment.status || "").toLowerCase() !== "completed";
    }).length;

    const completedEvents = assignments.filter(
        assignment =>
            (assignment.status || "").toLowerCase() === "completed"
    ).length;

    document.getElementById("assignedCount").textContent = totalEvents;
    document.getElementById("upcomingCount").textContent = upcomingEvents;
    document.getElementById("completedCount").textContent = completedEvents;

    console.log("Dashboard updated");
}
// Load data when the page opens
document.addEventListener("DOMContentLoaded", loadAssignments);
function displayAssignmentDetails(assignments) {
    if (!assignments.length) return;

    const assignment = assignments[0];

    document.getElementById("detailEventCode").textContent =
        assignment.eventCode || assignment._id || "-";

    document.getElementById("detailEventType").textContent =
        assignment.eventType || assignment.event || "-";

    document.getElementById("detailTeam").textContent =
        assignment.team || "-";

    document.getElementById("detailVenue").textContent =
        assignment.venue || "-";

    document.getElementById("detailEventDate").textContent =
        assignment.eventDate
            ? new Date(assignment.eventDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
            : "-";

    document.getElementById("detailStatus").textContent =
        assignment.status || "Assigned";
}
// Display assignment dates on calendar
function displayCalendarEvents(assignments) {
    const calendarDays = document.getElementById("calendarDays");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarDays || !calendarMonth) {
        console.log("Calendar elements not found.");
        return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    calendarMonth.textContent = today.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    calendarDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const startDay = (firstDay + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Empty spaces before the first day
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement("span");
        emptyDay.className = "empty-day";
        calendarDays.appendChild(emptyDay);
    }

    // Get event dates from backend
    const eventDates = assignments
        .filter(assignment => assignment.eventDate)
        .map(assignment => {
            const date = new Date(assignment.eventDate);
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        });

    // Create calendar dates
    for (let day = 1; day <= totalDays; day++) {
        const dateCell = document.createElement("span");
        dateCell.textContent = day;

        const dateKey = `${year}-${month}-${day}`;

        if (eventDates.includes(dateKey)) {
            dateCell.classList.add("event-day");
            dateCell.title = "Assigned Event";
        }

        if (
            day === today.getDate()
        ) {
            dateCell.classList.add("selected");
        }

        calendarDays.appendChild(dateCell);
    }
}
