import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from './models/CreditCase.js';
import LegalCase from './models/LegalCase.js';
import User from './models/User.js';
import Department from './models/Department.js';
import LawFirm from './models/LawFirm.js';

// Load environment variables
dotenv.config();

async function fixDepartmentAssignments() {
  try {
    console.log('🚀 Starting Department Assignment Fix...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB successfully\n');
    
    // Get all law firms
    const lawFirms = await LawFirm.find({}).select('_id firmName').lean();
    
    if (lawFirms.length === 0) {
      console.log('❌ No law firms found in database');
      return;
    }
    
    console.log(`🏢 Found ${lawFirms.length} law firm(s):`);
    lawFirms.forEach((firm, index) => {
      console.log(`   ${index + 1}. ${firm.firmName} (ID: ${firm._id})`);
    });
    
    // Process each law firm
    for (const firm of lawFirms) {
      console.log(`\n🔧 Processing Law Firm: ${firm.firmName}`);
      console.log('='.repeat(60));
      
      // Get all data for this law firm
      const [users, departments, creditCases, legalCases] = await Promise.all([
        User.find({ lawFirm: firm._id }).lean(),
        Department.find({ lawFirm: firm._id }).lean(),
        CreditCase.find({ lawFirm: firm._id }).lean(),
        LegalCase.find({ lawFirm: firm._id }).lean()
      ]);
      
      console.log(`📊 Current Data:`);
      console.log(`   Users: ${users.length}`);
      console.log(`   Departments: ${departments.length}`);
      console.log(`   Credit Cases: ${creditCases.length}`);
      console.log(`   Legal Cases: ${legalCases.length}`);
      
      // Find cases without department assignments
      const creditCasesWithoutDept = creditCases.filter(c => !c.department);
      const legalCasesWithoutDept = legalCases.filter(c => !c.department);
      const usersWithoutDept = users.filter(u => !u.department);
      
      console.log(`\n❌ Unassigned Data:`);
      console.log(`   Credit Cases without department: ${creditCasesWithoutDept.length}`);
      console.log(`   Legal Cases without department: ${legalCasesWithoutDept.length}`);
      console.log(`   Users without department: ${usersWithoutDept.length}`);
      
      if (departments.length === 0) {
        console.log(`⚠️  No departments found for ${firm.firmName}. Skipping...`);
        continue;
      }
      
      // Find the appropriate departments
      const creditDept = departments.find(d => 
        d.departmentType === 'credit_collection' || 
        d.name.toLowerCase().includes('credit')
      );
      const legalDept = departments.find(d => 
        d.departmentType === 'legal' || 
        d.name.toLowerCase().includes('legal')
      );
      
      console.log(`\n🏢 Available Departments:`);
      departments.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.departmentType}) - ID: ${dept._id}`);
      });
      
      console.log(`\n🎯 Selected Departments:`);
      console.log(`   Credit Collection: ${creditDept ? creditDept.name : 'NOT FOUND'}`);
      console.log(`   Legal: ${legalDept ? legalDept.name : 'NOT FOUND'}`);
      
      let updatesCount = 0;
      
      // Assign credit cases to credit collection department
      if (creditDept && creditCasesWithoutDept.length > 0) {
        console.log(`\n📝 Assigning ${creditCasesWithoutDept.length} credit cases to ${creditDept.name}...`);
        
        const creditCaseIds = creditCasesWithoutDept.map(c => c._id);
        const creditResult = await CreditCase.updateMany(
          { _id: { $in: creditCaseIds } },
          { $set: { department: creditDept._id } }
        );
        
        console.log(`✅ Updated ${creditResult.modifiedCount} credit cases`);
        updatesCount += creditResult.modifiedCount;
      }
      
      // Assign legal cases to legal department
      if (legalDept && legalCasesWithoutDept.length > 0) {
        console.log(`\n📝 Assigning ${legalCasesWithoutDept.length} legal cases to ${legalDept.name}...`);
        
        const legalCaseIds = legalCasesWithoutDept.map(c => c._id);
        const legalResult = await LegalCase.updateMany(
          { _id: { $in: legalCaseIds } },
          { $set: { department: legalDept._id } }
        );
        
        console.log(`✅ Updated ${legalResult.modifiedCount} legal cases`);
        updatesCount += legalResult.modifiedCount;
      }
      
      // Assign users to departments based on their role
      if (usersWithoutDept.length > 0) {
        console.log(`\n👥 Assigning ${usersWithoutDept.length} users to departments...`);
        
        for (const user of usersWithoutDept) {
          let targetDept = null;
          
          // Assign based on role
          if (user.role === 'debt_collector' || user.role === 'credit_head') {
            targetDept = creditDept;
          } else if (user.role === 'advocate' || user.role === 'legal_head') {
            targetDept = legalDept;
          } else if (user.role === 'law_firm_admin') {
            // Admin can be assigned to any department, default to first available
            targetDept = departments[0];
          }
          
          if (targetDept) {
            await User.updateOne(
              { _id: user._id },
              { $set: { department: targetDept._id } }
            );
            console.log(`   ✅ Assigned ${user.firstName} ${user.lastName} (${user.role}) to ${targetDept.name}`);
          } else {
            console.log(`   ⚠️  Could not assign ${user.firstName} ${user.lastName} (${user.role}) - no suitable department`);
          }
        }
      }
      
      console.log(`\n📊 Summary for ${firm.firmName}:`);
      console.log(`   Total updates: ${updatesCount}`);
      
      // Verify the fixes
      console.log(`\n🔍 Verifying fixes...`);
      const [updatedUsers, updatedCreditCases, updatedLegalCases] = await Promise.all([
        User.find({ lawFirm: firm._id }).lean(),
        CreditCase.find({ lawFirm: firm._id }).lean(),
        LegalCase.find({ lawFirm: firm._id }).lean()
      ]);
      
      const usersWithDept = updatedUsers.filter(u => u.department).length;
      const creditCasesWithDept = updatedCreditCases.filter(c => c.department).length;
      const legalCasesWithDept = updatedLegalCases.filter(c => c.department).length;
      
      console.log(`✅ After fixes:`);
      console.log(`   Users with departments: ${usersWithDept}/${updatedUsers.length}`);
      console.log(`   Credit cases with departments: ${creditCasesWithDept}/${updatedCreditCases.length}`);
      console.log(`   Legal cases with departments: ${legalCasesWithDept}/${updatedLegalCases.length}`);
      
      console.log('\n' + '='.repeat(60));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Department assignment fix completed successfully!');
    console.log('\n💡 Your department performance data should now show accurate numbers.');
    console.log('🔄 Refresh your dashboard to see the updated data.');
    
  } catch (error) {
    console.error('❌ Department assignment fix failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your MONGO_URI in the .env file');
    console.error('3. Verify the database connection string');
    console.error('4. Ensure you have the correct permissions to access the database');
  }
}

// Run the fix
fixDepartmentAssignments();
