const { mapClassToNumber, mapNumberToClassName } = require('./student.attendance.service');

// ================= FEE HELPER FUNCTIONS =================

// Helper function to generate payment ID
const generatePaymentId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

// Helper function to generate receipt number
const generateReceiptNo = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCPT-${year}${month}${day}-${random}`;
};

// ================= FEE INSTANCE METHODS =================

// Method to set or update fee details for an academic year with discounts
const setFeeDetails = async function(academicYear, schoolFee, transportFee, hostelFee, discounts = {}) {
  // Validate based on student type and transport usage
  if (this.studentType === 'Day Scholar' && hostelFee > 0) {
    throw new Error('Day scholar cannot have hostel fee');
  }
  
  if (!this.isUsingSchoolTransport && transportFee > 0) {
    throw new Error('Student is not using school transport');
  }
  
  // Apply student-level discounts if not provided
  const schoolFeeDiscount = discounts.schoolFeeDiscount !== undefined ? discounts.schoolFeeDiscount : this.schoolFeeDiscount;
  const transportFeeDiscount = discounts.transportFeeDiscount !== undefined ? discounts.transportFeeDiscount : this.transportFeeDiscount;
  const hostelFeeDiscount = discounts.hostelFeeDiscount !== undefined ? discounts.hostelFeeDiscount : this.hostelFeeDiscount;
  
  // Find or create fee record for academic year
  let feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  );
  
  if (!feeRecord) {
    feeRecord = {
      academicYear,
      schoolFee: schoolFee || 0,
      transportFee: this.isUsingSchoolTransport ? (transportFee || 0) : 0,
      hostelFee: this.studentType === 'Hosteller' ? (hostelFee || 0) : 0,
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      terms: 3,
      totalPaid: 0,
      totalDue: 0,
      schoolFeeDiscountApplied: schoolFeeDiscount,
      transportFeeDiscountApplied: transportFeeDiscount,
      hostelFeeDiscountApplied: hostelFeeDiscount
    };
    this.feeDetails.push(feeRecord);
  } else {
    feeRecord.schoolFee = schoolFee || 0;
    feeRecord.transportFee = this.isUsingSchoolTransport ? (transportFee || 0) : 0;
    feeRecord.hostelFee = this.studentType === 'Hosteller' ? (hostelFee || 0) : 0;
    feeRecord.schoolFeeDiscountApplied = schoolFeeDiscount;
    feeRecord.transportFeeDiscountApplied = transportFeeDiscount;
    feeRecord.hostelFeeDiscountApplied = hostelFeeDiscount;
    feeRecord.updatedAt = new Date();
  }
  
  // Calculate totals (fees should already have discounts applied from controller)
  feeRecord.totalFee = feeRecord.schoolFee + feeRecord.transportFee + feeRecord.hostelFee;
  
  // Calculate due amount (totalFee - totalPaid)
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid);
  
  return this.save();
};

// Method to update student-level discount percentages
const updateDiscounts = async function(schoolFeeDiscount, transportFeeDiscount, hostelFeeDiscount) {
  this.schoolFeeDiscount = schoolFeeDiscount || 0;
  this.transportFeeDiscount = transportFeeDiscount || 0;
  this.hostelFeeDiscount = hostelFeeDiscount || 0;
  
  return this.save();
};

// Method to get fee details for an academic year
const getFeeDetails = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  );
  
  if (!feeRecord) return null;
  
  return {
    academicYear: feeRecord.academicYear,
    schoolFee: feeRecord.schoolFee,
    transportFee: feeRecord.transportFee,
    hostelFee: feeRecord.hostelFee,
    totalFee: feeRecord.totalFee,
    schoolFeePaid: feeRecord.schoolFeePaid,
    transportFeePaid: feeRecord.transportFeePaid,
    hostelFeePaid: feeRecord.hostelFeePaid,
    totalPaid: feeRecord.totalPaid,
    totalDue: feeRecord.totalDue,
    schoolFeeDiscountApplied: feeRecord.schoolFeeDiscountApplied,
    transportFeeDiscountApplied: feeRecord.transportFeeDiscountApplied,
    hostelFeeDiscountApplied: feeRecord.hostelFeeDiscountApplied,
    schoolFeeDue: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
    transportFeeDue: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
    hostelFeeDue: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
    createdAt: feeRecord.createdAt,
    updatedAt: feeRecord.updatedAt
  };
};

// Method to record a payment with individual fee components
const recordPayment = async function(
  academicYear, 
  paymentData,
  receivedBy, 
  options = {}
) {
  const {
    schoolFeePaid = 0,
    transportFeePaid = 0,
    hostelFeePaid = 0,
    description = '',
    paymentMode = 'Cash',
    chequeNo = '',
    bankName = '',
    transactionId = '',
    notes = '',
    customReceiptNo = null,
    customPaymentId = null
  } = paymentData;
  
  // Validate at least one fee component is being paid
  const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid;
  if (totalAmount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  
  // Get fee details for this academic year
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  );
  
  if (!feeRecord) {
    throw new Error('Fee details not found for this academic year');
  }
  
  // Validate payment amounts don't exceed due amounts
  if (schoolFeePaid > (feeRecord.schoolFee - feeRecord.schoolFeePaid)) {
    throw new Error(`School fee payment exceeds due amount. Due: ${feeRecord.schoolFee - feeRecord.schoolFeePaid}, Trying to pay: ${schoolFeePaid}`);
  }
  
  if (transportFeePaid > (feeRecord.transportFee - feeRecord.transportFeePaid)) {
    throw new Error(`Transport fee payment exceeds due amount. Due: ${feeRecord.transportFee - feeRecord.transportFeePaid}, Trying to pay: ${transportFeePaid}`);
  }
  
  if (hostelFeePaid > (feeRecord.hostelFee - feeRecord.hostelFeePaid)) {
    throw new Error(`Hostel fee payment exceeds due amount. Due: ${feeRecord.hostelFee - feeRecord.hostelFeePaid}, Trying to pay: ${hostelFeePaid}`);
  }
  
  // Generate unique payment ID and receipt number
  const paymentId = customPaymentId || generatePaymentId();
  const receiptNo = customReceiptNo || generateReceiptNo();
  
  // Create payment record
  const paymentRecord = {
    paymentId,
    academicYear,
    date: new Date(),
    schoolFeePaid,
    transportFeePaid,
    hostelFeePaid,
    totalAmount,
    receiptNo,
    paymentMode,
    description,
    chequeNo,
    bankName,
    transactionId,
    receivedBy,
    status: 'Completed',
    notes,
    createdAt: new Date()
  };
  
  // Add to payment history
  this.paymentHistory.push(paymentRecord);
  
  // Update fee details with individual component payments
  feeRecord.schoolFeePaid += schoolFeePaid;
  feeRecord.transportFeePaid += transportFeePaid;
  feeRecord.hostelFeePaid += hostelFeePaid;
  feeRecord.totalPaid += totalAmount;
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid);
  feeRecord.updatedAt = new Date();
  
  return this.save();
};

// Method to get payment by ID
const getPayment = function(paymentId) {
  const payment = this.paymentHistory.find(
    record => record.paymentId === paymentId
  );
  
  if (!payment) return null;
  
  return {
    paymentId: payment.paymentId,
    academicYear: payment.academicYear,
    date: payment.date,
    schoolFeePaid: payment.schoolFeePaid,
    transportFeePaid: payment.transportFeePaid,
    hostelFeePaid: payment.hostelFeePaid,
    totalAmount: payment.totalAmount,
    receiptNo: payment.receiptNo,
    paymentMode: payment.paymentMode,
    description: payment.description,
    chequeNo: payment.chequeNo,
    bankName: payment.bankName,
    transactionId: payment.transactionId,
    receivedBy: payment.receivedBy,
    status: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt
  };
};

// Method to get all payments for an academic year
const getPaymentsByAcademicYear = function(academicYear) {
  return this.paymentHistory
    .filter(record => record.academicYear === academicYear)
    .map(payment => ({
      paymentId: payment.paymentId,
      date: payment.date,
      schoolFeePaid: payment.schoolFeePaid,
      transportFeePaid: payment.transportFeePaid,
      hostelFeePaid: payment.hostelFeePaid,
      totalAmount: payment.totalAmount,
      receiptNo: payment.receiptNo,
      paymentMode: payment.paymentMode,
      description: payment.description,
      status: payment.status,
      receivedBy: payment.receivedBy
    }))
    .sort((a, b) => b.date - a.date);
};

// Method to get payment summary for an academic year
const getPaymentSummary = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  );
  
  if (!feeRecord) {
    throw new Error('Fee details not found for this academic year');
  }
  
  const payments = this.paymentHistory.filter(
    record => record.academicYear === academicYear && record.status === 'Completed'
  );
  
  const totalPayments = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const paymentCount = payments.length;
  
  // Calculate component-wise payment totals
  const totalSchoolFeePaid = payments.reduce((sum, payment) => sum + payment.schoolFeePaid, 0);
  const totalTransportFeePaid = payments.reduce((sum, payment) => sum + payment.transportFeePaid, 0);
  const totalHostelFeePaid = payments.reduce((sum, payment) => sum + payment.hostelFeePaid, 0);
  
  return {
    academicYear,
    feeSummary: {
      schoolFee: {
        total: feeRecord.schoolFee,
        paid: feeRecord.schoolFeePaid,
        due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
        discount: feeRecord.schoolFeeDiscountApplied
      },
      transportFee: {
        total: feeRecord.transportFee,
        paid: feeRecord.transportFeePaid,
        due: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
        discount: feeRecord.transportFeeDiscountApplied
      },
      hostelFee: {
        total: feeRecord.hostelFee,
        paid: feeRecord.hostelFeePaid,
        due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
        discount: feeRecord.hostelFeeDiscountApplied
      },
      overall: {
        totalFee: feeRecord.totalFee,
        totalPaid: feeRecord.totalPaid,
        totalDue: feeRecord.totalDue
      }
    },
    paymentSummary: {
      totalPayments,
      paymentCount,
      componentBreakdown: {
        schoolFee: totalSchoolFeePaid,
        transportFee: totalTransportFeePaid,
        hostelFee: totalHostelFeePaid
      },
      lastPaymentDate: payments.length > 0 ? new Date(Math.max(...payments.map(p => p.date))) : null,
      paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial'
    },
    payments: payments.map(p => ({
      date: p.date,
      schoolFeePaid: p.schoolFeePaid,
      transportFeePaid: p.transportFeePaid,
      hostelFeePaid: p.hostelFeePaid,
      totalAmount: p.totalAmount,
      receiptNo: p.receiptNo,
      paymentMode: p.paymentMode,
      description: p.description
    }))
  };
};

// Method to get fee component-wise breakdown with discounts
const getFeeBreakdown = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  );
  
  if (!feeRecord) return null;
  
  return {
    academicYear,
    schoolFee: {
      total: feeRecord.schoolFee,
      paid: feeRecord.schoolFeePaid,
      due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
      percentagePaid: feeRecord.schoolFee > 0 ? (feeRecord.schoolFeePaid / feeRecord.schoolFee * 100).toFixed(2) : 0,
      discount: feeRecord.schoolFeeDiscountApplied
    },
    transportFee: {
      total: feeRecord.transportFee,
      paid: feeRecord.transportFeePaid,
      due: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
      percentagePaid: feeRecord.transportFee > 0 ? (feeRecord.transportFeePaid / feeRecord.transportFee * 100).toFixed(2) : 0,
      discount: feeRecord.transportFeeDiscountApplied
    },
    hostelFee: {
      total: feeRecord.hostelFee,
      paid: feeRecord.hostelFeePaid,
      due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
      percentagePaid: feeRecord.hostelFee > 0 ? (feeRecord.hostelFeePaid / feeRecord.hostelFee * 100).toFixed(2) : 0,
      discount: feeRecord.hostelFeeDiscountApplied
    },
    overall: {
      totalFee: feeRecord.totalFee,
      totalPaid: feeRecord.totalPaid,
      totalDue: feeRecord.totalDue,
      percentagePaid: feeRecord.totalFee > 0 ? (feeRecord.totalPaid / feeRecord.totalFee * 100).toFixed(2) : 0
    },
    studentDiscounts: {
      schoolFee: this.schoolFeeDiscount,
      transportFee: this.transportFeeDiscount,
      hostelFee: this.hostelFeeDiscount
    }
  };
};

// Method to process a payment and update all related records
const processPayment = async function (
  paymentData,
  receivedBy,
) {
  const {
    academicYear,
    schoolFeePaid = 0,
    transportFeePaid = 0,
    hostelFeePaid = 0,
    description = "",
    paymentMode = "Cash",
    chequeNo = "",
    bankName = "",
    transactionId = "",
    notes = "",
    term,
    customReceiptNo = null,
    customPaymentId = null,
  } = paymentData;

  // Calculate total amount
  const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid;

  if (totalAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // Validate payment components don't exceed due amounts
  const feeRecord = this.feeDetails.find(
    (fd) => fd.academicYear === academicYear,
  );

  if (!feeRecord) {
    throw new Error(`Fee details not found for academic year ${academicYear}`);
  }

  // Validate individual component payments
  const schoolFeeDue = Math.max(
    0,
    feeRecord.schoolFee - feeRecord.schoolFeePaid,
  );
  const transportFeeDue = Math.max(
    0,
    feeRecord.transportFee - feeRecord.transportFeePaid,
  );
  const hostelFeeDue = Math.max(
    0,
    feeRecord.hostelFee - feeRecord.hostelFeePaid,
  );

  if (schoolFeePaid > schoolFeeDue) {
    throw new Error(
      `School fee payment (${schoolFeePaid}) exceeds due amount (${schoolFeeDue})`,
    );
  }

  if (transportFeePaid > transportFeeDue) {
    throw new Error(
      `Transport fee payment (${transportFeePaid}) exceeds due amount (${transportFeeDue})`,
    );
  }

  if (hostelFeePaid > hostelFeeDue) {
    throw new Error(
      `Hostel fee payment (${hostelFeePaid}) exceeds due amount (${hostelFeeDue})`,
    );
  }

  // Generate payment ID and receipt number
  const paymentId =
    customPaymentId ||
    `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const receiptNo =
    customReceiptNo ||
    `RCPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  // Create payment record
  const paymentRecord = {
    paymentId,
    academicYear,
    date: new Date(),
    schoolFeePaid,
    transportFeePaid,
    hostelFeePaid,
    totalAmount,
    receiptNo,
    paymentMode,
    description: term ? `${description} (Term ${term})` : description,
    chequeNo,
    bankName,
    transactionId,
    receivedBy,
    status: "Completed",
    notes,
    createdAt: new Date(),
  };

  // Add to payment history
  this.paymentHistory.push(paymentRecord);

  // Update fee details
  feeRecord.schoolFeePaid += schoolFeePaid;
  feeRecord.transportFeePaid += transportFeePaid;
  feeRecord.hostelFeePaid += hostelFeePaid;
  feeRecord.totalPaid += totalAmount;
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid);
  feeRecord.updatedAt = new Date();

  // Save the student document
  await this.save();

  return {
    paymentId,
    receiptNo,
    paymentRecord,
    updatedFeeDetails: feeRecord,
    remainingDue: feeRecord.totalDue,
    schoolFeeDue: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
    transportFeeDue: Math.max(
      0,
      feeRecord.transportFee - feeRecord.transportFeePaid,
    ),
    hostelFeeDue: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
  };
};

// Method to generate fee receipt data
const generateReceiptData = function (paymentId) {
  const payment = this.paymentHistory.find((p) => p.paymentId === paymentId);

  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found`);
  }

  const feeRecord = this.feeDetails.find(
    (fd) => fd.academicYear === payment.academicYear,
  );

  return {
    student: {
      id: this._id,
      name: `${this.firstName} ${this.lastName}`,
      admissionNo: this.admissionNo,
      rollNo: this.rollNo,
      class: this.class,
      displayClass: mapNumberToClassName(this.class),
      section: this.section,
      academicYear: this.academicYear,
      parentName: this.parentName,
      parentPhone: this.parentPhone,
    },
    payment: {
      paymentId: payment.paymentId,
      receiptNo: payment.receiptNo,
      date: payment.date,
      breakdown: {
        schoolFee: payment.schoolFeePaid,
        transportFee: payment.transportFeePaid,
        hostelFee: payment.hostelFeePaid,
      },
      totalAmount: payment.totalAmount,
      paymentMode: payment.paymentMode,
      description: payment.description,
      receivedBy: payment.receivedBy,
      chequeNo: payment.chequeNo,
      bankName: payment.bankName,
      transactionId: payment.transactionId,
      status: payment.status,
    },
    feeSummary: feeRecord
      ? {
          academicYear: feeRecord.academicYear,
          totalFee: feeRecord.totalFee,
          totalPaid: feeRecord.totalPaid,
          totalDue: feeRecord.totalDue,
          paymentStatus:
            feeRecord.totalDue === 0
              ? "Paid"
              : feeRecord.totalDue === feeRecord.totalFee
                ? "Unpaid"
                : "Partial",
          components: {
            schoolFee: {
              total: feeRecord.schoolFee,
              paid: feeRecord.schoolFeePaid,
              due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
            },
            transportFee: {
              total: feeRecord.transportFee,
              paid: feeRecord.transportFeePaid,
              due: Math.max(
                0,
                feeRecord.transportFee - feeRecord.transportFeePaid,
              ),
            },
            hostelFee: {
              total: feeRecord.hostelFee,
              paid: feeRecord.hostelFeePaid,
              due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
            },
          },
        }
      : null,
    schoolInfo: {
      name: "Your School Name", 
      address: "School Address",
      phone: "School Phone",
      email: "school@email.com",
      principal: "Principal Name",
    },
    generatedAt: new Date(),
    receiptId: `RECEIPT-${payment.receiptNo}`,
    isPartialPayment: feeRecord && feeRecord.totalDue > 0,
  };
};

