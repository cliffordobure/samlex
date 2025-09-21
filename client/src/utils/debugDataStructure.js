// Debug utility to help analyze data structure issues
export const debugDataStructure = (data, label = 'Data') => {
  console.log(`🔍 ${label} Structure Analysis:`);
  console.log('Type:', typeof data);
  console.log('Is Array:', Array.isArray(data));
  console.log('Length:', Array.isArray(data) ? data.length : 'N/A');
  
  if (data && typeof data === 'object') {
    console.log('Keys:', Object.keys(data));
    
    if (Array.isArray(data)) {
      console.log('First item structure:', data[0] ? Object.keys(data[0]) : 'No items');
      if (data.length > 0) {
        console.log('Sample item:', data[0]);
      }
    } else {
      console.log('Data structure:', data);
    }
  }
  
  console.log('---');
};

export const debugDepartmentAssignments = (users, cases, departments) => {
  console.log('🏢 Department Assignment Analysis:');
  
  // Analyze users
  const usersWithDept = users.filter(u => u.department);
  const usersWithoutDept = users.filter(u => !u.department);
  
  console.log(`Users: ${users.length} total, ${usersWithDept.length} with departments, ${usersWithoutDept.length} without`);
  
  // Analyze cases
  const creditCasesWithDept = cases.creditCases.filter(c => c.department);
  const creditCasesWithoutDept = cases.creditCases.filter(c => !c.department);
  const legalCasesWithDept = cases.legalCases.filter(c => c.department);
  const legalCasesWithoutDept = cases.legalCases.filter(c => !c.department);
  
  console.log(`Credit Cases: ${cases.creditCases.length} total, ${creditCasesWithDept.length} with departments, ${creditCasesWithoutDept.length} without`);
  console.log(`Legal Cases: ${cases.legalCases.length} total, ${legalCasesWithDept.length} with departments, ${legalCasesWithoutDept.length} without`);
  
  // Show department IDs for reference
  console.log('Department IDs:', departments.map(d => ({ name: d.name, id: d._id })));
  
  // Show sample assignments
  if (usersWithDept.length > 0) {
    console.log('Sample user department assignments:', usersWithDept.slice(0, 3).map(u => ({ 
      name: `${u.firstName} ${u.lastName}`, 
      dept: u.department 
    })));
  }
  
  if (creditCasesWithDept.length > 0) {
    console.log('Sample credit case department assignments:', creditCasesWithDept.slice(0, 3).map(c => ({ 
      title: c.title, 
      dept: c.department 
    })));
  }
  
  if (legalCasesWithDept.length > 0) {
    console.log('Sample legal case department assignments:', legalCasesWithDept.slice(0, 3).map(c => ({ 
      title: c.title, 
      dept: c.department 
    })));
  }
  
  console.log('---');
};

export const validateObjectIdComparison = (id1, id2, label = 'IDs') => {
  const str1 = typeof id1 === 'object' && id1?._id ? id1._id.toString() : (id1 ? id1.toString() : '');
  const str2 = typeof id2 === 'object' && id2?._id ? id2._id.toString() : (id2 ? id2.toString() : '');
  
  console.log(`🔗 ${label} Comparison:`);
  console.log(`ID1: "${str1}" (type: ${typeof id1})`);
  console.log(`ID2: "${str2}" (type: ${typeof id2})`);
  console.log(`Match: ${str1 === str2}`);
  console.log('---');
  
  return str1 === str2;
};
