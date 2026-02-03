const { mapClassToNumber, mapNumberToClassName } = require('./student.attendance.service');

// ================= MARKS HELPER FUNCTIONS =================

// Helper function to calculate grade based on percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  if (percentage >= 35) return 'E';
  return 'F';
};

// Helper function to determine pass/fail
const determineResult = (percentage, passingPercentage = 35) => {
  return percentage >= passingPercentage ? 'Pass' : 'Fail';
};

// ================= MARKS INSTANCE METHODS =================

// Method to upload or update marks with pass/fail and grade calculation
const uploadMarks = async function(examType, customExamName, subject, marks, totalMarks, uploadedBy, passingPercentage = 35) {
  // Validate marks don't exceed total marks
  if (marks > totalMarks) {
    throw new Error(`Marks (${marks}) cannot exceed total marks (${totalMarks})`);
  }
  
  // Calculate percentage - ensure it's a number, not string
  const percentage = totalMarks > 0 ? parseFloat(((marks / totalMarks) * 100).toFixed(2)) : 0;
  
  // Calculate grade and result
  const grade = calculateGrade(percentage);
  const result = determineResult(percentage, passingPercentage);
  
  // Find or create marks record for current academic year
  let academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  );
  
  if (!academicYearRecord) {
    academicYearRecord = {
      academicYear: this.academicYear,
      records: []
    };
    this.marks.push(academicYearRecord);
  }
  
  // Find existing record for this exam and subject
  const existingRecord = academicYearRecord.records.find(
    record => record.examType === examType && record.subject === subject
  );
  
  if (existingRecord) {
    // Update existing record
    existingRecord.marks = marks;
    existingRecord.totalMarks = totalMarks;
    existingRecord.percentage = percentage;
    existingRecord.grade = grade;
    existingRecord.result = result;
    existingRecord.passingPercentage = passingPercentage;
    if (customExamName) existingRecord.customExamName = customExamName;
    existingRecord.uploadedBy = uploadedBy;
    existingRecord.updatedAt = new Date();
  } else {
    // Create new record
    const newRecord = {
      examType,
      subject,
      marks,
      totalMarks,
      percentage,
      grade,
      result,
      passingPercentage,
      uploadedBy,
      uploadedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (customExamName) {
      newRecord.customExamName = customExamName;
    }
    
    academicYearRecord.records.push(newRecord);
  }
  
  // Sort records by exam type
  academicYearRecord.records.sort((a, b) => a.examType.localeCompare(b.examType));
  
  // Return a promise that saves the document
  return this.save();
};

// Method to get marks for a specific exam and subject
const getMarksForExam = function(examType, subject) {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  );
  
  if (!academicYearRecord) return null;
  
  const record = academicYearRecord.records.find(
    record => record.examType === examType && record.subject === subject
  );
  
  if (!record) return null;
  
  return {
    examType: record.examType,
    customExamName: record.customExamName,
    subject: record.subject,
    marks: record.marks,
    totalMarks: record.totalMarks,
    percentage: record.percentage,
    grade: record.grade,
    result: record.result,
    passingPercentage: record.passingPercentage,
    uploadedBy: record.uploadedBy,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt
  };
};

// Method to get all marks for a subject
const getSubjectMarks = function(subject) {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  );
  
  if (!academicYearRecord) return [];
  
  return academicYearRecord.records
    .filter(record => record.subject === subject)
    .map(record => ({
      examType: record.examType,
      customExamName: record.customExamName,
      marks: record.marks,
      totalMarks: record.totalMarks,
      percentage: record.percentage,
      grade: record.grade,
      result: record.result,
      passingPercentage: record.passingPercentage,
      uploadedBy: record.uploadedBy,
      uploadedAt: record.uploadedAt
    }))
    .sort((a, b) => a.examType.localeCompare(b.examType));
};

