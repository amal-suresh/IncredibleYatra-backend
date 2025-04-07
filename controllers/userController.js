const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


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
            const token = generateToken(user._id,"admin");
            return res.status(200).json({
                message: "Admin login successful",
                user: {
                    role: "admin",
                },
                token,
            });
        }

        if (user.role === "user") {
            const token = generateToken(user._id,"user");
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

module.exports = { registerUser, loginUser };
