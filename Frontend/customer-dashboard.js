const $ = (id) => document.getElementById(id);

const API_URL = "http://localhost:5500/api";

const STORAGE_KEYS = {
  profile: "revaCustomerProfile",
  bookings: "revaCustomerBookings",
  enquiries: "revaCustomerEnquiries",
  payments: "revaCustomerPayments"
};

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeList = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const safe = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

function dateLabel(value) {
  if (!value) return "Date not set";

  const date = new Date(
    value + (value.length === 10 ? "T00:00:00" : "")
  );

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
}

function profileDefault() {
  try {
    const old = JSON.parse(
      sessionStorage.getItem("customerProfile") || "null"
    );

    if (old && typeof old === "object") {
      return {
        name: old.name || "",
        email: old.email || "",
        phone: old.phone || ""
      };
    }
  } catch {}

  try {
    const login = JSON.parse(
      sessionStorage.getItem("loggedInUser") || "null"
    );

    if (login && typeof login === "object") {
      return {
        name: login.name || "",
        email: login.email || "",
        phone: login.phone || ""
      };
    }
  } catch {}

  return {
    name: "",
    email: "",
    phone: ""
  };
}

let profile = (() => {
  try {
    return {
      ...profileDefault(),
      ...JSON.parse(
        localStorage.getItem(STORAGE_KEYS.profile) || "{}"
      )
    };
  } catch {
    return profileDefault();
  }
})();

function paintProfile() {
  const name = profile.name || "Customer";
  const email = profile.email || "";
  const phone = profile.phone || "";
  const initial = name.charAt(0).toUpperCase() || "C";

  if ($("profileName")) $("profileName").value = name;
  if ($("profileEmail")) $("profileEmail").value = email;
  if ($("profilePhone")) $("profilePhone").value = phone;

  if ($("profileDisplayName")) {
    $("profileDisplayName").textContent = name;
  }

  if ($("welcomeName")) {
    $("welcomeName").textContent = name;
  }

  if ($("sideName")) $("sideName").textContent = name;
  if ($("sideAvatar")) $("sideAvatar").textContent = initial;
  if ($("topAvatar")) $("topAvatar").textContent = initial;
  if ($("profileAvatar")) $("profileAvatar").textContent = initial;
}


// Get current logged-in user
function getLoggedInUser() {
  try {
    return JSON.parse(
      sessionStorage.getItem("loggedInUser") || "null"
    );
  } catch {
    return null;
  }
}