// Method to get all marks
const getAllMarks = function() {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  );
  
  if (!academicYearRecord) return [];
  
  return academicYearRecord.records
    .map(record => ({
      examType: record.examType,
      customExamName: record.customExamName,
      subject: record.subject,
      marks: record.marks,
      totalMarks: record.totalMarks,
      percentage: record.percentage,
      grade: record.grade,
      result: record.result,
      passingPercentage: record.passingPercentage,
      uploadedBy: record.uploadedBy,
      uploadedAt: record.uploadedAt,
      updatedAt: record.updatedAt
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
};

// Method to get subject-wise performance summary
const getSubjectPerformance = function() {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  );
  
  if (!academicYearRecord) return [];
  
  // Group by subject
  const subjectMap = {};
  
  academicYearRecord.records.forEach(record => {
    if (!subjectMap[record.subject]) {
      subjectMap[record.subject] = {
        subject: record.subject,
        totalExams: 0,
        totalMarks: 0,
        totalPossibleMarks: 0,
        averagePercentage: 0,
        grades: [],
        results: [],
        passCount: 0,
        failCount: 0
      };
    }
    
    subjectMap[record.subject].totalExams++;
    subjectMap[record.subject].totalMarks += record.marks;
    subjectMap[record.subject].totalPossibleMarks += record.totalMarks;
    subjectMap[record.subject].grades.push(record.grade);
    subjectMap[record.subject].results.push(record.result);
    
    if (record.result === 'Pass') {
      subjectMap[record.subject].passCount++;
    } else if (record.result === 'Fail') {
      subjectMap[record.subject].failCount++;
    }
  });
  
  // Calculate averages and percentages
  const subjectPerformance = Object.values(subjectMap).map(subject => {
    const averagePercentage = (subject.totalMarks / subject.totalPossibleMarks) * 100;
    const passPercentage = (subject.passCount / subject.totalExams) * 100;
    
    // Determine overall subject status
    let overallStatus = 'Pass';
    if (subject.failCount > 0) {
      overallStatus = subject.passCount > subject.failCount ? 'Borderline' : 'Fail';
    }
    
    return {
      ...subject,
      averagePercentage: averagePercentage.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
      overallStatus,
      overallGrade: calculateGrade(averagePercentage)
    };
  });
  
  return subjectPerformance.sort((a, b) => a.subject.localeCompare(b.subject));
};

// ================= MARKS STATIC METHODS =================

// Static method to get students for marks
const getStudentsForMarks = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })
  .select('_id rollNo firstName lastName admissionNo')
  .sort({ rollNo: 1 })
  .lean();

  return students.map(student => ({
    id: student._id,
    rollNo: student.rollNo,
    name: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo
  }));
};

// Static method to check if marks exist
const checkMarksExist = async function(className, section, examType, subject, academicYear) {
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
    return {
      exists: false,
      totalStudents: 0,
      totalMarked: 0,
      markedStudents: [],
      message: 'No students found in this class'
    };
  }

  let totalMarked = 0;
  const markedStudents = [];

  for (const student of students) {
    const marksRecord = student.getMarksForExam(examType, subject);
    if (marksRecord) {
      totalMarked++;
      markedStudents.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        marks: marksRecord.marks,
        totalMarks: marksRecord.totalMarks,
        percentage: marksRecord.percentage,
        grade: marksRecord.grade,
        result: marksRecord.result
      });
    }
  }

  return {
    exists: totalMarked > 0,
    totalStudents: students.length,
    totalMarked,
    markedStudents,
    canOverride: totalMarked > 0
  };
};

