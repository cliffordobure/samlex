import Client from "../models/Client.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Private (law_firm_admin, legal_head, credit_head)
 */
export const createClient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      dateOfBirth,
      idNumber,
      clientType,
      companyName,
      registrationNumber,
      businessType,
      preferredDepartment,
      notes,
      emergencyContact,
      tags,
      profileImage,
    } = req.body;

    console.log("=== DEBUG: createClient ===");
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and phone number are required",
      });
    }

    // Check if client with email already exists in this law firm (only if email is provided)
    if (email && email.trim()) {
      const existingClient = await Client.findOne({
        email: email.toLowerCase(),
        lawFirm: req.user.lawFirm._id,
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: "Client with this email already exists",
        });
      }
    }

    // Create new client
    const client = new Client({
      firstName,
      lastName,
      email: email && email.trim() ? email.toLowerCase() : null,
      phoneNumber,
      address,
      dateOfBirth,
      idNumber,
      clientType,
      companyName,
      registrationNumber,
      businessType,
      preferredDepartment,
      notes,
      emergencyContact,
      tags,
      profileImage,
      lawFirm: req.user.lawFirm._id,
      createdBy: req.user._id,
    });

    const savedClient = await client.save();
    
    // Populate the response
    await savedClient.populate([
      { path: "preferredDepartment", select: "name code" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    res.status(201).json({
      success: true,
      data: savedClient,
      message: "Client created successfully",
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating client",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all clients for a law firm
 * @route   GET /api/clients
 * @access  Private (law_firm_admin, legal_head, credit_head, advocate, debt_collector)
 */
export const getClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      clientType,
      status = "active",
      department,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    console.log("=== DEBUG: getClients ===");
    console.log("Query params:", req.query);
    console.log("User:", req.user);

    // Build filter object
    const filter = {
      lawFirm: req.user.lawFirm._id,
    };

    if (status !== "all") {
      filter.status = status;
    }

    if (clientType) {
      filter.clientType = clientType;
    }

    if (department) {
      filter.preferredDepartment = department;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { idNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get clients with pagination
    const clients = await Client.find(filter)
      .populate("preferredDepartment", "name code")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Client.countDocuments(filter);

    res.json({
      success: true,
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting clients:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting clients",
      error: error.message,
    });
  }
};

/**
 * @desc    Get client by ID
 * @route   GET /api/clients/:id
 * @access  Private (law_firm_admin, legal_head, credit_head, advocate, debt_collector)
 */
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
    }

    const client = await Client.findById(id)
      .populate("preferredDepartment", "name code")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify the client belongs to the user's law firm
    if (client.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this client",
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error getting client by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting client",
      error: error.message,
    });
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private (law_firm_admin, legal_head, credit_head)
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("=== DEBUG: updateClient ===");
    console.log("Client ID:", id);
    console.log("Update data:", updateData);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify the client belongs to the user's law firm
    if (client.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this client",
      });
    }

    // Check if email is being updated and if it already exists (only if email is provided)
    if (updateData.email && updateData.email.trim() && updateData.email !== client.email) {
      const existingClient = await Client.findOne({
        email: updateData.email.toLowerCase(),
        lawFirm: req.user.lawFirm._id,
        _id: { $ne: id },
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: "Client with this email already exists",
        });
      }
      updateData.email = updateData.email.toLowerCase();
    } else if (updateData.email === "" || updateData.email === null) {
      // Allow clearing email
      updateData.email = null;
    }

    // Add updatedBy field
    updateData.updatedBy = req.user._id;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("preferredDepartment", "name code")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    res.json({
      success: true,
      data: updatedClient,
      message: "Client updated successfully",
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating client",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private (law_firm_admin)
 */
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify the client belongs to the user's law firm
    if (client.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this client",
      });
    }

    // Check if client has active cases
    // Note: You might want to add checks for LegalCase and CreditCase models
    // For now, we'll just delete the client

    await Client.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting client",
      error: error.message,
    });
  }
};

/**
 * @desc    Get client statistics
 * @route   GET /api/clients/stats
 * @access  Private (law_firm_admin, legal_head, credit_head)
 */
export const getClientStats = async (req, res) => {
  try {
    const lawFirmId = req.user.lawFirm._id;

    const stats = await Client.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          activeClients: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactiveClients: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          individualClients: {
            $sum: { $cond: [{ $eq: ["$clientType", "individual"] }, 1, 0] },
          },
          corporateClients: {
            $sum: { $cond: [{ $eq: ["$clientType", "corporate"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get clients by department
    const clientsByDepartment = await Client.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $lookup: {
          from: "departments",
          localField: "preferredDepartment",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: { path: "$department", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$department.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get recent clients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClients = await Client.countDocuments({
      lawFirm: lawFirmId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const result = {
      ...stats[0],
      clientsByDepartment,
      recentClients,
    };

    // Remove the _id field
    delete result._id;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting client stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting client statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Search clients
 * @route   GET /api/clients/search
 * @access  Private (law_firm_admin, legal_head, credit_head, advocate, debt_collector)
 */
export const searchClients = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const clients = await Client.find({
      lawFirm: req.user.lawFirm._id,
      status: "active",
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phoneNumber: { $regex: q, $options: "i" } },
        { companyName: { $regex: q, $options: "i" } },
      ],
    })
      .select("firstName lastName email phoneNumber companyName clientType displayName")
      .limit(parseInt(limit))
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error("Error searching clients:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching clients",
      error: error.message,
    });
  }
};

