const Student = require('../models/Student');
const Fee = require('../models/Fee');
const mongoose = require('mongoose');

// Helper function to map class names to numbers
const mapClassToNumber = (classInput) => {
  if (!classInput && classInput !== 0) return 1;

  const classStr = classInput.toString().trim().toUpperCase();

  const classMap = {
    'PRE NURSERY': 0,
    'NURSERY': 0.25,
    'LKG': 0.5,
    'UKG': 0.75,
    '1': 1, 'FIRST': 1, 'ONE': 1,
    '2': 2, 'SECOND': 2, 'TWO': 2,
    '3': 3, 'THIRD': 3, 'THREE': 3,
    '4': 4, 'FOURTH': 4, 'FOUR': 4,
    '5': 5, 'FIFTH': 5, 'FIVE': 5,
    '6': 6, 'SIXTH': 6, 'SIX': 6,
    '7': 7, 'SEVENTH': 7, 'SEVEN': 7,
    '8': 8, 'EIGHTH': 8, 'EIGHT': 8,
    '9': 9, 'NINTH': 9, 'NINE': 9,
    '10': 10, 'TENTH': 10, 'TEN': 10,
    '11': 11, 'ELEVENTH': 11, 'ELEVEN': 11,
    '12': 12, 'TWELFTH': 12, 'TWELVE': 12,
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12
  };

  return classMap[classStr] !== undefined ? classMap[classStr] : parseFloat(classStr) || null;
};

