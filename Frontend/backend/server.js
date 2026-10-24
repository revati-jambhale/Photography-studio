const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/photography_studio")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

    // User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    phone: String,
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    event: String,
    eventDate: String,
    venue: String,
    status: String,
    totalAmount: Number,
    amountPaid: Number
});
// Add Booking API
app.post("/api/bookings", async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();

        res.status(201).json({
            message: "Booking added successfully",
            booking: booking
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding booking",
            error: error.message
        });
    }
});

const Booking = mongoose.model("Booking", bookingSchema);

const User = mongoose.model("User", userSchema);
// Add User API
app.post("/api/users", async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();

        res.status(201).json({
            message: "User added successfully",
            user: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding user",
            error: error.message
        });
    }
});
// Login API
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({
                message: "Invalid Email or Password"
            });
        }

        res.json({
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login error",
            error: error.message
        });
    }
});
// GET CUSTOMER PROFILE
app.get("/api/users/:email", async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.params.email,
            role: "customer"
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json(user);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching customer",
            error: error.message
        });
    }
});

// UPDATE CUSTOMER PROFILE
app.put("/api/users/:email/profile", async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findOneAndUpdate(
            {
                email: req.params.email,
                role: "customer"
            },
            {
                name: name,
                phone: phone
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            user: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating profile",
            error: error.message
        });
    }
});


// Get All Bookings
app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find();

        res.json(bookings);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// Update Booking
app.put("/api/bookings/:id", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking updated successfully",
            booking: booking
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating booking",
            error: error.message
        });
    }
});

// Delete Booking
app.delete("/api/bookings/:id", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting booking",
            error: error.message
        });
    }
});

// Assignment Schema

const assignmentSchema = new mongoose.Schema({
    bookingId: String,
    photographer: String,
    editor: String,
    eventType: String,
    eventDate: String,
    venue: String,
    assignmentDate: String,
    status: {
        type: String,
        default: "Assigned"
    }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);


// Add Assignment
app.post("/api/assignments", async (req, res) => {
    try {
        const assignment = new Assignment(req.body);
        await assignment.save();

        res.status(201).json({
            message: "Assignment added successfully",
            assignment: assignment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding assignment",
            error: error.message
        });
    }
});


// Get All Assignments
app.get("/api/assignments", async (req, res) => {
    try {
        const assignments = await Assignment.find();

        res.json(assignments);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching assignments",
            error: error.message
        });
    }
});
// Update Assignment
app.put("/api/assignments/:id", async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        res.json({
            message: "Assignment updated successfully",
            assignment: assignment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating assignment",
            error: error.message
        });
    }
});


// Delete Assignment
app.delete("/api/assignments/:id", async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndDelete(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        res.json({
            message: "Assignment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting assignment",
            error: error.message
        });
    }
});


const enquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    event: {
        type: String,
        default: ""
    },
    packageName: {
        type: String,
        default: ""
    },
    message: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "New"
    }
}, {
    timestamps: true
});

const Enquiry = mongoose.model("Enquiry", enquirySchema);


// Add Enquiry
app.post("/api/enquiries", async (req, res) => {
    try {
        const enquiry = new Enquiry(req.body);
        await enquiry.save();

        res.status(201).json({
            message: "Enquiry added successfully",
            enquiry: enquiry
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding enquiry",
            error: error.message
        });
    }
});
// Get All Enquiries
app.get("/api/enquiries", async (req, res) => {
    try {
        const email = (req.query.email || "")
            .trim()
            .toLowerCase();

        const enquiries = email
            ? await Enquiry.find({ email })
            : await Enquiry.find();

        res.json(enquiries);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching enquiries",
            error: error.message
        });
    }
});

// Update Enquiry
app.put("/api/enquiries/:id", async (req, res) => {
    try {
        const enquiry = await Enquiry.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!enquiry) {
            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        res.json({
            message: "Enquiry updated successfully",
            enquiry: enquiry
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating enquiry",
            error: error.message
        });
    }
});


// Delete Enquiry
app.delete("/api/enquiries/:id", async (req, res) => {
    try {
        const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

        if (!enquiry) {
            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        res.json({
            message: "Enquiry deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting enquiry",
            error: error.message
        });
    }
});

// ================= CUSTOMER CRUD =================

// Customer Schema
const customerSchema = new mongoose.Schema({
    name: String,
    phone: String,
    event: String,
    eventDate: String,
    venue: String
});

const Customer = mongoose.model("Customer", customerSchema);


// POST - Add Customer
app.post("/api/customers", async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();

        res.status(201).json({
            message: "Customer added successfully",
            customer: customer
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding customer",
            error: error.message
        });
    }
});


// GET - Get All Customers
app.get("/api/customers", async (req, res) => {
    try {
        const customers = await Customer.find();

        res.json(customers);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching customers",
            error: error.message
        });
    }
});


