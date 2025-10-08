// src/config.js
const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api'
    : 'https://password-generator-z5e8.onrender.com/api';

export default API_BASE_URL;