// Generate unique receipt number
const generateReceiptNumber = async () => {
  const prefix = 'REC';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the last receipt number
  const lastReceipt = await Fee.findOne({
    receiptNumber: new RegExp(`^${prefix}${year}${month}`)
  }).sort({ receiptNumber: -1 });
  
  let sequence = 1;
  if (lastReceipt && lastReceipt.receiptNumber) {
    const lastSeq = parseInt(lastReceipt.receiptNumber.slice(-4));
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${year}${month}${String(sequence).padStart(4, '0')}`;
};

// ================= CONTROLLER METHODS =================

// 1. Create a new fee record
exports.createFeeRecord = async (req, res) => {
  try {
    const {
      studentId,
      academicYear,
      term,
      termNumber,
      customTermName,
      dueDate,
      amount,
      discountAmount = 0,
      lateFee = 0,
      paymentMode = 'pending',
      remarks = '',
      previousBalance = 0,
      carryForward = 0,
      breakdown = {}
    } = req.body;

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's fee config for breakdown
    const feeConfig = student.feeConfig || {};
    
    // Calculate total amount
    const totalAmount = amount - discountAmount + lateFee + previousBalance - carryForward;

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create fee record
    const feeRecord = new Fee({
      studentId,
      academicYear: academicYear || student.academicYear,
      term,
      termNumber,
      customTermName,
      dueDate: new Date(dueDate),
      amount,
      paidAmount: 0,
      discountAmount,
      lateFee,
      totalAmount,
      status: 'pending',
      paymentMode,
      receiptNumber,
      remarks,
      previousBalance,
      carryForward,
      breakdown: {
        tuitionFee: breakdown.tuitionFee || feeConfig.tuitionFee || 0,
        transportFee: breakdown.transportFee || feeConfig.transportFee || 0,
        otherFees: breakdown.otherFees || feeConfig.otherFees || 0,
        previousDue: previousBalance,
        lateFee,
        discount: discountAmount,
        ...breakdown
      },
      createdBy: req.user?.id || 'system',
      updatedBy: req.user?.id || 'system'
    });

    await feeRecord.save();

    res.status(201).json({
      success: true,
      message: 'Fee record created successfully',
      data: feeRecord
    });
  } catch (error) {
    console.error('Error creating fee record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fee record',
      error: error.message
    });
  }
};

// 2. Get all fees with filters
exports.getAllFees = async (req, res) => {
  try {
    const { 
      academicYear, 
      status, 
      paymentMode, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    
    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName admissionNo class section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Fee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        fees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fees',
      error: error.message
    });
  }
};

// 3. Get fee by ID
exports.getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.feeId)
      .populate('studentId', 'firstName lastName admissionNo class section parentName parentPhone');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fee record',
      error: error.message
    });
  }
};

// 4. Update fee record
exports.updateFeeRecord = async (req, res) => {
  try {
    const { amount, dueDate, discountAmount, lateFee, remarks } = req.body;
    
    const fee = await Fee.findById(req.params.feeId);
    
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // If payment has been made, only allow updating certain fields
    if (fee.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update fee record with payments. Consider cancelling and creating a new one.'
      });
    }

    // Update fields
    if (amount !== undefined) {
      fee.amount = amount;
      fee.totalAmount = amount - (fee.discountAmount || 0) + (fee.lateFee || 0);
    }
    
    if (dueDate !== undefined) fee.dueDate = new Date(dueDate);
    if (discountAmount !== undefined) {
      fee.discountAmount = discountAmount;
      fee.totalAmount = fee.amount - discountAmount + (fee.lateFee || 0);
    }
    if (lateFee !== undefined) {
      fee.lateFee = lateFee;
      fee.totalAmount = fee.amount - (fee.discountAmount || 0) + lateFee;
    }
    if (remarks !== undefined) fee.remarks = remarks;
    
    fee.updatedAt = new Date();
    fee.updatedBy = req.user?.id || 'system';
    
    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Fee record updated successfully',
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating fee record',
      error: error.message
    });
  }
};

// 5. Delete fee record
exports.deleteFeeRecord = async (req, res) => {
  try {
    const { feeId } = req.params;

    const feeRecord = await Fee.findById(feeId);
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Check if payment has been made
    if (feeRecord.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete fee record with payments. Consider cancelling instead.'
      });
    }

    await feeRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fee record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting fee record',
      error: error.message
    });
  }
};

// 6. Cancel fee record
exports.cancelFeeRecord = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { reason } = req.body;

    const feeRecord = await Fee.findById(feeId);
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Update status to cancelled
    feeRecord.status = 'cancelled';
    feeRecord.remarks = feeRecord.remarks 
      ? `${feeRecord.remarks}; Cancelled: ${reason}`
      : `Cancelled: ${reason}`;
    feeRecord.updatedBy = req.user?.id || 'system';
    feeRecord.updatedAt = new Date();

    await feeRecord.save();

    res.status(200).json({
      success: true,
      message: 'Fee record cancelled successfully',
      data: feeRecord
    });
  } catch (error) {
    console.error('Error cancelling fee record:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling fee record',
      error: error.message
    });
  }
};

// 7. Get student fees
exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;

    const query = { studentId };
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const fees = await Fee.find(query)
      .sort({ dueDate: 1 })
      .populate('studentId', 'firstName lastName admissionNo class section');

    if (!fees || fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fee records found for this student'
      });
    }

    // Calculate totals
    const totals = fees.reduce((acc, fee) => {
      acc.totalAmount += fee.totalAmount;
      acc.paidAmount += fee.paidAmount;
      acc.discountAmount += fee.discountAmount;
      acc.lateFee += fee.lateFee;
      return acc;
    }, {
      totalAmount: 0,
      paidAmount: 0,
      discountAmount: 0,
      lateFee: 0
    });

    totals.outstandingAmount = totals.totalAmount - totals.paidAmount;

    res.status(200).json({
      success: true,
      data: {
        fees,
        totals,
        count: fees.length
      }
    });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student fees',
      error: error.message
    });
  }
};

// 8. Get student fee summary
exports.getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get fee summary from student
    const feeSummary = student.getFeeSummary ? await student.getFeeSummary() : {};

    // Get outstanding fees
    const outstandingFees = await Fee.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          academicYear: academicYear || student.academicYear,
          status: { $in: ['pending', 'partial', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          totalOverdue: {
            $sum: {
              $cond: [
                { $lt: ['$dueDate', new Date()] },
                { $subtract: ['$totalAmount', '$paidAmount'] },
                0
              ]
            }
          },
          feeCount: { $sum: 1 }
        }
      }
    ]);

    // Get payment history
    const paymentHistory = await Fee.find({
      studentId,
      academicYear: academicYear || student.academicYear,
      status: { $in: ['paid', 'partial'] }
    })
    .sort({ paymentDate: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class,
          section: student.section,
          academicYear: student.academicYear
        },
        feeSummary,
        outstandingSummary: outstandingFees[0] || { totalOutstanding: 0, totalOverdue: 0, feeCount: 0 },
        recentPayments: paymentHistory
      }
    });
  } catch (error) {
    console.error('Error fetching student fee summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student fee summary',
      error: error.message
    });
  }
};

// 9. Generate term-wise fees for a student
exports.generateTermFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.body;

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get fee config
    const feeConfig = student.feeConfig || {};
    
    if (!feeConfig.totalAnnualFee || feeConfig.totalAnnualFee === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fee configuration not set for this student'
      });
    }

    // Calculate term dates
    const currentYear = new Date().getFullYear();
    const termDates = {
      'term-1': new Date(currentYear, 3, 10), // April 10
      'term-2': new Date(currentYear, 7, 10), // August 10
      'term-3': new Date(currentYear, 11, 10) // December 10
    };

    const termAmounts = {
      'term-1': feeConfig.term1Fee || 0,
      'term-2': feeConfig.term2Fee || 0,
      'term-3': feeConfig.term3Fee || 0
    };

    // Check if fees already exist for this academic year
    const existingFees = await Fee.find({
      studentId,
      academicYear: academicYear || student.academicYear
    });

    const existingTerms = existingFees.map(fee => fee.term);
    const feesToCreate = [];

    // Generate fees for each term if not already created
    for (const [term, dueDate] of Object.entries(termDates)) {
      if (!existingTerms.includes(term)) {
        const termNumber = parseInt(term.split('-')[1]);
        
        const feeRecord = new Fee({
          studentId,
          academicYear: academicYear || student.academicYear,
          term,
          termNumber,
          dueDate,
          amount: termAmounts[term],
          totalAmount: termAmounts[term],
          status: 'pending',
          breakdown: {
            tuitionFee: feeConfig.tuitionFee ? Math.round(feeConfig.tuitionFee / 3) : 0,
            transportFee: feeConfig.transportFee ? Math.round(feeConfig.transportFee / 3) : 0,
            otherFees: feeConfig.otherFees ? Math.round(feeConfig.otherFees / 3) : 0
          },
          createdBy: req.user?.id || 'system',
          updatedBy: req.user?.id || 'system'
        });

        feesToCreate.push(feeRecord);
      }
    }

    if (feesToCreate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All term fees already generated',
        data: existingFees
      });
    }

    // Save all new fee records
    const createdFees = await Fee.insertMany(feesToCreate);

    res.status(201).json({
      success: true,
      message: 'Term fees generated successfully',
      data: {
        generated: createdFees,
        existing: existingFees
      }
    });
  } catch (error) {
    console.error('Error generating term fees:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating term fees',
      error: error.message
    });
  }
};

// 10. Make a payment for a fee record
exports.makePayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const {
      paidAmount,
      paymentMode = 'cash',
      transactionId = '',
      chequeNumber = '',
      bankName = '',
      paymentDate,
      remarks = ''
    } = req.body;

    const feeRecord = await Fee.findById(feeId);
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Validate payment amount
    const outstandingAmount = feeRecord.totalAmount - feeRecord.paidAmount;
    if (paidAmount > outstandingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed outstanding amount of ${outstandingAmount}`
      });
    }

    // Update fee record
    feeRecord.paidAmount += paidAmount;
    
    // Update status
    if (feeRecord.paidAmount >= feeRecord.totalAmount) {
      feeRecord.status = 'paid';
    } else if (feeRecord.paidAmount > 0) {
      feeRecord.status = 'partial';
    }
    
    // Update payment details
    feeRecord.paymentMode = paymentMode;
    feeRecord.transactionId = transactionId;
    feeRecord.chequeNumber = chequeNumber;
    feeRecord.bankName = bankName;
    feeRecord.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    feeRecord.remarks = remarks;
    feeRecord.updatedBy = req.user?.id || 'system';
    feeRecord.updatedAt = new Date();

    await feeRecord.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        feeRecord,
        outstandingAmount: feeRecord.totalAmount - feeRecord.paidAmount
      }
    });
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
};

