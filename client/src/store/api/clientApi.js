import axios from "axios";
import { API_URL } from "../../config/api.js";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const clientApi = {
  // Get all clients with pagination and filters
  getClients: (params = {}) => api.get("/clients", { params }),
  
  // Get client by ID
  getClientById: (id) => api.get(`/clients/${id}`),
  
  // Create new client
  createClient: (data) => api.post("/clients", data),
  
  // Update client
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  
  // Delete client
  deleteClient: (id) => api.delete(`/clients/${id}`),
  
  // Search clients
  searchClients: (query, limit = 10) => 
    api.get("/clients/search", { params: { q: query, limit } }),
  
  // Get client statistics
  getClientStats: () => api.get("/clients/stats"),
  
  // Get active clients (for dropdowns/selects)
  getActiveClients: (params = {}) => 
    api.get("/clients", { params: { ...params, status: "active", limit: 100 } }),
};

export default clientApi;