// ================= FEE STATIC METHODS =================

// Static method to apply discounts to multiple students
const applyDiscounts = async function(data) {
  const { 
    className, 
    section, 
    academicYear, 
    schoolFeeDiscount = 0,
    transportFeeDiscount = 0,
    hostelFeeDiscount = 0
  } = data;
  
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  });
  
  if (students.length === 0) {
    throw new Error('No students found in the specified class and section');
  }
  
  const results = [];
  
  for (const student of students) {
    try {
      // Update student-level discounts
      student.schoolFeeDiscount = schoolFeeDiscount;
      student.transportFeeDiscount = transportFeeDiscount;
      student.hostelFeeDiscount = hostelFeeDiscount;
      
      // Update fee details with new discounts
      const feeRecord = student.feeDetails.find(
        record => record.academicYear === academicYear
      );
      
      if (feeRecord) {
        feeRecord.schoolFeeDiscountApplied = schoolFeeDiscount;
        feeRecord.transportFeeDiscountApplied = transportFeeDiscount;
        feeRecord.hostelFeeDiscountApplied = hostelFeeDiscount;
        feeRecord.updatedAt = new Date();
      }
      
      await student.save();
      
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount,
        status: 'updated'
      });
    } catch (error) {
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        error: error.message,
        status: 'failed'
      });
    }
  }
  
  return {
    className,
    section,
    academicYear: academicYear || '2024-2025',
    discounts: {
      schoolFeeDiscount,
      transportFeeDiscount,
      hostelFeeDiscount
    },
    totalStudents: students.length,
    updatedCount: results.filter(r => r.status === 'updated').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    results
  };
};