// Load Customer Profile
async function loadCustomerProfile() {
  const savedUser = getLoggedInUser();

  if (!savedUser?.email) {
    console.warn("No logged-in user found.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/users/${encodeURIComponent(savedUser.email)}`
    );

    const user = await response.json();

    if (!response.ok) {
      throw new Error(user.message || "Unable to load profile");
    }

    profile = {
      name: user.name || savedUser.name || "",
      email: user.email || savedUser.email || "",
      phone: user.phone || savedUser.phone || ""
    };

    localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify(profile)
    );

    if (typeof paintProfile === "function") {
      paintProfile();
    }
  } catch (error) {
    console.error("Profile error:", error);
    toast("Profile load failed. Check backend.");
  }
}
// Load Bookings from Backend
async function loadBookings() {
  const savedUser = getLoggedInUser();
  if (!savedUser?.email) return;

  try {
    const email = savedUser.email.trim().toLowerCase();

    const [bookingResponse, paymentResponse] = await Promise.all([
      fetch(`${API_URL}/bookings`),
      fetch(`${API_URL}/payments`)
    ]);

    if (!bookingResponse.ok || !paymentResponse.ok) {
      throw new Error("Data load failed");
    }

    const bookings = await bookingResponse.json();
    const payments = await paymentResponse.json();

    const myBookings = bookings.filter(
      b => (b.customerEmail || "").trim().toLowerCase() === email
    );
  const myPayments = payments;

    const paid = myPayments
      .filter(p => p.paymentStatus?.toLowerCase() === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pending = myPayments
      .filter(p => p.paymentStatus?.toLowerCase() === "pending")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    if ($("totalBookings"))
      $("totalBookings").textContent = myBookings.length;

    if ($("amountPaid"))
      $("amountPaid").textContent = "₹" + paid.toLocaleString("en-IN");

    if ($("pendingAmount"))
      $("pendingAmount").textContent = "₹" + pending.toLocaleString("en-IN");

    if ($("paymentPaid"))
      $("paymentPaid").textContent = "₹" + paid.toLocaleString("en-IN");

    if ($("paymentDue"))
      $("paymentDue").textContent = "₹" + pending.toLocaleString("en-IN");

    if ($("paymentBookings"))
      $("paymentBookings").textContent = myBookings.length;

    const list = $("paymentList");

    if (list) {
      list.innerHTML = myPayments.length
        ? myPayments.map(p => `
            <div class="record-item">
              <div class="row-main">
                <strong>${safe(p.customerName || "Payment")}</strong>
                <small>₹${Number(p.amount || 0).toLocaleString("en-IN")}</small>
                <small>${safe(p.paymentDate || "")}</small>
              </div>
              <span class="badge">${safe(p.paymentStatus || "Pending")}</span>
            </div>
          `).join("")
        : '<div class="empty-state">No payment records yet.</div>';
    }

  } catch (error) {
    console.error("Payment load error:", error);
    toast("Payment data load failed. Check backend.");
  }
}

// Render Enquiries
function renderEnquiries() {
  const enquiryList = $("enquiryList");
  if (!enquiryList) return;

  const items = readList(STORAGE_KEYS.enquiries);

  enquiryList.innerHTML = items.length
    ? items.slice().reverse().map((item) => `
        <div class="record-item">
          <div class="row-main">
            <strong>${safe(item.package)}</strong>
            <small>${safe(dateLabel(item.date))} · ${safe(item.venue)}</small>
            <small>${safe(item.message || "No additional message")}</small>
          </div>
          <span class="badge">${safe(item.status || "Submitted")}</span>
        </div>
      `).join("")
    : '<div class="empty-state">No enquiries yet.</div>';
}

// Sections used by navigation
const sections = Array.from(
  document.querySelectorAll("section")
);

// Show Portal Section
function showSection(id) {
  if (!sections.some((section) => section.id === id)) {
    id = "dashboard";
  }

  sections.forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === id);
  });

  const link = document.querySelector(
    `.nav-link[data-section="${id}"]`
  );

  if ($("pageTitle")) {
    $("pageTitle").textContent = link
      ? link.textContent.trim()
      : id.charAt(0).toUpperCase() + id.slice(1);
  }

  if ($("sidebar")) {
    $("sidebar").classList.remove("open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Navigation Click
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-section]");
  if (!link) return;

  const id = link.dataset.section;

  if (sections.some((section) => section.id === id)) {
    event.preventDefault();
    history.replaceState(null, "", "#" + id);
    showSection(id);
  }
});

// Handle direct section links
window.addEventListener("hashchange", () => {
  showSection(location.hash.slice(1) || "dashboard");
});

// Menu Button
if ($("menuBtn")) {
  $("menuBtn").addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
  });
}

// Logout
if ($("logoutBtn")) {
  $("logoutBtn").addEventListener("click", () => {
    if (confirm("Log out of the customer portal?")) {
      sessionStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    }
  });
}

// Edit Profile
if ($("editProfileBtn")) {
  $("editProfileBtn").addEventListener("click", () => {
    ["profileName", "profileEmail", "profilePhone"].forEach((id) => {
      if ($(id)) $(id).disabled = false;
    });

    $("editProfileBtn").hidden = true;
    if ($("saveProfileBtn")) $("saveProfileBtn").hidden = false;
    if ($("cancelProfileBtn")) $("cancelProfileBtn").hidden = false;
    if ($("profileMessage")) $("profileMessage").textContent = "";
  });
}

// Cancel Profile Edit
if ($("cancelProfileBtn")) {
  $("cancelProfileBtn").addEventListener("click", () => {
    if (typeof paintProfile === "function") paintProfile();

    ["profileName", "profileEmail", "profilePhone"].forEach((id) => {
      if ($(id)) $(id).disabled = true;
    });

    $("editProfileBtn").hidden = false;
    if ($("saveProfileBtn")) $("saveProfileBtn").hidden = true;
    if ($("cancelProfileBtn")) $("cancelProfileBtn").hidden = true;
    if ($("profileMessage")) {
      $("profileMessage").textContent = "Changes cancelled.";
    }
  });
}

 // Save Profile
