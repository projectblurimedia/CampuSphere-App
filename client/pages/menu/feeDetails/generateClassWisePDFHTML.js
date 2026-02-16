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
  const hasTransportFees = sections.some(section => section.totalTransportPending > 0)
  const hasHostelFees = sections.some(section => section.totalHostelPending > 0)

  // Determine which fee columns to show
  const showTransport = hasTransportFees
  const showHostel = hasHostelFees

  // Calculate column widths based on visible columns
  const getColumnWidths = () => {
    const baseColumns = 3 // Roll No, Name, Tuition, Total
    const totalColumns = baseColumns + (showTransport ? 1 : 0) + (showHostel ? 1 : 0)
    
    return {
      rollNo: '10%',
      name: showTransport && showHostel ? '35%' : showTransport || showHostel ? '40%' : '45%',
      tuition: '15%',
      transport: showTransport ? '15%' : '0%',
      hostel: showHostel ? '15%' : '0%',
      total: '15%'
    }
  }

  const colWidths = getColumnWidths()

  // Generate each section's table with proper alignment
  const generateSectionTables = () => {
    return sections.map((section, index) => {
      const students = section.students
      const hasStudents = students.length > 0

      // Calculate section totals (only for visible fee types)
      const sectionTermTotal = students.reduce((sum, s) => sum + (s.termFee || 0), 0)
      const sectionTransportTotal = showTransport ? students.reduce((sum, s) => sum + (s.transportFee || 0), 0) : 0
      const sectionHostelTotal = showHostel ? students.reduce((sum, s) => sum + (s.hostelFee || 0), 0) : 0
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
              <span class="summary-item"><strong>Tuition Fee:</strong> ${formatCurrency(sectionTermTotal)}</span>
              ${showTransport ? `<span class="summary-item"><strong>Transport:</strong> ${formatCurrency(sectionTransportTotal)}</span>` : ''}
              ${showHostel ? `<span class="summary-item"><strong>Hostel:</strong> ${formatCurrency(sectionHostelTotal)}</span>` : ''}
              <span class="summary-item total"><strong>Total:</strong> ${formatCurrency(sectionGrandTotal)}</span>
            </div>
          </div>

          ${hasStudents ? `
            <table class="students-table">
              <thead>
                <tr>
                  <th style="width: ${colWidths.rollNo}">Roll No</th>
                  <th style="text-align: left; width: ${colWidths.name}">Student Name</th>
                  <th style="width: ${colWidths.tuition}">Tuition (₹)</th>
                  ${showTransport ? `<th style="width: ${colWidths.transport}">Transport (₹)</th>` : ''}
                  ${showHostel ? `<th style="width: ${colWidths.hostel}">Hostel (₹)</th>` : ''}
                  <th style="width: ${colWidths.total}">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((student, idx) => `
                  <tr>
                    <td style="text-align: center;">${student.rollNo || 'N/A'}</td>
                    <td style="text-align: left;">${student.name || 'Unknown'}</td>
                    <td style="text-align: center;">${formatCurrency(student.termFee || 0)}</td>
                    ${showTransport ? `<td style="text-align: center;">${formatCurrency(student.transportFee || 0)}</td>` : ''}
                    ${showHostel ? `<td style="text-align: center;">${formatCurrency(student.hostelFee || 0)}</td>` : ''}
                    <td style="text-align: center; font-weight: bold; color: #EF4444;">${formatCurrency(student.totalPending || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="${1}" class="total-label">Total</td>
                  <td class="total-label"></td>
                  <td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTermTotal)}</strong></td>
                  ${showTransport ? `<td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionTransportTotal)}</strong></td>` : ''}
                  ${showHostel ? `<td class="total-label" style="text-align: center;"><strong>${formatCurrency(sectionHostelTotal)}</strong></td>` : ''}
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
          
          /* Text Alignment */
          .students-table td:nth-child(1) { text-align: left; } /* Roll No */
          .students-table td:nth-child(2) { text-align: left; } /* Name */
          .students-table td:nth-child(3) { text-align: center; } /* Tuition */
          .students-table td:nth-child(4) { text-align: center; } /* Transport (if exists) */
          .students-table td:nth-child(5) { text-align: center; } /* Hostel (if exists) */
          .students-table td:last-child { 
            text-align: center; 
            font-weight: bold; 
            color: #EF4444;
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
          
          /* Amount styling */
          .amount-right {
            text-align: center;
            font-family: 'Courier New', monospace;
          }
          .total-amount {
            color: #EF4444;
            font-weight: bold;
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
              background: #4F46E5 !important;
              color: white !important;
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
            .summary-item.total {
              background: #4F46E5 !important;
              color: white !important;
            }
          }

          /* Responsive adjustments */
          @media screen and (max-width: 768px) {
            .students-table {
              font-size: 11px;
            }
            .students-table th,
            .students-table td {
              padding: 8px 4px;
            }
            .grand-total-grid {
              grid-template-columns: repeat(2, 1fr);
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
                <span class="grand-total-label">Total Tuition Fee</span>
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