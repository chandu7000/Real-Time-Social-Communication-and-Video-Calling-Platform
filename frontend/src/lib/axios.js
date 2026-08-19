import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:7001/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