if ($("profileForm")) {
  $("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const savedUser = getLoggedInUser();

    if (!savedUser?.email) {
      toast("Please login again.");
      return;
    }

    const updatedProfile = {
      name: $("profileName")?.value.trim() || "",
      phone: $("profilePhone")?.value.trim() || ""
    };

    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(savedUser.email)}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatedProfile)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Profile update failed"
        );
      }

      profile = {
        name: result.user.name || "",
        email: result.user.email || savedUser.email,
        phone: result.user.phone || ""
      };

      localStorage.setItem(
        STORAGE_KEYS.profile,
        JSON.stringify(profile)
      );

      sessionStorage.setItem(
        "customerProfile",
        JSON.stringify(profile)
      );

      savedUser.name = profile.name;
      savedUser.phone = profile.phone;

      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(savedUser)
      );

      paintProfile();

      ["profileName", "profileEmail", "profilePhone"].forEach(id => {
        if ($(id)) $(id).disabled = true;
      });

      $("editProfileBtn").hidden = false;
      $("saveProfileBtn").hidden = true;
      $("cancelProfileBtn").hidden = true;

      if ($("profileMessage")) {
        $("profileMessage").textContent =
          "Profile updated successfully.";
      }

      toast("Profile updated successfully.");

    } catch (error) {
      console.error("Profile update error:", error);
      toast(error.message || "Profile update failed.");
    }
  });
}



// Enquire About Package
document.querySelectorAll(".enquire-package").forEach((button) => {
  button.addEventListener("click", () => {
    if ($("enquiryPackage")) {
      $("enquiryPackage").value = button.dataset.package || "";
    }

    history.replaceState(null, "", "#enquiries");
    showSection("enquiries");
    $("enquiryPackage")?.focus();
  });
});

