// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { User, SystemOwner, LawFirm } from "../models/index.js";
import config from "../config/config.js";

// Protect routes - general authentication
export const protect = async (req, res, next) => {
  console.log("🔐 Protecting route:", req.method, req.path);
  console.log("📥 Authorization header:", req.headers.authorization);

  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log(
        "🎫 Extracted token:",
        token ? `${token.substring(0, 20)}...` : "undefined"
      );
    }

    // Make sure token exists
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      console.log("🔍 Verifying token...");
      const decoded = jwt.verify(token, config.JWT_SECRET);
      console.log("✅ Token decoded successfully:", {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      });

      // Get user from token based on role
      if (decoded.role === "system_owner") {
        req.user = await SystemOwner.findById(decoded.id);
        console.log(
          "👑 System owner found:",
          req.user ? req.user.email : "Not found"
        );
      } else if (decoded.role === "law_firm") {
        req.user = await LawFirm.findById(decoded.id);
        // Ensure law firm has role field
        if (req.user && !req.user.role) {
          req.user.role = "law_firm";
        }
        console.log(
          "🏢 Law firm found:",
          req.user ? req.user.firmName : "Not found"
        );
      } else {
        req.user = await User.findById(decoded.id)
          .populate("lawFirm")
          .populate("department");

        // Ensure lawFirm is properly populated
        if (
          req.user &&
          req.user.lawFirm &&
          typeof req.user.lawFirm === "object" &&
          req.user.lawFirm.buffer
        ) {
          // If lawFirm is a buffer, it means it wasn't properly populated
          console.log(
            "⚠️ Law firm not properly populated, re-fetching user..."
          );
          req.user = await User.findById(decoded.id)
            .populate("lawFirm")
            .populate("department");
        }

        console.log("👤 User found:", req.user ? req.user.email : "Not found");
        if (req.user && req.user.lawFirm) {
          console.log(
            "🏢 Law firm:",
            req.user.lawFirm.firmName || req.user.lawFirm._id
          );
        }
      }

      if (!req.user) {
        console.log("❌ User not found in database");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (!req.user.isActive) {
        console.log("❌ User account is deactivated");
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      console.log(
        "✅ Authentication successful for:",
        req.user.email || req.user.firmEmail,
        "Role:",
        req.user.role
      );
      next();
    } catch (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    console.error("❌ Server error in authentication:", error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Generate JWT token
export const getSignedJwtToken = function (user) {
  // Determine role based on user type
  let role = user.role;

  // If no role is set, determine based on user type
  if (!role) {
    if (user.firmEmail) {
      role = "law_firm";
    } else if (user.email && user.role === "system_owner") {
      role = "system_owner";
    } else {
      role = "user";
    }
  }

  const payload = {
    id: user._id,
    email: user.email || user.firmEmail,
    role: role,
    lawFirm: user.lawFirm || null,
    department: user.department || null,
  };

  console.log(
    "🎫 Generating token for user:",
    payload.email,
    "Role:",
    payload.role
  );

  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });

  console.log("✅ Token generated successfully");
  return token;
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Tenant isolation middleware
export const tenantIsolation = async (req, res, next) => {
  try {
    // Skip for system owners
    if (req.user.role === "system_owner") {
      return next();
    }

    // Ensure user belongs to a law firm
    if (!req.user.lawFirm) {
      return res.status(403).json({
        success: false,
        message: "User not associated with any law firm",
      });
    }

    // Add law firm context to request
    req.lawFirm = req.user.lawFirm;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error in tenant isolation",
    });
  }
};

// Department access control
export const departmentAccess = (...departmentTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Skip for system owners and law firm admins
    if (
      req.user.role === "system_owner" ||
      req.user.role === "law_firm_admin"
    ) {
      return next();
    }

    if (!req.user.department) {
      return res.status(403).json({
        success: false,
        message: "User not assigned to any department",
      });
    }

    if (!departmentTypes.includes(req.user.department.departmentType)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this department resource",
      });
    }

    next();
  };
};