// 11. Get fee receipt
exports.getFeeReceipt = async (req, res) => {
  try {
    const { feeId } = req.params;

    const fee = await Fee.findById(feeId)
      .populate('studentId', 'firstName lastName admissionNo class section parentName parentPhone');
    
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    const receipt = {
      receiptNumber: fee.receiptNumber,
      date: fee.paymentDate || new Date(),
      student: {
        name: `${fee.studentId.firstName} ${fee.studentId.lastName}`,
        admissionNo: fee.studentId.admissionNo,
        class: fee.studentId.class,
        section: fee.studentId.section,
        parent: fee.studentId.parentName,
        parentPhone: fee.studentId.parentPhone
      },
      academicYear: fee.academicYear,
      term: fee.term,
      customTermName: fee.customTermName,
      breakdown: {
        tuitionFee: fee.breakdown.tuitionFee,
        transportFee: fee.breakdown.transportFee,
        otherFees: fee.breakdown.otherFees,
        previousDue: fee.breakdown.previousDue,
        lateFee: fee.breakdown.lateFee,
        discount: fee.breakdown.discount
      },
      amounts: {
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        outstandingAmount: fee.totalAmount - fee.paidAmount,
        discountAmount: fee.discountAmount,
        lateFee: fee.lateFee
      },
      payment: {
        mode: fee.paymentMode,
        transactionId: fee.transactionId,
        chequeNumber: fee.chequeNumber,
        bankName: fee.bankName
      },
      dates: {
        dueDate: fee.dueDate,
        paymentDate: fee.paymentDate,
        createdAt: fee.createdAt
      },
      status: fee.status,
      remarks: fee.remarks
    };

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error generating fee receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating fee receipt',
      error: error.message
    });
  }
};

