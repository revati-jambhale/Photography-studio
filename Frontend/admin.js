const API_URL = "http://localhost:5500/api";

document.addEventListener("DOMContentLoaded", function () {
    loadBookings();
    loadAssignments();

    const form = document.getElementById("assignmentForm");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const bookingId = document.getElementById("bookingId").value;
            const editor = document.getElementById("editorEmail").value.trim();
            const assignmentDate = document.getElementById("assignmentDate").value;
            const status = document.getElementById("assignmentStatus").value;
            const message = document.getElementById("assignmentMessage");

            try {
                const response = await fetch(`${API_URL}/assignments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        bookingId: bookingId,
                        photographer: "",
                        editor: editor,
                        assignmentDate: assignmentDate,
                        status: status
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Assignment failed");
                }

                message.textContent = "Job assigned successfully!";
                message.style.color = "green";

                form.reset();
                loadAssignments();

            } catch (error) {
                console.error("Assignment error:", error);
                message.textContent = "Assignment failed. Check backend server.";
                message.style.color = "red";
            }
        });
    }
});


// Load Bookings
async function loadBookings() {
    const select = document.getElementById("bookingId");

    if (!select) return;

    try {
        const response = await fetch(`${API_URL}/bookings`);

        if (!response.ok) {
            throw new Error("Could not load bookings");
        }

        const bookings = await response.json();

        select.innerHTML = '<option value="">Select Booking</option>';

        bookings.forEach(function (booking) {
            const option = document.createElement("option");

            option.value = booking._id;
            option.textContent =
                `${booking.customerName || booking.name || "Customer"} - ${booking.event || "Event"} - ${booking.eventDate || ""}`;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Bookings error:", error);
    }
}


// Load Assignments
async function loadAssignments() {
    try {
        const response = await fetch(`${API_URL}/assignments`);

        if (!response.ok) {
            throw new Error("Could not load assignments");
        }

        const assignments = await response.json();
        const section = document.getElementById("assignments");

        if (!section) return;

        let list = document.getElementById("assignmentList");

        if (!list) {
            list = document.createElement("div");
            list.id = "assignmentList";
            section.appendChild(list);
        }

        if (assignments.length === 0) {
            list.innerHTML = "<p>No assignments yet.</p>";
            return;
        }

        list.innerHTML = `
            <h3>Assigned Jobs</h3>
            <div style="overflow-x:auto">
                <table border="1" cellpadding="10" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Editor Email</th>
                            <th>Assignment Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignments.map(function (item) {
                            return `
                                <tr>
                                    <td>${escapeHTML(item.bookingId)}</td>
                                    <td>${escapeHTML(item.editor)}</td>
                                    <td>${escapeHTML(item.assignmentDate)}</td>
                                    <td>${escapeHTML(item.status)}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error("Assignments error:", error);
    }
}

// Safely display text in HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

// LOAD PACKAGES
async function loadPackages() {
    const tableBody = document.getElementById("packagesTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch(`${API_URL}/packages`);

        if (!response.ok) {
            throw new Error("Failed to load packages");
        }

        const packages = await response.json();
        tableBody.innerHTML = "";

        if (packages.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No packages available.</td>
                </tr>`;
            return;
        }

        packages.forEach(pkg => {
            const row = document.createElement("tr");

            const values = [
                pkg.name || "-",
                pkg.category || "-",
                "₹" + Number(pkg.price || 0).toLocaleString("en-IN"),
                pkg.description || "-",
                Array.isArray(pkg.features)
                    ? pkg.features.join(", ")
                    : pkg.features || "-"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Packages error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">Unable to load packages.</td>
            </tr>`;
    }
}

// ADD PACKAGE
const packageForm = document.getElementById("packageForm");

if (packageForm) {
    packageForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const message = document.getElementById("packageMessage");

        const packageData = {
            name: document.getElementById("packageName").value.trim(),
            category: document.getElementById("packageCategory").value.trim(),
            price: Number(document.getElementById("packagePrice").value),
            description: document.getElementById("packageDescription").value.trim(),
            features: document.getElementById("packageFeatures").value
                .split(",")
                .map(feature => feature.trim())
                .filter(Boolean)
        };

        try {
            const response = await fetch(`${API_URL}/packages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(packageData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to add package");
            }

            message.textContent = "Package added successfully!";
            message.style.color = "green";

            packageForm.reset();
            await loadPackages();

        } catch (error) {
            console.error(error);
            message.textContent = "Package not saved. Check server/API.";
            message.style.color = "red";
        }
    });
}

loadPackages();
async function loadEnquiries() {
    try {
        const response = await fetch(
            "http://localhost:5500/api/enquiries"
        );

        if (!response.ok) {
            throw new Error("Enquiries load failed");
        }

        const enquiries = await response.json();

        const container = document.getElementById("enquiryList");

        if (!container) {
            console.error("enquiryList element sapadla nahi");
            return;
        }

        container.innerHTML = enquiries.length
            ? enquiries.map(item => `
                <div class="record-item">
                    <strong>${item.name || "Customer"}</strong>
                    <p>${item.email || ""}</p>
                    <p>${item.phone || ""}</p>
                    <p>Package: ${item.packageName || ""}</p>
                    <p>Event: ${item.event || ""}</p>
                    <p>${item.message || ""}</p>
                    <span>${item.status || "New"}</span>
                </div>
            `).join("")
            : "<p>No enquiries found.</p>";

    } catch (error) {
        console.error("Enquiry error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadEnquiries);
