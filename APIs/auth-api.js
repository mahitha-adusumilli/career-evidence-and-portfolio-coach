import exp from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../MODELS/user-model.js";
import { verifyToken } from "../MIDDLEWARES/auth-middleware.js";

export const authApp = exp.Router();

authApp.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});


authApp.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

 const token = jwt.sign(
  {
    id: user._id,
    email: user.email
  },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h"
  }
);

res.status(200).json({
  success: true,
  message: "Login successful",
  token: token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});


authApp.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have accessed the protected route successfully!",
    user: req.user
  });
});