// Static method to upload class marks
const uploadClassMarks = async function({ examType, customExamName, subject, className, section, academicYear, totalMarks, passingPercentage, studentMarks, uploadedBy }) {
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
    throw new Error('No students found in this class');
  }

  const studentMap = {};
  students.forEach(student => {
    studentMap[student._id.toString()] = student;
  });

  let markedCount = 0;
  let passCount = 0;
  let failCount = 0;
  const marksResults = [];

  for (const markData of studentMarks) {
    const student = studentMap[markData.studentId];
    
    if (!student) {
      console.warn(`Student not found: ${markData.studentId}`);
      continue;
    }

    try {
      await student.uploadMarks(
        examType,
        customExamName,
        subject,
        parseFloat(markData.marks),
        parseFloat(totalMarks),
        uploadedBy,
        parseFloat(passingPercentage)
      );
      
      markedCount++;
      
      const uploadedMarks = student.getMarksForExam(examType, subject);
      if (uploadedMarks) {
        if (uploadedMarks.result === 'Pass') passCount++;
        else failCount++;
      }

      marksResults.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        marks: markData.marks,
        result: uploadedMarks ? uploadedMarks.result : 'N/A'
      });
    } catch (error) {
      console.error(`Error uploading marks for ${student.firstName}:`, error);
    }
  }

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    examType,
    subject,
    totalMarks: parseFloat(totalMarks),
    passingPercentage: parseFloat(passingPercentage),
    totalStudents: students.length,
    markedCount,
    passCount,
    failCount,
    passPercentage: markedCount > 0 ? ((passCount / markedCount) * 100).toFixed(2) : 0,
    marksResults,
    uploadedBy
  };
};

// Static method to override class marks
const overrideClassMarks = async function({ examType, customExamName, subject, className, section, academicYear, totalMarks, passingPercentage, studentMarks, uploadedBy }) {
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  });

  // Remove existing marks for this exam and subject
  for (const student of students) {
    const academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || student.academicYear)
    );
    
    if (academicYearRecord) {
      const recordIndex = academicYearRecord.records.findIndex(
        record => record.examType === examType && record.subject === subject
      );
      
      if (recordIndex !== -1) {
        academicYearRecord.records.splice(recordIndex, 1);
        await student.save();
      }
    }
  }

  // Call uploadClassMarks to upload new marks
  return await this.uploadClassMarks({
    examType,
    customExamName,
    subject,
    className,
    section,
    academicYear,
    totalMarks,
    passingPercentage,
    studentMarks,
    uploadedBy
  });
};

// Static method to get class marks summary
const getClassMarksSummary = async function(className, section, examType, subject, academicYear) {
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).sort('rollNo');

  const marksDetails = [];
  let totalMarksSum = 0;
  let totalPossibleMarks = 0;
  let passCount = 0;
  let failCount = 0;
  let aPlusCount = 0, aCount = 0, bPlusCount = 0, bCount = 0, cCount = 0, dCount = 0, eCount = 0, fCount = 0;

  for (const student of students) {
    const marksRecord = student.getMarksForExam(examType, subject);
    
    if (marksRecord) {
      totalMarksSum += marksRecord.marks;
      totalPossibleMarks += marksRecord.totalMarks;
      
      if (marksRecord.result === 'Pass') passCount++;
      else failCount++;
      
      // Count grades
      switch (marksRecord.grade) {
        case 'A+': aPlusCount++; break;
        case 'A': aCount++; break;
        case 'B+': bPlusCount++; break;
        case 'B': bCount++; break;
        case 'C': cCount++; break;
        case 'D': dCount++; break;
        case 'E': eCount++; break;
        case 'F': fCount++; break;
      }

      marksDetails.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        marks: marksRecord.marks,
        totalMarks: marksRecord.totalMarks,
        percentage: marksRecord.percentage,
        grade: marksRecord.grade,
        result: marksRecord.result
      });
    }
  }

  const averagePercentage = marksDetails.length > 0 ? 
    (totalMarksSum / totalPossibleMarks) * 100 : 0;

  const gradeDistribution = {
    'A+': aPlusCount,
    'A': aCount,
    'B+': bPlusCount,
    'B': bCount,
    'C': cCount,
    'D': dCount,
    'E': eCount,
    'F': fCount
  };

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    examType,
    subject,
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    markedStudents: marksDetails.length,
    summary: {
      averagePercentage: averagePercentage.toFixed(2),
      passCount,
      failCount,
      passPercentage: (passCount / (passCount + failCount) * 100).toFixed(2),
      gradeDistribution
    },
    marksDetails
  };
};

