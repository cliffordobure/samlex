import mongoose from "mongoose";

// Shared counter schema for atomic case number generation
const caseNumberCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 1 },
  year: { type: Number, required: true },
  prefix: { type: String, required: true },
  lawFirm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LawFirm",
    required: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  escalated: { type: Boolean, default: false },
});

// Export the model (Mongoose will handle singleton pattern)
const CaseNumberCounter = mongoose.models.CaseNumberCounter || 
  mongoose.model("CaseNumberCounter", caseNumberCounterSchema);

export default CaseNumberCounter;
