import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateToken,
  sendTokenCookie,
  clearTokenCookie,
} from "../utils/generateToken.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // 8+ chars, letter + number

// Helper: only these fields are ever sent to the client
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

// Helper: create an error with an HTTP status
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// @route  POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    // 1. Validate input
    if (!name || !email || !password) {
      throw httpError(400, "Name, email and password are required");
    }
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      throw httpError(400, "Invalid input");
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      throw httpError(400, "Please provide a valid email");
    }
    if (!PASSWORD_REGEX.test(password)) {
      throw httpError(
        400,
        "Password must be at least 8 characters and contain a letter and a number"
      );
    }

    // 2. Check if the email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw httpError(409, "An account with this email already exists");
    }

    // 3. Hash the password (10 = salt rounds, i.e. how slow/strong)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save the user. The hash is stored, never the real password.
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 5. Respond (no password, no user data needed)
    res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // 1. Validate input
    if (!email || !password) {
      throw httpError(400, "Email and password are required");
    }
    if (typeof email !== "string" || typeof password !== "string") {
      throw httpError(400, "Invalid input");
    }

    // 2. Find the user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // 3. Compare the typed password with the stored hash.
    // Same message for "no user" and "wrong password" so attackers
    // cannot find out which emails are registered.
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) {
      throw httpError(401, "Invalid email or password");
    }

    // 4. Generate JWT and put it in an HTTP-only cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    // 5. Return safe user info
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/auth/me   (protected)
export const getMe = (req, res) => {
  // req.user was set by the protect middleware
  res.status(200).json({ success: true, user: safeUser(req.user) });
};

// @route  POST /api/auth/logout
export const logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