// PUT - Update Customer
app.put("/api/customers/:id", async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer updated successfully",
            customer: customer
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating customer",
            error: error.message
        });
    }
});


// DELETE - Delete Customer
app.delete("/api/customers/:id", async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(
            req.params.id
        );

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting customer",
            error: error.message
        });
    }
});
// ================= TEAM MEMBERS =================

// 1. TEAM MEMBER SCHEMA

const teamMemberSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    role: String,
    specialization: String
}, {
    collection: "Tmember"
});

const TeamMember = mongoose.model(
    "TeamMember",
    teamMemberSchema
);


// 2. POST - ADD TEAM MEMBER

app.post("/api/team-members", async (req, res) => {
    try {
        const teamMember = new TeamMember(req.body);

        await teamMember.save();

        res.status(201).json({
            message: "Team member added successfully",
            teamMember: teamMember
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding team member",
            error: error.message
        });
    }
});


// 3. GET - DISPLAY ALL TEAM MEMBERS

app.get("/api/team-members", async (req, res) => {
    try {
        const teamMembers = await TeamMember.find();

        res.json(teamMembers);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching team members",
            error: error.message
        });
    }
});

// 4. PUT - UPDATE TEAM MEMBER

app.put("/api/team-members/:id", async (req, res) => {
    try {
        const teamMember = await TeamMember.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!teamMember) {
            return res.status(404).json({
                message: "Team member not found"
            });
        }

        res.json({
            message: "Team member updated successfully",
            teamMember: teamMember
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating team member",
            error: error.message
        });
    }
});

app.delete("/api/team-members/:id", async (req, res) => {
    try {
        const teamMember = await TeamMember.findByIdAndDelete(
            req.params.id
        );

        if (!teamMember) {
            return res.status(404).json({
                message: "Team member not found"
            });
        }

        res.json({
            message: "Team member deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting team member",
            error: error.message
        });
    }
});
// ================= PAYMENTS =================

// 1. PAYMENT SCHEMA

const paymentSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    bookingId: String,
    amount: Number,
    paymentDate: String,
    paymentMethod: String,
    paymentStatus: String,
    transactionId: String
}, {
    collection: "payments"
});

const Payment = mongoose.model("Payment", paymentSchema);

// POST - ADD NEW PAYMENT
app.post("/api/payments", async (req, res) => {
    try {
        const { customerName, bookingId, amount, paymentDate,
                paymentMethod, paymentStatus, transactionId } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const payment = new Payment({
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            bookingId: String(booking._id),
            amount,
            paymentDate,
            paymentMethod,
            paymentStatus,
            transactionId
        });

        await payment.save();

        res.status(201).json({
            message: "Payment added successfully",
            payment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding payment",
            error: error.message
        });
    }
});


// 3. GET - DISPLAY ALL PAYMENTS

app.get("/api/payments", async (req, res) => {
    try {
        const payments = await Payment.find();

        res.json(payments);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching payments",
            error: error.message
        });
    }
});

// 4. PUT - UPDATE PAYMENT

app.put("/api/payments/:id", async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json({
            message: "Payment updated successfully",
            payment: payment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating payment",
            error: error.message
        });
    }
});

// 5. DELETE - DELETE PAYMENT

app.delete("/api/payments/:id", async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(
            req.params.id
        );

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json({
            message: "Payment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting payment",
            error: error.message
        });
    }
});

// ================= MEDIA DELIVERIES =================

// 1. MEDIA DELIVERY SCHEMA

const mediaDeliverySchema = new mongoose.Schema({
    customerName: String,
    bookingId: String,
    mediaType: String,
    deliveryDate: String,
    deliveryStatus: String,
    deliveryLink: String
}, {
    collection: "Mdeliveries"
});

const MediaDelivery = mongoose.model(
    "MediaDelivery",
    mediaDeliverySchema
);


// 2. POST - ADD MEDIA DELIVERY

app.post("/api/media-deliveries", async (req, res) => {
    try {
        const mediaDelivery = new MediaDelivery(req.body);

        await mediaDelivery.save();

        res.status(201).json({
            message: "Media delivery added successfully",
            mediaDelivery: mediaDelivery
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding media delivery",
            error: error.message
        });
    }
});


// 3. GET - DISPLAY ALL MEDIA DELIVERIES

app.get("/api/media-deliveries", async (req, res) => {
    try {
        const mediaDeliveries = await MediaDelivery.find();

        res.json(mediaDeliveries);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching media deliveries",
            error: error.message
        });
    }
});


// 4. PUT - UPDATE MEDIA DELIVERY

