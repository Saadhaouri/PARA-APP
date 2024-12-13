// axiosConfig.ts

import axios from "axios";

const axiosApi = axios.create({
  baseURL: "http://localhost:5133",
  timeout: 10000, // Optional: Set timeout for requests
  headers: {
    "Content-Type": "application/json", // Optional: Set default headers
  },
});

export default axiosApi;