// Static method to set fee details for multiple students with discounts
const setClassFeeDetails = async function(data) {
  const { 
    className, 
    section, 
    academicYear, 
    schoolFee, 
    transportFee, 
    hostelFee,
    schoolFeeDiscount = 0,
    transportFeeDiscount = 0,
    hostelFeeDiscount = 0
  } = data;
  
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  });
  
  if (students.length === 0) {
    throw new Error('No students found in the specified class and section');
  }
  
  const results = [];
  
  for (const student of students) {
    try {
      // Update student-level discounts
      student.schoolFeeDiscount = schoolFeeDiscount;
      student.transportFeeDiscount = transportFeeDiscount;
      student.hostelFeeDiscount = hostelFeeDiscount;
      
      // Set fee details for each student based on their type and transport usage
      const actualTransportFee = student.isUsingSchoolTransport ? transportFee : 0;
      const actualHostelFee = student.studentType === 'Hosteller' ? hostelFee : 0;
      
      await student.setFeeDetails(academicYear, schoolFee, actualTransportFee, actualHostelFee, {
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount
      });
      
      const feeRecord = student.feeDetails.find(
        record => record.academicYear === academicYear
      );
      
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        schoolFee: feeRecord.schoolFee,
        transportFee: feeRecord.transportFee,
        hostelFee: feeRecord.hostelFee,
        totalFee: feeRecord.totalFee,
        schoolFeeDiscount: feeRecord.schoolFeeDiscountApplied,
        transportFeeDiscount: feeRecord.transportFeeDiscountApplied,
        hostelFeeDiscount: feeRecord.hostelFeeDiscountApplied,
        status: 'updated'
      });
    } catch (error) {
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        error: error.message,
        status: 'failed'
      });
    }
  }
  
  return {
    className,
    section,
    academicYear: academicYear || '2024-2025',
    baseFees: {
      schoolFee,
      transportFee,
      hostelFee
    },
    discounts: {
      schoolFeeDiscount,
      transportFeeDiscount,
      hostelFeeDiscount
    },
    totalStudents: students.length,
    updatedCount: results.filter(r => r.status === 'updated').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    results
  };
};

// Export fee instance methods
const feeInstanceMethods = {
  setFeeDetails,
  updateDiscounts,
  getFeeDetails,
  recordPayment,
  getPayment,
  getPaymentsByAcademicYear,
  getPaymentSummary,
  getFeeBreakdown,
  processPayment,
  generateReceiptData
};

// Export fee static methods
const feeStaticMethods = {
  applyDiscounts,
  setClassFeeDetails
};

// Export helper functions
const feeHelperFunctions = {
  generatePaymentId,
  generateReceiptNo
};

module.exports = {
  feeInstanceMethods,
  feeStaticMethods,
  feeHelperFunctions
};