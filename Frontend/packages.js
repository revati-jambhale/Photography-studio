const API_URL = "http://localhost:5500/api/packages";

const packageForm = document.getElementById("packageForm");
const formSection = document.getElementById("packageFormSection");
const packagesTable = document.getElementById("packagesTable");
const message = document.getElementById("packageMessage");

document.getElementById("showFormBtn").addEventListener("click", () => {
    packageForm.reset();
    document.getElementById("packageId").value = "";
    document.getElementById("formTitle").textContent = "Add New Package";
    document.getElementById("saveBtn").textContent = "Save Package";
    message.textContent = "";
    formSection.hidden = false;
});

document.getElementById("cancelBtn").addEventListener("click", () => {
    formSection.hidden = true;
});

async function loadPackages() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load packages");
        }

        const packages = await response.json();

        packagesTable.replaceChildren();

        if (!Array.isArray(packages) || packages.length === 0) {
            const row = packagesTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = "No packages added yet.";
            return;
        }

        packages.forEach((pkg) => {
            const row = packagesTable.insertRow();

            [
                pkg.name,
                "₹" + Number(pkg.price || 0).toLocaleString("en-IN"),
                pkg.duration,
                pkg.services
            ].forEach((value) => {
                const cell = row.insertCell();
                cell.textContent = value || "-";
            });

            const actions = row.insertCell();

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => editPackage(pkg));

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deletePackage(pkg._id));

            actions.append(editBtn, deleteBtn);
        });
    } catch (error) {
        console.error("Packages error:", error);
        packagesTable.replaceChildren();

        const row = packagesTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "Could not load packages. Check the backend API.";
    }
}

packageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("packageId").value;

    const packageData = {
        PackageName: document.getElementById("packageName").value.trim(),
        description: document.getElementById("packageDescription").value.trim(),
        price: Number(document.getElementById("packagePrice").value),
        duration: document.getElementById("packageDuration").value.trim(),
        services: document.getElementById("packageServices").value.trim()
    };

    try {
        const response = await fetch(id ? `${API_URL}/${id}` : API_URL, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(packageData)
        });

        if (!response.ok) {
            throw new Error("Could not save package");
        }

        message.textContent = id
            ? "Package updated successfully!"
            : "Package saved successfully!";

        packageForm.reset();
        document.getElementById("packageId").value = "";
        formSection.hidden = true;

        await loadPackages();
    } catch (error) {
        console.error("Save package error:", error);
        message.textContent = "Save failed. Check the backend API.";
    }
});

function editPackage(pkg) {
    document.getElementById("packageId").value = pkg._id;
    document.getElementById("packageName").value = pkg.packageName || "";
    document.getElementById("packageDescription").value = pkg.description || "";
    document.getElementById("packagePrice").value = pkg.price || "";
    document.getElementById("packageDuration").value = pkg.duration || "";
    document.getElementById("packageServices").value = pkg.services || "";

    document.getElementById("formTitle").textContent = "Edit Package";
    document.getElementById("saveBtn").textContent = "Update Package";

    message.textContent = "";
    formSection.hidden = false;
}

async function deletePackage(id) {
    if (!confirm("Are you sure you want to delete this package?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete package");
        }

        await loadPackages();
    } catch (error) {
        console.error("Delete package error:", error);
        alert("Delete failed. Check the backend API.");
    }
}

loadPackages();