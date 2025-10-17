import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clientApi from "../api/clientApi.js";
import toast from "react-hot-toast";

// Async thunks
export const fetchClients = createAsyncThunk(
  "clients/fetchClients",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getClients(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch clients");
    }
  }
);

export const fetchClientById = createAsyncThunk(
  "clients/fetchClientById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await clientApi.getClientById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch client");
    }
  }
);

export const createClient = createAsyncThunk(
  "clients/createClient",
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientApi.createClient(clientData);
      toast.success("Client created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create client");
      return rejectWithValue(error.response?.data?.message || "Failed to create client");
    }
  }
);

export const updateClient = createAsyncThunk(
  "clients/updateClient",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await clientApi.updateClient(id, data);
      toast.success("Client updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update client");
      return rejectWithValue(error.response?.data?.message || "Failed to update client");
    }
  }
);

export const deleteClient = createAsyncThunk(
  "clients/deleteClient",
  async (id, { rejectWithValue }) => {
    try {
      await clientApi.deleteClient(id);
      toast.success("Client deleted successfully");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete client");
      return rejectWithValue(error.response?.data?.message || "Failed to delete client");
    }
  }
);

export const searchClients = createAsyncThunk(
  "clients/searchClients",
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await clientApi.searchClients(query, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to search clients");
    }
  }
);

export const fetchClientStats = createAsyncThunk(
  "clients/fetchClientStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientApi.getClientStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch client statistics");
    }
  }
);

export const fetchActiveClients = createAsyncThunk(
  "clients/fetchActiveClients",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getActiveClients(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch active clients");
    }
  }
);

// Initial state
const initialState = {
  clients: [],
  currentClient: null,
  activeClients: [],
  searchResults: [],
  stats: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  searching: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {
    search: "",
    clientType: "",
    status: "active",
    department: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

// Client slice
const clientSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetClients: (state) => {
      state.clients = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch client by ID
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload.data;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create client
      .addCase(createClient.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.creating = false;
        state.clients.unshift(action.payload.data);
        state.pagination.total += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update client
      .addCase(updateClient.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.clients.findIndex(client => client._id === action.payload.data._id);
        if (index !== -1) {
          state.clients[index] = action.payload.data;
        }
        if (state.currentClient && state.currentClient._id === action.payload.data._id) {
          state.currentClient = action.payload.data;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.deleting = false;
        state.clients = state.clients.filter(client => client._id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentClient && state.currentClient._id === action.payload) {
          state.currentClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })
      
      // Search clients
      .addCase(searchClients.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.searching = false;
        state.searchResults = action.payload.data;
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.searching = false;
        state.error = action.payload;
      })
      
      // Fetch client stats
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      
      // Fetch active clients
      .addCase(fetchActiveClients.fulfilled, (state, action) => {
        state.activeClients = action.payload.data;
      });
  },
});

export const {
  clearError,
  clearCurrentClient,
  clearSearchResults,
  setFilters,
  clearFilters,
  resetClients,
} = clientSlice.actions;

export default clientSlice.reducer;
