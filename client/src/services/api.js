import axios from "axios";

// One Axios instance used by the whole app.
// withCredentials: true makes the browser send and receive cookies
// (our HTTP-only JWT cookie) on cross-origin requests.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Turns any Axios error into a friendly message string.
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return "Cannot reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
};

export default api;