app.put("/api/media-deliveries/:id", async (req, res) => {
    try {
        const mediaDelivery = await MediaDelivery.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!mediaDelivery) {
            return res.status(404).json({
                message: "Media delivery not found"
            });
        }

        res.json({
            message: "Media delivery updated successfully",
            mediaDelivery: mediaDelivery
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating media delivery",
            error: error.message
        });
    }
});


// 5. DELETE - DELETE MEDIA DELIVERY

app.delete("/api/media-deliveries/:id", async (req, res) => {
    try {
        const mediaDelivery = await MediaDelivery.findByIdAndDelete(
            req.params.id
        );

        if (!mediaDelivery) {
            return res.status(404).json({
                message: "Media delivery not found"
            });
        }

        res.json({
            message: "Media delivery deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting media delivery",
            error: error.message
        });
    }
});

// ================= QUOTATIONS =================

// 1. QUOTATION SCHEMA

const quotationSchema = new mongoose.Schema({
    customerName: String,
    bookingId: String,
    packageName: String,
    amount: Number,
    discount: Number,
    totalAmount: Number,
    quotationDate: String,
    status: String
}, {
    collection: "quotations"
});

const Quotation = mongoose.model("Quotation", quotationSchema);


// 2. POST - ADD NEW QUOTATION

app.post("/api/quotations", async (req, res) => {
    try {
        const quotation = new Quotation(req.body);

        await quotation.save();

        res.status(201).json({
            message: "Quotation added successfully",
            quotation: quotation
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding quotation",
            error: error.message
        });
    }
});


// 3. GET - DISPLAY ALL QUOTATIONS

app.get("/api/quotations", async (req, res) => {
    try {
        const quotations = await Quotation.find();

        res.json(quotations);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching quotations",
            error: error.message
        });
    }
});


// 4. PUT - UPDATE QUOTATION

app.put("/api/quotations/:id", async (req, res) => {
    try {
        const quotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!quotation) {
            return res.status(404).json({
                message: "Quotation not found"
            });
        }

        res.json({
            message: "Quotation updated successfully",
            quotation: quotation
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating quotation",
            error: error.message
        });
    }
});


// 5. DELETE - DELETE QUOTATION

app.delete("/api/quotations/:id", async (req, res) => {
    try {
        const quotation = await Quotation.findByIdAndDelete(
            req.params.id
        );

        if (!quotation) {
            return res.status(404).json({
                message: "Quotation not found"
            });
        }

        res.json({
            message: "Quotation deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting quotation",
            error: error.message
        });
    }
});

// ================= ADMIN APPROVAL =================

// Approve Photographer or Editor
app.put("/api/users/:id/approve", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!["photographer", "editor"].includes(user.role)) {
            return res.status(400).json({
                message: "Only Photographer or Editor can be approved"
            });
        }

        user.status = "approved";
        await user.save();

        res.json({
            message: "Account approved successfully",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Approval error",
            error: error.message
        });
    }
});

// Get Pending Photographer and Editor Accounts
app.get("/api/users/pending", async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ["photographer", "editor"] },
            status: "pending"
        }).select("-password");

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching pending users",
            error: error.message
        });
    }
});

/* ============ PACKAGES ============ */

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    features: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: ""
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Package = mongoose.model("Package", packageSchema);


// GET - Active packages for customers
app.get("/api/packages", async (req, res) => {
    try {
        const packages = await Package.find({ active: true })
            .sort({ createdAt: -1 });

        res.json(packages);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching packages"
        });
    }
});


// GET - All packages for admin
app.get("/api/admin/packages", async (req, res) => {
    try {
        const packages = await Package.find()
            .sort({ createdAt: -1 });

        res.json(packages);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching packages"
        });
    }
});


// POST - Add package
app.post("/api/packages", async (req, res) => {
    try {
        const { name, category, price } = req.body;

        if (!name?.trim() || !category?.trim() ||
            price === undefined || price === "" ||
            !Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                message: "Valid name, category and price are required"
            });
        }

        const newPackage = new Package({
            ...req.body,
            price: Number(price)
        });

        await newPackage.save();

        res.status(201).json({
            message: "Package added successfully",
            package: newPackage
        });
    } catch (error) {
        res.status(500).json({
            message: "Error adding package"
        });
    }
});


// PUT - Update package
app.put("/api/packages/:id", async (req, res) => {
    try {
        const updatedPackage = await Package.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPackage) {
            return res.status(404).json({
                message: "Package not found"
            });
        }

        res.json({
            message: "Package updated successfully",
            package: updatedPackage
        });
    } catch (error) {
        res.status(400).json({
            message: "Error updating package"
        });
    }
});


// DELETE - Delete package
app.delete("/api/packages/:id", async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(
            req.params.id
        );

        if (!deletedPackage) {
            return res.status(404).json({
                message: "Package not found"
            });
        }

        res.json({
            message: "Package deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            message: "Error deleting package"
        });
    }
});

