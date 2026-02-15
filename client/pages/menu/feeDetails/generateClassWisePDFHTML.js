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
  const hasTransportFees = sections.some(section => section.totalTransportPending > 0)
  const hasHostelFees = sections.some(section => section.totalHostelPending > 0)

  // Determine which fee columns to show
  const showTransport = hasTransportFees
  const showHostel = hasHostelFees

  // Generate each section's table with proper alignment
  const generateSectionTables = () => {
    return sections.map((section, index) => {
      const students = section.students
      const hasStudents = students.length > 0

      // Calculate section totals (only for visible fee types)
      const sectionTermTotal = students.reduce((sum, s) => sum + s.termFee, 0)
      const sectionTransportTotal = showTransport ? students.reduce((sum, s) => sum + s.transportFee, 0) : 0
      const sectionHostelTotal = showHostel ? students.reduce((sum, s) => sum + s.hostelFee, 0) : 0
      const sectionGrandTotal = students.reduce((sum, s) => sum + s.totalPending, 0)

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
              <span class="summary-item"><strong>Term Fee:</strong> ${formatCurrency(sectionTermTotal)}</span>
              ${showTransport ? `<span class="summary-item"><strong>Transport:</strong> ${formatCurrency(sectionTransportTotal)}</span>` : ''}
              ${showHostel ? `<span class="summary-item"><strong>Hostel:</strong> ${formatCurrency(sectionHostelTotal)}</span>` : ''}
              <span class="summary-item total"><strong>Total:</strong> ${formatCurrency(sectionGrandTotal)}</span>
            </div>
          </div>

          ${hasStudents ? `
            <table class="students-table">
              <thead>
                <tr>
                  <th style="width: 15%">Roll No</th>
                  <th style="width: ${showTransport && showHostel ? '40%' : showTransport || showHostel ? '45%' : '55%'}">Student Name</th>
                  <th style="width: 15%">Term (₹)</th>
                  ${showTransport ? '<th style="width: 15%">Transport (₹)</th>' : ''}
                  ${showHostel ? '<th style="width: 15%">Hostel (₹)</th>' : ''}
                  <th style="width: 15%">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((student, idx) => `
                  <tr>
                    <td>${student.rollNo}</td>
                    <td>${student.name}</td>
                    <td class="amount">${formatCurrency(student.termFee)}</td>
                    ${showTransport ? `<td class="amount">${formatCurrency(student.transportFee)}</td>` : ''}
                    ${showHostel ? `<td class="amount">${formatCurrency(student.hostelFee)}</td>` : ''}
                    <td class="amount total">${formatCurrency(student.totalPending)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="${1 + (showTransport ? 1 : 0) + (showHostel ? 1 : 0)}" class="total-label"><strong>Section Total</strong></td>
                  <td class="amount"><strong>${formatCurrency(sectionTermTotal)}</strong></td>
                  ${showTransport ? `<td class="amount"><strong>${formatCurrency(sectionTransportTotal)}</strong></td>` : ''}
                  ${showHostel ? `<td class="amount"><strong>${formatCurrency(sectionHostelTotal)}</strong></td>` : ''}
                  <td class="amount total"><strong>${formatCurrency(sectionGrandTotal)}</strong></td>
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
          }
          .summary-item.total {
            background: #4F46E5;
            color: white;
          }
          
          /* Table Styles */
          .students-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
            table-layout: fixed;
            border: 1px solid #e5e7eb;
          }
          .students-table th {
            background: #4F46E5;
            color: white;
            font-weight: 600;
            padding: 12px 6px;
            text-align: left;
            font-size: 12px;
          }
          .students-table td {
            padding: 10px 6px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
            word-wrap: break-word;
          }
          .students-table tbody tr:hover {
            background: #f9fafb;
          }
          .students-table tfoot tr {
            background: #f3f4f6;
            font-weight: bold;
          }
          .students-table tfoot td {
            padding: 12px 6px;
            border-top: 2px solid #4F46E5;
          }
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
            white-space: nowrap;
          }
          .total {
            color: #EF4444;
            font-weight: bold;
          }
          .total-label {
            text-align: right;
            font-weight: bold;
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .grand-total-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
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
          
          /* No Data */
          .no-data {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            border-radius: 8px;
            color: #666;
            font-style: italic;
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
              background: #4F46E5 !important;
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
              <div class="grand-total-item">
                <span class="grand-total-label">Total Term Fee</span>
                <span class="grand-total-value">${formatCurrency(grandTotals.totalTermFee)}</span>
              </div>
              ${showTransport ? `
                <div class="grand-total-item">
                  <span class="grand-total-label">Total Transport Fee</span>
                  <span class="grand-total-value">${formatCurrency(grandTotals.totalTransportFee)}</span>
                </div>
              ` : ''}
              ${showHostel ? `
                <div class="grand-total-item">
                  <span class="grand-total-label">Total Hostel Fee</span>
                  <span class="grand-total-value">${formatCurrency(grandTotals.totalHostelFee)}</span>
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