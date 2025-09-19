import mongoose from "mongoose";
import User from "../models/User.js";
import CreditCase from "../models/CreditCase.js";
import LegalCase from "../models/LegalCase.js";
import Department from "../models/Department.js";
import LawFirm from "../models/LawFirm.js";
import config from "../config/config.js";

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI);

async function assignDepartments() {
  try {
    console.log("🚀 Starting department assignment process...");

    // Get all law firms
    const lawFirms = await LawFirm.find({});
    console.log(`📊 Found ${lawFirms.length} law firms`);

    for (const lawFirm of lawFirms) {
      console.log(`\n🏢 Processing law firm: ${lawFirm.name} (${lawFirm._id})`);

      // Get departments for this law firm
      const departments = await Department.find({ lawFirm: lawFirm._id });
      console.log(`📁 Found ${departments.length} departments:`, departments.map(d => d.name));

      if (departments.length === 0) {
        console.log("⚠️ No departments found for this law firm, skipping...");
        continue;
      }

      // Find credit collection and legal departments
      const creditDept = departments.find(d => d.departmentType === "credit_collection");
      const legalDept = departments.find(d => d.departmentType === "legal");

      console.log(`💳 Credit Collection Dept:`, creditDept ? creditDept.name : "Not found");
      console.log(`⚖️ Legal Dept:`, legalDept ? legalDept.name : "Not found");

      // Assign users to departments based on their roles
      const users = await User.find({ lawFirm: lawFirm._id });
      console.log(`👥 Found ${users.length} users`);

      let usersUpdated = 0;
      for (const user of users) {
        let targetDept = null;
        
        // Assign users to departments based on their roles
        if (["credit_head", "debt_collector"].includes(user.role) && creditDept) {
          targetDept = creditDept._id;
        } else if (["legal_head", "advocate"].includes(user.role) && legalDept) {
          targetDept = legalDept._id;
        } else if (user.role === "law_firm_admin") {
          // Admin can be assigned to either department, prefer legal
          targetDept = legalDept ? legalDept._id : (creditDept ? creditDept._id : null);
        }

        if (targetDept && (!user.department || user.department.toString() !== targetDept.toString())) {
          await User.findByIdAndUpdate(user._id, { department: targetDept });
          console.log(`✅ Assigned user ${user.firstName} ${user.lastName} (${user.role}) to department`);
          usersUpdated++;
        }
      }
      console.log(`👥 Updated ${usersUpdated} users`);

      // Assign credit cases to credit collection department
      if (creditDept) {
        const creditCases = await CreditCase.find({ lawFirm: lawFirm._id });
        console.log(`💳 Found ${creditCases.length} credit cases`);

        let creditCasesUpdated = 0;
        for (const creditCase of creditCases) {
          if (!creditCase.department || creditCase.department.toString() !== creditDept._id.toString()) {
            await CreditCase.findByIdAndUpdate(creditCase._id, { department: creditDept._id });
            console.log(`✅ Assigned credit case ${creditCase.caseNumber} to credit collection department`);
            creditCasesUpdated++;
          }
        }
        console.log(`💳 Updated ${creditCasesUpdated} credit cases`);
      }

      // Assign legal cases to legal department
      if (legalDept) {
        const legalCases = await LegalCase.find({ lawFirm: lawFirm._id });
        console.log(`⚖️ Found ${legalCases.length} legal cases`);

        let legalCasesUpdated = 0;
        for (const legalCase of legalCases) {
          if (!legalCase.department || legalCase.department.toString() !== legalDept._id.toString()) {
            await LegalCase.findByIdAndUpdate(legalCase._id, { department: legalDept._id });
            console.log(`✅ Assigned legal case ${legalCase.caseNumber} to legal department`);
            legalCasesUpdated++;
          }
        }
        console.log(`⚖️ Updated ${legalCasesUpdated} legal cases`);
      }
    }

    console.log("\n🎉 Department assignment completed successfully!");
    
    // Verify the results
    console.log("\n📊 Verification:");
    const totalUsers = await User.countDocuments();
    const usersWithDept = await User.countDocuments({ department: { $exists: true, $ne: null } });
    const totalCreditCases = await CreditCase.countDocuments();
    const creditCasesWithDept = await CreditCase.countDocuments({ department: { $exists: true, $ne: null } });
    const totalLegalCases = await LegalCase.countDocuments();
    const legalCasesWithDept = await LegalCase.countDocuments({ department: { $exists: true, $ne: null } });

    console.log(`👥 Users: ${usersWithDept}/${totalUsers} have departments`);
    console.log(`💳 Credit Cases: ${creditCasesWithDept}/${totalCreditCases} have departments`);
    console.log(`⚖️ Legal Cases: ${legalCasesWithDept}/${totalLegalCases} have departments`);

  } catch (error) {
    console.error("❌ Error assigning departments:", error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
assignDepartments();