// 12. Get outstanding fees for a class
exports.getClassOutstandingFees = async (req, res) => {
  try {
    const { className, section } = req.params;
    const { academicYear } = req.query;

    // Get all students in the class
    const classNum = mapClassToNumber(className);
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${className}"`
      });
    }

    const students = await Student.find({
      class: classNum,
      section: section.toUpperCase(),
      academicYear: academicYear || '2024-2025'
    }).select('_id firstName lastName admissionNo rollNo');

    const studentIds = students.map(student => student._id);

    // Get outstanding fees for these students
    const outstandingFees = await Fee.find({
      studentId: { $in: studentIds },
      academicYear: academicYear || '2024-2025',
      status: { $in: ['pending', 'partial', 'overdue'] }
    })
    .populate('studentId', 'firstName lastName admissionNo rollNo class section')
    .sort({ dueDate: 1 });

    // Group by student
    const studentFeeMap = {};
    let classTotalOutstanding = 0;
    let classTotalOverdue = 0;

    outstandingFees.forEach(fee => {
      const studentId = fee.studentId._id.toString();
      const outstanding = fee.totalAmount - fee.paidAmount;
      
      if (!studentFeeMap[studentId]) {
        studentFeeMap[studentId] = {
          student: fee.studentId,
          fees: [],
          totalOutstanding: 0,
          totalOverdue: 0
        };
      }
      
      studentFeeMap[studentId].fees.push(fee);
      studentFeeMap[studentId].totalOutstanding += outstanding;
      
      if (fee.dueDate < new Date()) {
        studentFeeMap[studentId].totalOverdue += outstanding;
        classTotalOverdue += outstanding;
      }
      
      classTotalOutstanding += outstanding;
    });

    // Convert to array
    const studentFees = Object.values(studentFeeMap).sort((a, b) => 
      (a.student.rollNo || 0) - (b.student.rollNo || 0)
    );

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        academicYear: academicYear || '2024-2025',
        totalStudents: students.length,
        studentsWithOutstanding: studentFees.length,
        classTotalOutstanding,
        classTotalOverdue,
        studentFees
      }
    });
  } catch (error) {
    console.error('Error fetching class outstanding fees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class outstanding fees',
      error: error.message
    });
  }
};

// 13. Update student fee configuration
exports.updateStudentFeeConfig = async (req, res) => {
  try {
    const { studentId } = req.params;
    const feeConfig = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If student has updateFeeConfig method, use it
    if (student.updateFeeConfig) {
      await student.updateFeeConfig(feeConfig, req.user?.id || 'system');
    } else {
      // Fallback: update fee config directly
      student.feeConfig = {
        ...student.feeConfig,
        ...feeConfig,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'system'
      };
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: 'Fee configuration updated successfully',
      data: student.feeConfig
    });
  } catch (error) {
    console.error('Error updating fee config:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fee configuration',
      error: error.message
    });
  }
};

