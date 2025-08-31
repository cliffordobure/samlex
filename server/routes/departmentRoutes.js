import express from "express";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentDetails,
} from "../controllers/departmentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { createLawFirmAdmin } from "../controllers/userController.js";

const router = express.Router();

// Routes for /api/departments
router
  .route("/")
  .get(protect, getDepartments)
  .post(protect, authorize("system_owner", "law_firm_admin"), createDepartment);

router
  .route("/:id")
  .get(protect, getDepartmentById)
  .put(protect, authorize("system_owner", "law_firm_admin"), updateDepartment)
  .delete(
    protect,
    authorize("system_owner", "law_firm_admin"),
    deleteDepartment
  );

router.post(
  "/create-law-firm-admin",
  protect,
  authorize("system_owner"),
  createLawFirmAdmin
);

router.get(
  "/:departmentId/details",
  protect,
  authorize("law_firm_admin"),
  getDepartmentDetails
);

export default router;
