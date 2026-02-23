export const schoolInfo = {
  name: 'BLURI (E.M) HIGH SCHOOL',
  address: 'Gavaravaram',
  phone: '+91 7382181235',
  email: 'info@bluri.edu.in',
  website: 'www.bluri.edu.in'
}

export const generateClassWisePDFHTML = (data) => {
  const {
    selectedClass,
    selectedSection,
    selectedTerm,
    sections,
    grandTotals,
    schoolInfo,
    generatedAt
  } = data

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Check if any fee category has non-zero values across all sections
  const hasPreviousYearFees = sections.some(section => section.totalPreviousYearPending > 0)
  
  // Determine which columns to show based on selected term
  const getColumns = () => {
    switch(selectedTerm) {
      case 'First Term':
        return ['Roll No', 'Student Name', 'Term 1', 'Previous Year', 'Total']
      case 'Second Term':
        return ['Roll No', 'Student Name', 'Term 2', 'Previous Year', 'Total']
      case 'Third Term':
        return ['Roll No', 'Student Name', 'Term 3', 'Previous Year', 'Total']
      case 'Previous Year':
        return ['Roll No', 'Student Name', 'Previous Year', 'Total']
      case 'All':
        return ['Roll No', 'Student Name', 'Term 1', 'Term 2', 'Term 3', 'Previous Year', 'Total']
      default:
        return ['Roll No', 'Student Name', 'Term 1', 'Previous Year', 'Total']
    }
  }

  const columns = getColumns()
  
  // Calculate column widths based on selected term
  const getColumnWidth = (col) => {
    if (col === 'Roll No') return '8%'
    if (col === 'Student Name') return '25%'
    if (col === 'Total') return '12%'
    if (col === 'Previous Year') return '12%'
    return '11%'
  }

  // Generate each section's table with proper alignment
  const generateSectionTables = () => {
    return sections.map((section, index) => {
      const students = section.students
      const hasStudents = students.length > 0

      // Calculate section totals based on visible columns
      const sectionTerm1Total = students.reduce((sum, s) => sum + (s.term1Pending || 0), 0)
      const sectionTerm2Total = students.reduce((sum, s) => sum + (s.term2Pending || 0), 0)
      const sectionTerm3Total = students.reduce((sum, s) => sum + (s.term3Pending || 0), 0)
      const sectionPreviousYearTotal = students.reduce((sum, s) => sum + (s.previousYearFee || 0), 0)
      const sectionGrandTotal = students.reduce((sum, s) => sum + (s.totalPending || 0), 0)

      return `
        <div class="section-page" ${index > 0 ? 'style="page-break-before: always;"' : ''}>
          <!-- School Header (repeated on each page) -->
          <div class="school-header">
            <h1 class="school-name">${schoolInfo.name}</h1>
            <div class="school-details">${schoolInfo.address} | ${schoolInfo.phone} | ${schoolInfo.email}</div>
          </div>

          <!-- Report Title with Filters -->
          <div class="report-title-section">
            <div class="filter-info">
              <span class="filter-item"><strong>Class:</strong> ${selectedClass}</span>
              <span class="filter-item"><strong>Section:</strong> ${selectedSection}</span>
              <span class="filter-item"><strong>Term:</strong> ${selectedTerm}</span>
              <span class="filter-item"><strong>Date:</strong> ${formatDate(generatedAt)}</span>
            </div>
          </div>

          <!-- Section Header -->
          <div class="section-header">
            <h2>${section.className} - Section ${section.section}</h2>
            <div class="section-summary">
              <span class="summary-item"><strong>Pending Students:</strong> ${section.pendingCount}</span>
              ${selectedTerm !== 'Previous Year' && selectedTerm !== 'All' ? `
                <span class="summary-item"><strong>${selectedTerm === 'First Term' ? 'Term 1' : selectedTerm === 'Second Term' ? 'Term 2' : 'Term 3'}:</strong> ${
                  formatCurrency(selectedTerm === 'First Term' ? sectionTerm1Total : 
                                selectedTerm === 'Second Term' ? sectionTerm2Total : 
                                sectionTerm3Total)
                }</span>
              ` : ''}
              ${selectedTerm === 'All' ? `
                <span class="summary-item"><strong>Term 1:</strong> ${formatCurrency(sectionTerm1Total)}</span>
                <span class="summary-item"><strong>Term 2:</strong> ${formatCurrency(sectionTerm2Total)}</span>
                <span class="summary-item"><strong>Term 3:</strong> ${formatCurrency(sectionTerm3Total)}</span>
              ` : ''}
              ${hasPreviousYearFees ? `
                <span class="summary-item" style="background: #FEF3C7;"><strong>Previous Year:</strong> ${formatCurrency(sectionPreviousYearTotal)}</span>
              ` : ''}
              <span class="summary-item total"><strong>Total:</strong> ${formatCurrency(sectionGrandTotal)}</span>
            </div>
          </div>

          ${hasStudents ? `
            <table class="students-table">
              <thead>
                <tr>
                  ${columns.map(col => `
                    <th style="width: ${getColumnWidth(col)}; ${col === 'Previous Year' ? 'background: #F59E0B;' : ''} ${col === 'Total' ? 'background: #EF4444;' : ''}">
                      ${col}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${students.map((student) => {
                  const row = `
                    <tr>
                      <td style="text-align: center;">${student.rollNo || 'N/A'}</td>
                      <td style="text-align: left;">${student.name || 'Unknown'}</td>
                  `
                  
                  if (selectedTerm === 'First Term') {
                    return row + `
                      <td style="text-align: center;">${formatCurrency(student.term1Pending || 0)}</td>
                      <td style="text-align: center; ${student.previousYearFee > 0 ? 'background: #FEF3C7; font-weight: bold; color: #F59E0B;' : ''}">${formatCurrency(student.previousYearFee || 0)}</td>
                      <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                    </tr>
                    `
                  } else if (selectedTerm === 'Second Term') {
                    return row + `
                      <td style="text-align: center;">${formatCurrency(student.term2Pending || 0)}</td>
                      <td style="text-align: center; ${student.previousYearFee > 0 ? 'background: #FEF3C7; font-weight: bold; color: #F59E0B;' : ''}">${formatCurrency(student.previousYearFee || 0)}</td>
                      <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                    </tr>
                    `
                  } else if (selectedTerm === 'Third Term') {
                    return row + `
                      <td style="text-align: center;">${formatCurrency(student.term3Pending || 0)}</td>
                      <td style="text-align: center; ${student.previousYearFee > 0 ? 'background: #FEF3C7; font-weight: bold; color: #F59E0B;' : ''}">${formatCurrency(student.previousYearFee || 0)}</td>
                      <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                    </tr>
                    `
                  } else if (selectedTerm === 'Previous Year') {
                    return row + `
                      <td style="text-align: center; ${student.previousYearFee > 0 ? 'background: #FEF3C7; font-weight: bold; color: #F59E0B;' : ''}">${formatCurrency(student.previousYearFee || 0)}</td>
                      <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                    </tr>
                    `
                  } else { // All
                    return row + `
                      <td style="text-align: center;">${formatCurrency(student.term1Pending || 0)}</td>
                      <td style="text-align: center;">${formatCurrency(student.term2Pending || 0)}</td>
                      <td style="text-align: center;">${formatCurrency(student.term3Pending || 0)}</td>
                      <td style="text-align: center; ${student.previousYearFee > 0 ? 'background: #FEF3C7; font-weight: bold; color: #F59E0B;' : ''}">${formatCurrency(student.previousYearFee || 0)}</td>
                      <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                    </tr>
                    `
                  }
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="1" class="total-label">Total</td>
                  <td class="total-label"></td>
                  ${selectedTerm === 'First Term' ? `
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm1Total)}</strong></td>
                    <td class="total-label" style="text-align: center; background: #FEF3C7;"><strong>${formatCurrency(sectionPreviousYearTotal)}</strong></td>
                  ` : ''}
                  ${selectedTerm === 'Second Term' ? `
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm2Total)}</strong></td>
                    <td class="total-label" style="text-align: center; background: #FEF3C7;"><strong>${formatCurrency(sectionPreviousYearTotal)}</strong></td>
                  ` : ''}
                  ${selectedTerm === 'Third Term' ? `
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm3Total)}</strong></td>
                    <td class="total-label" style="text-align: center; background: #FEF3C7;"><strong>${formatCurrency(sectionPreviousYearTotal)}</strong></td>
                  ` : ''}
                  ${selectedTerm === 'Previous Year' ? `
                    <td class="total-label" style="text-align: center; background: #FEF3C7;"><strong>${formatCurrency(sectionPreviousYearTotal)}</strong></td>
                  ` : ''}
                  ${selectedTerm === 'All' ? `
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm1Total)}</strong></td>
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm2Total)}</strong></td>
                    <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTerm3Total)}</strong></td>
                    <td class="total-label" style="text-align: center; background: #FEF3C7;"><strong>${formatCurrency(sectionPreviousYearTotal)}</strong></td>
                  ` : ''}
                  <td class="total-label" style="text-align: center; color: #EF4444;"><strong>${formatCurrency(sectionGrandTotal)}</strong></td>
                </tr>
              </tfoot>
            </table>
          ` : `
            <div class="no-data">
              <p>No pending fees for this section</p>
            </div>
          `}
        </div>
      `
    }).join('')
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Fee Pending Report - ${selectedTerm}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          /* School Header */
          .school-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #4F46E5;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin: 0 0 5px 0;
          }
          .school-details {
            font-size: 12px;
            color: #666;
            margin: 2px 0;
          }
          
          /* Report Title Section */
          .report-title-section {
            margin-bottom: 20px;
          }
          .filter-info {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          .filter-item {
            color: #555;
          }
          
          /* Section Header */
          .section-header {
            margin: 20px 0 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #4F46E5;
          }
          .section-header h2 {
            margin: 0 0 10px 0;
            color: #4F46E5;
            font-size: 18px;
          }
          .section-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            font-size: 13px;
          }
          .summary-item {
            padding: 4px 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .summary-item.total {
            background: #4F46E5;
            color: white;
            border-color: #4F46E5;
          }
          
          /* Table Styles */
          .students-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
            table-layout: fixed;
            border: 2px solid #4F46E5;
          }
          .students-table th {
            background: #4F46E5;
            color: white;
            font-weight: 600;
            padding: 12px 6px;
            text-align: center;
            font-size: 12px;
            border: 1px solid #4338CA;
          }
          .students-table td {
            padding: 10px 6px;
            border: 1px solid #d1d5db;
            vertical-align: middle;
            word-wrap: break-word;
          }
          .students-table tbody tr:hover {
            background: #f9fafb;
          }
          .students-table tfoot tr {
            background: #f3f4f6;
            font-weight: bold;
            border-top: 2px solid #4F46E5;
          }
          .students-table tfoot td {
            padding: 12px 6px;
            border: 1px solid #d1d5db;
            background: #f3f4f6;
          }
          
          /* Footer row alignment */
          .students-table tfoot td.total-label {
            text-align: center;
            font-weight: bold;
          }
          .students-table tfoot td:first-child {
            text-align: left;
          }
          .students-table tfoot td:nth-child(2) {
            text-align: left;
          }
          
          /* No Data */
          .no-data {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            border-radius: 8px;
            color: #666;
            font-style: italic;
            border: 1px solid #e5e7eb;
          }
          
          /* Grand Total Footer */
          .grand-total-footer {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #4F46E5;
            page-break-inside: avoid;
          }
          .grand-total-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #4F46E5;
          }
          .grand-total-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
          }
          .grand-total-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .grand-total-label {
            font-size: 12px;
            color: #666;
          }
          .grand-total-value {
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
          }
          .grand-total-value.total {
            color: #EF4444;
            font-size: 20px;
          }
          
          /* Footer */
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #999;
            text-align: center;
          }
          
          /* Print Styles */
          @media print {
            body { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
              margin: 0.5in;
            }
            .students-table th { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .students-table td {
              border: 1px solid #000 !important;
            }
            .section-page {
              page-break-after: always;
            }
            .section-page:last-child {
              page-break-after: auto;
            }
            .grand-total-footer {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Section Tables (each on new page) -->
          ${generateSectionTables()}
          
          <!-- Grand Total Footer (after last section) -->
          <div class="grand-total-footer">
            <div class="grand-total-title">Summary Report - ${selectedTerm}</div>
            <div class="grand-total-grid">
              <div class="grand-total-item">
                <span class="grand-total-label">Total Sections</span>
                <span class="grand-total-value">${grandTotals.totalSections}</span>
              </div>
              <div class="grand-total-item">
                <span class="grand-total-label">Students with Pending</span>
                <span class="grand-total-value">${grandTotals.totalStudents}</span>
              </div>
              ${selectedTerm !== 'Previous Year' && selectedTerm !== 'All' ? `
                <div class="grand-total-item">
                  <span class="grand-total-label">${selectedTerm === 'First Term' ? 'Term 1' : selectedTerm === 'Second Term' ? 'Term 2' : 'Term 3'} Total</span>
                  <span class="grand-total-value">${formatCurrency(
                    selectedTerm === 'First Term' ? grandTotals.totalTerm1Pending :
                    selectedTerm === 'Second Term' ? grandTotals.totalTerm2Pending :
                    grandTotals.totalTerm3Pending
                  )}</span>
                </div>
              ` : ''}
              ${selectedTerm === 'All' ? `
                <div class="grand-total-item">
                  <span class="grand-total-label">Term 1 Total</span>
                  <span class="grand-total-value">${formatCurrency(grandTotals.totalTerm1Pending)}</span>
                </div>
                <div class="grand-total-item">
                  <span class="grand-total-label">Term 2 Total</span>
                  <span class="grand-total-value">${formatCurrency(grandTotals.totalTerm2Pending)}</span>
                </div>
                <div class="grand-total-item">
                  <span class="grand-total-label">Term 3 Total</span>
                  <span class="grand-total-value">${formatCurrency(grandTotals.totalTerm3Pending)}</span>
                </div>
              ` : ''}
              ${grandTotals.totalPreviousYearFee > 0 ? `
                <div class="grand-total-item" style="border-left: 4px solid #F59E0B;">
                  <span class="grand-total-label">Previous Year Total</span>
                  <span class="grand-total-value" style="color: #F59E0B;">${formatCurrency(grandTotals.totalPreviousYearFee)}</span>
                </div>
              ` : ''}
              <div class="grand-total-item">
                <span class="grand-total-label">GRAND TOTAL PENDING</span>
                <span class="grand-total-value total">${formatCurrency(grandTotals.totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            This is a computer generated report - Valid without signature
          </div>
        </div>
      </body>
    </html>
  `
}