// 14. Apply bulk discount to students
exports.applyBulkDiscount = async (req, res) => {
  try {
    const { studentIds, discountPercentage, discountReason } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    
    if (students.length === 0) {
      throw new Error('No students found with the provided IDs');
    }

    const results = [];
    
    for (const student of students) {
      const currentConfig = student.feeConfig || {};
      
      // Update fee config
      student.feeConfig = {
        ...currentConfig,
        discountPercentage,
        discountReason,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'system'
      };
      
      await student.save();
      
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        oldDiscount: currentConfig.discountPercentage || 0,
        newDiscount: discountPercentage,
        updated: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bulk discount applied successfully',
      data: {
        appliedCount: results.length,
        discountPercentage,
        discountReason,
        results
      }
    });
  } catch (error) {
    console.error('Error applying bulk discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying bulk discount',
      error: error.message
    });
  }
};

// 15. Get fee collection report
exports.getFeeCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, academicYear } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const fees = await Fee.find({
      paymentDate: { $gte: start, $lte: end },
      academicYear: academicYear || '2024-2025',
      status: { $in: ['paid', 'partial'] }
    })
    .populate('studentId', 'firstName lastName class section')
    .sort({ paymentDate: -1 });

    let totalCollection = 0;
    let cashCollection = 0;
    let onlineCollection = 0;
    let chequeCollection = 0;
    let otherCollection = 0;
    const dailyCollections = {};

    fees.forEach(fee => {
      totalCollection += fee.paidAmount;

      // Categorize by payment mode
      switch (fee.paymentMode) {
        case 'cash':
          cashCollection += fee.paidAmount;
          break;
        case 'online':
        case 'card':
        case 'upi':
        case 'bank-transfer':
          onlineCollection += fee.paidAmount;
          break;
        case 'cheque':
          chequeCollection += fee.paidAmount;
          break;
        default:
          otherCollection += fee.paidAmount;
      }

      // Group by date
      const dateStr = fee.paymentDate.toISOString().split('T')[0];
      if (!dailyCollections[dateStr]) {
        dailyCollections[dateStr] = 0;
      }
      dailyCollections[dateStr] += fee.paidAmount;
    });

    // Convert daily collections to array
    const dailyCollectionArray = Object.entries(dailyCollections)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        academicYear: academicYear || '2024-2025',
        summary: {
          totalFees: fees.length,
          totalCollection,
          cashCollection,
          onlineCollection,
          chequeCollection,
          otherCollection
        },
        dailyCollections: dailyCollectionArray,
        modeWisePercentage: {
          cash: totalCollection > 0 ? ((cashCollection / totalCollection) * 100).toFixed(2) : 0,
          online: totalCollection > 0 ? ((onlineCollection / totalCollection) * 100).toFixed(2) : 0,
          cheque: totalCollection > 0 ? ((chequeCollection / totalCollection) * 100).toFixed(2) : 0,
          other: totalCollection > 0 ? ((otherCollection / totalCollection) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error generating fee collection report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating fee collection report',
      error: error.message
    });
  }
};

// 16. Search fees by student
exports.searchFeesByStudent = async (req, res) => {
  try {
    const { admissionNo, name } = req.query;
    
    if (!admissionNo && !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide admission number or student name'
      });
    }

    let studentQuery = {};
    
    if (admissionNo) {
      studentQuery.admissionNo = admissionNo;
    }
    
    if (name) {
      const nameRegex = new RegExp(name, 'i');
      studentQuery.$or = [
        { firstName: nameRegex },
        { lastName: nameRegex }
      ];
    }

    const students = await Student.find(studentQuery).select('_id');
    
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found'
      });
    }

    const studentIds = students.map(student => student._id);
    
    const fees = await Fee.find({
      studentId: { $in: studentIds }
    })
    .populate('studentId', 'firstName lastName admissionNo class section')
    .sort({ dueDate: -1 })
    .limit(100);

    res.status(200).json({
      success: true,
      data: {
        fees,
        count: fees.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching fees',
      error: error.message
    });
  }
};