const userModel = require("../models/user.model");
const blacklistTokenModel = require("../models/blacklist.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body;
        const user = await userModel.findOne({ username });
        const emailcheck = await userModel.findOne({ email });
        if (user || emailcheck) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hash = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({ username, email, password: hash });

        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )
        res.cookie("token", token);
        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )
        res.cookie("token", token);
        return res.status(200).json({
            message: "User logged in successfully", user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function logoutUser(req, res) {
    const token = req.cookies.token;
    if (token) {
        await blacklistTokenModel.create({ token })
    }
    res.clearCookie("token")
    return res.status(200).json({ message: "User logged out successfully" });
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id);
    return res.status(200).json({ message: "User fetched successfully", user: { id: user._id, username: user.username, email: user.email } });
}

module.exports = { registerUser, loginUser, logoutUser, getMeController };