// Static method to get class subject performance
const getClassSubjectPerformance = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className);
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`);
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  });

  // Collect all subjects from all students
  const allSubjects = new Set();
  const subjectPerformanceMap = {};

  for (const student of students) {
    const performance = student.getSubjectPerformance();
    performance.forEach(subject => {
      allSubjects.add(subject.subject);
      
      if (!subjectPerformanceMap[subject.subject]) {
        subjectPerformanceMap[subject.subject] = {
          subject: subject.subject,
          students: 0,
          totalAveragePercentage: 0,
          passCount: 0,
          failCount: 0,
          aPlusCount: 0,
          aCount: 0,
          bPlusCount: 0,
          bCount: 0,
          cCount: 0,
          dCount: 0,
          eCount: 0,
          fCount: 0
        };
      }
      
      const subj = subjectPerformanceMap[subject.subject];
      subj.students++;
      subj.totalAveragePercentage += parseFloat(subject.averagePercentage);
      subj.passCount += subject.passCount;
      subj.failCount += subject.failCount;
      
      // Add grade counts
      subj.aPlusCount += subject.grades.filter(g => g === 'A+').length;
      subj.aCount += subject.grades.filter(g => g === 'A').length;
      subj.bPlusCount += subject.grades.filter(g => g === 'B+').length;
      subj.bCount += subject.grades.filter(g => g === 'B').length;
      subj.cCount += subject.grades.filter(g => g === 'C').length;
      subj.dCount += subject.grades.filter(g => g === 'D').length;
      subj.eCount += subject.grades.filter(g => g === 'E').length;
      subj.fCount += subject.grades.filter(g => g === 'F').length;
    });
  }

  // Calculate averages
  const subjectPerformance = Array.from(allSubjects).map(subjectName => {
    const subj = subjectPerformanceMap[subjectName];
    const avgPercentage = subj.students > 0 ? (subj.totalAveragePercentage / subj.students) : 0;
    const passPercentage = (subj.passCount + subj.failCount) > 0 ? 
      (subj.passCount / (subj.passCount + subj.failCount) * 100) : 0;
      
    // Determine overall subject difficulty
    let difficulty = 'Average';
    if (avgPercentage >= 80) difficulty = 'Easy';
    else if (avgPercentage >= 60) difficulty = 'Average';
    else if (avgPercentage >= 40) difficulty = 'Challenging';
    else difficulty = 'Difficult';

    return {
      subject: subjectName,
      totalStudents: subj.students,
      averagePercentage: avgPercentage.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
      passCount: subj.passCount,
      failCount: subj.failCount,
      gradeDistribution: {
        'A+': subj.aPlusCount,
        'A': subj.aCount,
        'B+': subj.bPlusCount,
        'B': subj.bCount,
        'C': subj.cCount,
        'D': subj.dCount,
        'E': subj.eCount,
        'F': subj.fCount
      },
      difficulty,
      status: passPercentage >= 70 ? 'Good' : 
              passPercentage >= 50 ? 'Average' : 'Needs Attention'
    };
  });

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    subjectPerformance: subjectPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage)
  };
};

// Export marks instance methods
const marksInstanceMethods = {
  uploadMarks,
  getMarksForExam,
  getSubjectMarks,
  getAllMarks,
  getSubjectPerformance
};

// Export marks static methods
const marksStaticMethods = {
  getStudentsForMarks,
  checkMarksExist,
  uploadClassMarks,
  overrideClassMarks,
  getClassMarksSummary,
  getClassSubjectPerformance
};

// Export helper functions
const marksHelperFunctions = {
  calculateGrade,
  determineResult
};

module.exports = {
  marksInstanceMethods,
  marksStaticMethods,
  marksHelperFunctions
};