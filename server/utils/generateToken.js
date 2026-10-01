import jwt from "jsonwebtoken";

export const COOKIE_NAME = "authToken";

// Creates a signed JWT that contains ONLY the user id.
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// Cookie options. The cookie lifetime is taken from the token's own
// expiry, so the cookie and the JWT always expire together.
const isProduction = () => process.env.NODE_ENV === "production";

const baseCookieOptions = () => ({
  httpOnly: true, // JavaScript cannot read it (protects against XSS)
  secure: isProduction(), // HTTPS only in production
  // "lax" works for localhost (same site). In production the frontend
  // (Vercel) and backend (Render) are different sites, so we need "none"
  // (which requires secure: true).
  sameSite: isProduction() ? "none" : "lax",
});

export const sendTokenCookie = (res, token) => {
  const { exp } = jwt.decode(token); // exp is in seconds
  const maxAge = exp * 1000 - Date.now(); // convert to milliseconds
  res.cookie(COOKIE_NAME, token, { ...baseCookieOptions(), maxAge });
};

// To delete a cookie, the options must match the ones used to set it.
export const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
};
