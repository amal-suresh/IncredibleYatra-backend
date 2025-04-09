const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Package = require("../models/Package");
const Booking = require("../models/Booking");
const nodemailer = require("nodemailer")


const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.role === "admin") {
            const token = generateToken(user._id, "admin");
            return res.status(200).json({
                message: "Admin login successful",
                user: {
                    role: "admin",
                },
                token,
            });
        }

        if (user.role === "user") {
            const token = generateToken(user._id, "user");
            return res.status(200).json({
                message: "User login successful",
                user: {
                    name: user.name,
                    role: "user",
                },
                token,
            });
        }

        // Unknown role fallback
        res.status(400).json({ message: "Invalid user role" });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};




const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(200).json({
            message: "Registration Successfull",
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getVisiblePackages = async (req, res) => {
    try {
        const { search = "", sort = "", page = 1, limit = 6 } = req.query;

        const query = {
            isVisible: true,
            $or: [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ],
        };

        let sortOption = {};
        if (sort === "asc") sortOption = { pricePerPerson: 1 };
        else if (sort === "desc") sortOption = { pricePerPerson: -1 };

        const totalPackages = await Package.countDocuments(query);
        const packages = await Package.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const totalPages = Math.ceil(totalPackages / limit);

        res.status(200).json({
            data: packages,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



const getPackageById = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);

        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }
        res.status(200).json(pkg);
    } catch (error) {
        console.error("Error fetching package by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getBookingDetails = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findOne({ _id: bookingId, userId })
            .populate("userId", "name email")
            .populate("packageId", "title location duration pricePerPerson images");

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.status(200).json({ success: true, booking });
    } catch (err) {
        console.error("Error fetching booking:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getUserBookingsWithProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select("name email");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const bookings = await Booking.find({ userId })
            .populate("packageId", "title location duration pricePerPerson images _id")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
            },
            bookings,
        });
    } catch (err) {
        console.error("Error fetching user bookings:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const sendContactMail = async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.GMAIL_USER,
        subject: `Message from ${name}`,
        html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send email", error });
    }
};



module.exports = { registerUser, loginUser, getVisiblePackages, getPackageById, getBookingDetails, getUserBookingsWithProfile, sendContactMail };
