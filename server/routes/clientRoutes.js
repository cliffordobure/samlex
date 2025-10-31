import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  searchClients,
} from "../controllers/clientController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Client routes
router.route("/").get(getClients).post(createClient);
router.route("/search").get(searchClients);
router.route("/stats").get(getClientStats);
router.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);

export default router;

