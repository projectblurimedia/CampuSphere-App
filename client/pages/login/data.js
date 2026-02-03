// Mock staff database
export const STAFF_DATABASE = [
  { 
    staffId: 'STAFF001',
    email: 'staff@school.com', 
    password: 'Staff@123', 
    name: 'John Doe', 
    role: 'Teacher',
    hasPassword: true 
  },
  { 
    staffId: 'ADMIN001',
    email: 'admin@school.com', 
    password: 'Admin@123', 
    name: 'Admin User', 
    role: 'Administrator',
    hasPassword: true 
  },
  { 
    staffId: 'PRINCIPAL001',
    email: 'principal@school.com', 
    password: 'Principal@123', 
    name: 'Principal', 
    role: 'Principal',
    hasPassword: true 
  },
  { 
    staffId: 'NEW001',
    email: 'newstaff@school.com', 
    password: '', 
    name: 'New Staff', 
    role: 'Teacher',
    hasPassword: false 
  },
]