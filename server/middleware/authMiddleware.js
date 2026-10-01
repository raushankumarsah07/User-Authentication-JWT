import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { COOKIE_NAME } from "../utils/generateToken.js";

// The "security guard": runs before protected controllers.
export const protect = async (req, res, next) => {
  try {
    // 1. Read the JWT from the HTTP-only cookie
    const token = req.cookies?.[COOKIE_NAME];

    // 2. No token = not logged in
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated. Please log in." });
    }

    // 3. Verify signature + expiry. Throws if invalid or expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user (without the password)
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated. Please log in." });
    }

    // 5. Attach the user to the request so controllers can use it
    req.user = user;
    next();
  } catch (error) {
    // JsonWebTokenError / TokenExpiredError -> 401 (see errorMiddleware)
    next(error);
  }
};
