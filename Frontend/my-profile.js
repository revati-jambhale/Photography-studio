const API_URL = "http://localhost:5500/api";

const form = document.getElementById("profileForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const message = document.getElementById("message");

let loggedInEmail = "";
let originalProfile = {};

function setProfile(profile) {
    nameInput.value = profile.name || "";
    emailInput.value = profile.email || "";
    phoneInput.value = profile.phone || "";

    document.getElementById("displayName").textContent =
        profile.name || "Customer";

    document.getElementById("avatar").textContent =
        (profile.name || "C").charAt(0).toUpperCase();

    originalProfile = {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value
    };
}

function setEditing(editing) {
    nameInput.disabled = !editing;
    phoneInput.disabled = !editing;
    emailInput.disabled = true;

    editBtn.hidden = editing;
    saveBtn.hidden = !editing;
    cancelBtn.hidden = !editing;
}

async function loadProfile() {
    try {
        // Login email previously saved by the login page
        const storedUser =
    sessionStorage.getItem("loggedInUser");
    console.log("Profile user:",storedUser);

        if (!storedUser) {
            message.textContent =
                "Please login again to view your profile.";
            return;
        }

        const user = JSON.parse(storedUser);
        loggedInEmail = user.email || "";

        if (!loggedInEmail) {
            message.textContent = "Login email not found.";
            return;
        }

        const response = await fetch(
            `${API_URL}/users/${encodeURIComponent(loggedInEmail)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load profile.");
        }

        setProfile(data);
        setEditing(false);
        message.textContent = "";

    } catch (error) {
        console.error("Profile loading error:", error);
        message.textContent =
            "Unable to load profile. Please check the login and server.";
    }
}

editBtn.addEventListener("click", function () {
    setEditing(true);
    message.textContent = "";
});

cancelBtn.addEventListener("click", function () {
    setProfile(originalProfile);
    setEditing(false);
    message.textContent = "Changes cancelled.";
});

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!loggedInEmail) {
        message.textContent = "Please login again.";
        return;
    }

    const profile = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    if (!profile.name) {
        message.textContent = "Name is required.";
        return;
    }

    saveBtn.disabled = true;
    message.textContent = "Saving changes...";

    try {
        const response = await fetch(
            `${API_URL}/users/${encodeURIComponent(loggedInEmail)}/profile`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(profile)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Profile update failed.");
        }

        setProfile(result.user);
        setEditing(false);
        message.textContent = "Profile updated successfully!";

    } catch (error) {
        console.error("Profile update error:", error);
        message.textContent =
            "Profile update failed: " + error.message;
    } finally {
        saveBtn.disabled = false;
    }
});

setEditing(false);
loadProfile();