// Enquiry Form - Save to MongoDB
if ($("enquiryForm")) {
  $("enquiryForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const savedUser = getLoggedInUser();

    if (!savedUser?.email) {
      toast("Please login again.");
      return;
    }

    const item = {
      name: savedUser.name || profile.name || "Customer",
      email: savedUser.email,
      phone: profile.phone || savedUser.phone || "Not provided",
      event: $("enquiryDate").value,
      packageName: $("enquiryPackage").value,
      message:
        "Venue: " + $("enquiryVenue").value.trim() +
        "\n" + $("enquiryMessage").value.trim(),
      status: "New"
    };

    try {
      const response = await fetch(`${API_URL}/enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Enquiry save failed");
      }

      $("enquiryForm").reset();
      await loadEnquiries();

      $("enquiryFeedback").textContent =
        "Enquiry submitted successfully!";

      toast("Enquiry database madhye save zali.");

    } catch (error) {
      console.error("Enquiry error:", error);
      toast("Enquiry save zali nahi. Backend check kar.");
    }
  });
}

// Load enquiries from MongoDB
async function loadEnquiries() {
  const savedUser = getLoggedInUser();
  if (!savedUser?.email) return;

  try {
    const response = await fetch(
      `${API_URL}/enquiries?email=${encodeURIComponent(savedUser.email)}`
    );

    if (!response.ok) throw new Error("Failed to load enquiries");

    const enquiries = await response.json();

    const enquiryList = $("enquiryList");

    enquiryList.innerHTML = enquiries.length
      ? enquiries.map(item => `
          <div class="record-item">
            <div class="row-main">
              <strong>${safe(item.packageName)}</strong>
              <small>${safe(dateLabel(item.event))}</small>
              <small>${safe(item.message)}</small>
            </div>
            <span class="badge">${safe(item.status || "New")}</span>
          </div>
        `).join("")
      : '<div class="empty-state">No enquiries yet.</div>';

  } catch (error) {
    console.error("Load enquiries error:", error);
    toast("Enquiries load zalyā nahit.");
  }
}
// Show Booking Form
if ($("newBookingBtn")) {
  $("newBookingBtn").addEventListener("click", () => {
    $("bookingForm").hidden = false;
    $("newBookingBtn").hidden = true;
  });
}

// Cancel Booking
if ($("cancelBookingBtn")) {
  $("cancelBookingBtn").addEventListener("click", () => {
    $("bookingForm").reset();
    $("bookingForm").hidden = true;
    $("newBookingBtn").hidden = false;

    if ($("bookingFeedback")) {
      $("bookingFeedback").textContent = "";
    }
  });
}

// Submit Booking to Backend
if ($("bookingForm")) {
  $("bookingForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const savedUser = getLoggedInUser();

    if (!savedUser?.email) {
      toast("Please login again before booking.");
      return;
    }

    const customerName =
      $("bookingCustomerName")?.value.trim() ||
      savedUser.name ||
      profile.name;

    if (!customerName) {
      toast("Customer name required.");
      $("bookingCustomerName")?.focus();
      return;
    }

    const item = {
      customerName,
      customerEmail: savedUser.email,
      event: $("bookingPackage")?.value || "",
      eventDate: $("bookingDate")?.value || "",
      venue: $("bookingVenue")?.value.trim() || "",
      status: "Pending"
    };

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Booking submission failed."
        );
      }

      $("bookingForm").reset();
      $("bookingForm").hidden = true;
      $("newBookingBtn").hidden = false;

      if ($("bookingFeedback")) {
        $("bookingFeedback").textContent =
          "Booking submitted successfully!";
      }

      toast("Booking submitted successfully.");


    } catch (error) {
      console.error("Booking error:", error);

      if ($("bookingFeedback")) {
        $("bookingFeedback").textContent =
          "Booking could not be saved. Please check backend.";
      }

      toast("Booking could not be saved.");
    }
  });
}

// Initialize Customer Portal
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Logged in user:", getLoggedInUser());

  renderEnquiries();

  await loadCustomerProfile();
  await loadBookings();
  await loadCustomerPayments();

  showSection(location.hash.slice(1) || "dashboard");
});

async function loadPackages() {
    const container = document.getElementById("packagesContainer");

    if (!container) return;

    try {
        const response = await fetch("http://localhost:5500/api/packages");

        if (!response.ok) {
            throw new Error("Failed to fetch packages");
        }

        const packages = await response.json();
        container.replaceChildren();

        if (!packages.length) {
            container.textContent = "No packages available.";
            return;
        }

        packages.forEach(function (pkg, index) {
            const card = document.createElement("article");
            card.className = "package-card";

            const number = document.createElement("span");
            number.className = "package-number";
            number.textContent =
                String(index + 1).padStart(2, "0") + " / " +
                (pkg.category || "PHOTOGRAPHY").toUpperCase();

            const title = document.createElement("h3");
            title.textContent = pkg.name;

            const price = document.createElement("h3");
            price.textContent = "₹" + Number(pkg.price).toLocaleString("en-IN");

            const description = document.createElement("p");
            description.textContent = pkg.description || "";

            const features = document.createElement("p");
            features.textContent = (pkg.features || []).join(" • ");

            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-outline enquire-package";
            button.textContent = "Enquire now →";

            button.addEventListener("click", function () {
                const packageSelect = document.getElementById("enquiryPackage");

                if (packageSelect) {
                    const option = Array.from(packageSelect.options)
                        .find(item => item.value === pkg.name ||
                                      item.textContent.trim() === pkg.name);

                    if (!option) {
                        const newOption = document.createElement("option");
                        newOption.value = pkg.name;
                        newOption.textContent = pkg.name;
                        packageSelect.appendChild(newOption);
                    }

                    packageSelect.value = pkg.name;
                }

                document.querySelector('[data-section="enquiries"]')?.click();
            });

            card.append(number, title, price, description, features, button);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Packages loading error:", error);
        container.textContent =
            "Packages are not loaded ,cheak server API.";
    }
}

loadPackages();

async function loadCustomerPayments() {
  const savedUser = getLoggedInUser();

  if (!savedUser?.email) return;

  try {
    const response = await fetch(`${API_URL}/payments`);

    if (!response.ok) {
      throw new Error("Payments load failed");
    }

    const payments = await response.json();
    const email = savedUser.email.trim().toLowerCase();

    const myPayments = payments.filter(
      payment =>
        (payment.customerEmail || "").trim().toLowerCase() === email
    );

    const paid = myPayments
      .filter(p => p.paymentStatus?.toLowerCase() === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pending = myPayments
      .filter(p => p.paymentStatus?.toLowerCase() === "pending")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    $("paymentPaid").textContent =
      "₹" + paid.toLocaleString("en-IN");

    $("paymentDue").textContent =
      "₹" + pending.toLocaleString("en-IN");

    $("paymentBookings").textContent = myPayments.length;

    $("paymentList").innerHTML = myPayments.length
      ? myPayments.map(p => `
          <div class="record-item">
            <div class="row-main">
              <strong>${safe(p.customerName || "Customer")}</strong>
              <small>Amount: ₹${Number(p.amount || 0).toLocaleString("en-IN")}</small>
              <small>Date: ${safe(dateLabel(p.paymentDate))}</small>
              <small>Method: ${safe(p.paymentMethod || "N/A")}</small>
            </div>
            <span class="badge">${safe(p.paymentStatus || "Pending")}</span>
          </div>
        `).join("")
      : '<div class="empty-state">No payment records yet.</div>';

  } catch (error) {
    console.error("Payment error:", error);
    toast("Payments load failed. Check backend.");
  }
}




