export const schoolInfo = {
  name: 'BLURI (E.M) HIGH SCHOOL',
  address: 'Gavaravaram',
  phone: '+91 7382181235',
  email: 'info@bluri.edu.in',
  website: 'www.bluri.edu.in'
}

export const generateReceiptHTML = (receiptData) => {
  // Calculate totals
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 0
  const previousYearFee = receiptData.feeSummary?.previousYearFee || 0
  const grandTotal = discountedTotal + previousYearFee
  const totalPaid = receiptData.feeSummary?.totalPaid || receiptData.payment?.totalAmount || 0
  const totalDue = receiptData.feeSummary?.totalDue || (grandTotal - totalPaid) || 0
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === grandTotal ? 'UNPAID' : 'PARTIAL'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 15px;
          background: #f5f5f5;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1d9bf0;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          color: #1d9bf0;
          margin-bottom: 3px;
        }
        .school-address {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        .school-contact {
          font-size: 11px;
          color: #888;
        }
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-top: 8px;
        }
        .receipt-no {
          font-size: 15px;
          color: #666;
          margin-top: 3px;
        }
        .student-info {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .student-name-row {
          grid-column: span 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 5px;
        }
        .student-name-label {
          font-weight: bold;
          color: #555;
          font-size: 14px;
        }
        .student-name-value {
          color: #333;
          font-size: 14px;
          font-weight: bold;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          font-size: 12px;
        }
        .info-value {
          color: #333;
          font-size: 12px;
        }
        .fee-component-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .fee-component-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          margin-bottom: 12px;
        }
        .fee-component-title {
          font-size: 16px;
          font-weight: bold;
          color: #1d9bf0;
          text-align: left;
        }
        .payment-mode-badge {
          background: #1d9bf0;
          color: white;
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          justify-self: center;
        }
        .previous-year-header-badge {
          background-color: #fff3cd;
          color: #856404;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          justify-self: end;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          background: #1d9bf0;
          color: white;
          padding: 8px 10px;
          text-align: left;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
        }
        .amount-col {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          background: #f0f0f0;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 8px 15px;
          border-radius: 6px;
          margin: 10px 0 15px 0;
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #666;
          justify-content: center;
          flex-wrap: wrap;
        }
        .transaction-item {
          background: white;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .summary-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #1d9bf0;
        }
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #1d9bf0;
        }
        .summary-status {
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-paid {
          background-color: #d4edda;
          color: #155724;
        }
        .status-partial {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-unpaid {
          background-color: #f8d7da;
          color: #721c24;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          background: white;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 13px;
        }
        .summary-label {
          color: #666;
          font-weight: bold;
        }
        .summary-value {
          font-weight: bold;
        }
        .total-due-row {
          background: white;
          padding: 12px 15px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 2px solid #dc3545;
          margin-top: 5px;
        }
        .total-due-label {
          font-size: 15px;
          font-weight: bold;
          color: #333;
        }
        .total-due-value {
          font-size: 18px;
          font-weight: bold;
          color: ${totalDue > 0 ? '#dc3545' : '#28a745'};
        }
        .progress-bar {
          margin-top: 15px;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #1d9bf0;
          width: ${grandTotal > 0 ? (totalPaid / grandTotal * 100) : 0}%;
        }
        .progress-text {
          text-align: right;
          margin-top: 3px;
          font-size: 11px;
          color: #666;
        }
        .footer-section {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px dashed #ddd;
        }
        .received-signature-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          margin-top: 20px;
        }
        .received-by {
          font-size: 12px;
          color: #666;
        }
        .received-by strong {
          color: #333;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          width: 180px;
          border-bottom: 1px solid #333;
          margin-bottom: 4px;
        }
        .signature-text {
          font-size: 11px;
          color: #666;
        }
        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #999;
          font-style: italic;
          margin-top: 10px;
        }
        .watermark {
          position: fixed;
          bottom: 15px;
          right: 25px;
          font-size: 10px;
          color: rgba(204, 204, 204, 0.3);
          z-index: 0;
          pointer-events: none;
          transform: rotate(-5deg);
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <div class="school-name">${schoolInfo.name}</div>
          <div class="school-address">${schoolInfo.address}</div>
          <div class="school-contact">${schoolInfo.phone} | ${schoolInfo.email} | ${schoolInfo.website}</div>
          <div class="receipt-title">FEE PAYMENT RECEIPT</div>
          <div class="receipt-no">Receipt No: ${receiptData.receiptNo}</div>
        </div>

        <!-- Student Info - 2x2 Grid with Student Name Full Row -->
        <div class="student-info">
          <!-- Student Name - Full Row -->
          <div class="student-name-row">
            <span class="student-name-label">Student Name:</span>
            <span class="student-name-value">${receiptData.student.name}</span>
          </div>
          
          <!-- Class & Section -->
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${receiptData.student.class} - ${receiptData.student.section}</span>
          </div>
          
          <!-- Payment Date with Time -->
          <div class="info-item">
            <span class="info-label">Payment Date:</span>
            <span class="info-value">${new Date(receiptData.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          <!-- Parent Name -->
          <div class="info-item">
            <span class="info-label">Parent Name:</span>
            <span class="info-value">${receiptData.student.parentName}</span>
          </div>
          
          <!-- Parent Phone -->
          <div class="info-item">
            <span class="info-label">Parent Phone:</span>
            <span class="info-value">${receiptData.student.parentPhone}</span>
          </div>
        </div>

        <!-- 1. Fee Component Section with Left, Center, Right Layout -->
        <div class="fee-component-section">
          <div class="fee-component-header">
            <span class="fee-component-title">Fee Components</span>
            <span class="payment-mode-badge">${receiptData.payment.mode.replace('_', ' ')}</span>
            ${receiptData.payment?.isPreviousYear ? `
            <span class="previous-year-header-badge">
              Previous Year Fee ${receiptData.payment.previousYearInfo?.academicYear ? `(${receiptData.payment.previousYearInfo.academicYear})` : ''}
            </span>` : '<span></span>'}
          </div>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th class="amount-col">Amount Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.payment.breakdown.schoolFee > 0 ? `
              <tr>
                <td>School Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.schoolFee.toLocaleString()}</td>
              </tr>` : ''}
              ${receiptData.payment.breakdown.transportFee > 0 ? `
              <tr>
                <td>Transport Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.transportFee.toLocaleString()}</td>
              </tr>` : ''}
              ${receiptData.payment.breakdown.hostelFee > 0 ? `
              <tr>
                <td>Hostel Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.hostelFee.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td><strong>TOTAL PAID</strong></td>
                <td class="amount-col"><strong>₹${receiptData.payment.totalAmount.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Transaction Details -->
        ${(receiptData.payment.transactionId || receiptData.payment.chequeNo || receiptData.payment.bankName || receiptData.payment.referenceNo) ? `
        <div class="transaction-info">
          ${receiptData.payment.transactionId ? `<span class="transaction-item">ID: ${receiptData.payment.transactionId}</span>` : ''}
          ${receiptData.payment.chequeNo ? `<span class="transaction-item">Chq: ${receiptData.payment.chequeNo}</span>` : ''}
          ${receiptData.payment.bankName ? `<span class="transaction-item">Bank: ${receiptData.payment.bankName}</span>` : ''}
          ${receiptData.payment.referenceNo ? `<span class="transaction-item">Ref: ${receiptData.payment.referenceNo}</span>` : ''}
        </div>` : ''}

        <!-- 3. Fee Summary Section with Status on Right -->
        <div class="summary-section">
          <div class="summary-header">
            <span class="summary-title">Fee Summary</span>
            <span class="summary-status status-${paymentStatus.toLowerCase()}">${paymentStatus}</span>
          </div>
          
          <!-- 2x2 Grid for Current Year, Previous Year, Grand Total, Total Paid -->
          <div class="summary-grid">
            <!-- Current Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Current Year:</span>
              <span class="summary-value" style="color: #1d9bf0;">₹${discountedTotal.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Fee (if applicable) -->
            <div class="summary-item">
              <span class="summary-label">Previous Year:</span>
              <span class="summary-value" style="color: ${previousYearFee > 0 ? '#ff9800' : '#666'};">${previousYearFee > 0 ? '₹' + previousYearFee.toLocaleString() : '₹0'}</span>
            </div>
            
            <!-- Grand Total -->
            <div class="summary-item">
              <span class="summary-label">Grand Total:</span>
              <span class="summary-value" style="color: #333;">₹${grandTotal.toLocaleString()}</span>
            </div>
            
            <!-- Total Paid -->
            <div class="summary-item">
              <span class="summary-label">Total Paid:</span>
              <span class="summary-value" style="color: #28a745;">₹${totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <!-- Total Due (Full Width) -->
          <div class="total-due-row">
            <span class="total-due-label">Total Due:</span>
            <span class="total-due-value">₹${totalDue.toLocaleString()}</span>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">
            ${grandTotal > 0 ? ((totalPaid / grandTotal) * 100).toFixed(1) : 0}% Paid
          </div>
        </div>

        ${receiptData.payment.description ? `
        <div style="margin: 10px 0; font-size: 12px; color: #666; background: #f9f9f9; padding: 8px 12px; border-radius: 6px;">
          <strong>Note:</strong> ${receiptData.payment.description}
        </div>` : ''}

        <!-- 4. Footer with Dashed Line -->
        <div class="footer-section">
          <!-- Received By (Left) and Signature (Right) -->
          <div class="received-signature-row">
            <div class="received-by">
              Received by: <strong>${receiptData.payment.receivedBy}</strong>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-text">Authorized Signatory</div>
            </div>
          </div>

          <!-- Centered Footer Note -->
          <div class="footer-note">
            This is a computer generated receipt and does not require a physical signature.
          </div>
        </div>
      </div>
      <div class="watermark">${schoolInfo.name} - Official Receipt</div>
    </body>
    </html>
  `
}

export const generatePrintHTML = (receiptData) => {
  // Calculate totals
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 0
  const previousYearFee = receiptData.feeSummary?.previousYearFee || 0
  const grandTotal = discountedTotal + previousYearFee
  const totalPaid = receiptData.feeSummary?.totalPaid || receiptData.payment?.totalAmount || 0
  const totalDue = receiptData.feeSummary?.totalDue || (grandTotal - totalPaid) || 0
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === grandTotal ? 'UNPAID' : 'PARTIAL'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 15px;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .school-address {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        .school-contact {
          font-size: 11px;
          color: #888;
        }
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          margin-top: 8px;
        }
        .receipt-no {
          font-size: 15px;
          color: #666;
          margin-top: 3px;
        }
        .student-info {
          margin-bottom: 15px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .student-name-row {
          grid-column: span 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 5px;
        }
        .student-name-label {
          font-weight: bold;
          color: #555;
          font-size: 14px;
        }
        .student-name-value {
          color: #333;
          font-size: 14px;
          font-weight: bold;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          font-size: 12px;
        }
        .info-value {
          color: #333;
          font-size: 12px;
        }
        .fee-component-section {
          margin-bottom: 15px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .fee-component-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          margin-bottom: 12px;
        }
        .fee-component-title {
          font-size: 16px;
          font-weight: bold;
          text-align: left;
        }
        .payment-mode-badge {
          background: #000;
          color: white;
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          justify-self: center;
        }
        .previous-year-header-badge {
          background-color: #fff3cd;
          color: #856404;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          justify-self: end;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
        }
        .amount-col {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 8px 15px;
          border-radius: 6px;
          margin: 10px 0 15px 0;
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #666;
          justify-content: center;
          flex-wrap: wrap;
        }
        .transaction-item {
          background: white;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .summary-section {
          margin: 15px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #000;
        }
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
        }
        .summary-status {
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          background: white;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 13px;
        }
        .summary-label {
          color: #666;
          font-weight: bold;
        }
        .summary-value {
          font-weight: bold;
        }
        .total-due-row {
          background: white;
          padding: 12px 15px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 2px solid #000;
          margin-top: 5px;
        }
        .total-due-label {
          font-size: 15px;
          font-weight: bold;
        }
        .total-due-value {
          font-size: 18px;
          font-weight: bold;
        }
        .progress-bar {
          margin-top: 15px;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #000;
          width: ${grandTotal > 0 ? (totalPaid / grandTotal * 100) : 0}%;
        }
        .progress-text {
          text-align: right;
          margin-top: 3px;
          font-size: 11px;
          color: #666;
        }
        .footer-section {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px dashed #ddd;
        }
        .received-signature-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          margin-top: 20px;
        }
        .received-by {
          font-size: 12px;
          color: #666;
        }
        .received-by strong {
          color: #333;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          width: 180px;
          border-bottom: 1px solid #333;
          margin-bottom: 4px;
        }
        .signature-text {
          font-size: 11px;
          color: #666;
        }
        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #999;
          font-style: italic;
          margin-top: 10px;
        }
        .watermark-print {
          display: none;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .watermark-print {
            display: block;
            position: fixed;
            bottom: 15px;
            right: 25px;
            font-size: 10px;
            color: rgba(0, 0, 0, 0.1);
            z-index: 0;
            pointer-events: none;
            transform: rotate(-5deg);
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <div class="school-name">${schoolInfo.name}</div>
          <div class="school-address">${schoolInfo.address}</div>
          <div class="school-contact">${schoolInfo.phone} | ${schoolInfo.email}</div>
          <div class="receipt-title">FEE PAYMENT RECEIPT</div>
          <div class="receipt-no">Receipt No: ${receiptData.receiptNo}</div>
        </div>

        <!-- Student Info - 2x2 Grid with Student Name Full Row -->
        <div class="student-info">
          <!-- Student Name - Full Row -->
          <div class="student-name-row">
            <span class="student-name-label">Student Name:</span>
            <span class="student-name-value">${receiptData.student.name}</span>
          </div>
          
          <!-- Class & Section -->
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${receiptData.student.class} - ${receiptData.student.section}</span>
          </div>
          
          <!-- Payment Date with Time -->
          <div class="info-item">
            <span class="info-label">Payment Date:</span>
            <span class="info-value">${new Date(receiptData.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          <!-- Parent Name -->
          <div class="info-item">
            <span class="info-label">Parent Name:</span>
            <span class="info-value">${receiptData.student.parentName}</span>
          </div>
          
          <!-- Parent Phone -->
          <div class="info-item">
            <span class="info-label">Parent Phone:</span>
            <span class="info-value">${receiptData.student.parentPhone}</span>
          </div>
        </div>

        <!-- 1. Fee Component Section with Left, Center, Right Layout -->
        <div class="fee-component-section">
          <div class="fee-component-header">
            <span class="fee-component-title">Fee Components</span>
            <span class="payment-mode-badge">${receiptData.payment.mode.replace('_', ' ')}</span>
            ${receiptData.payment?.isPreviousYear ? `
            <span class="previous-year-header-badge">
              Previous Year Fee${receiptData.payment.previousYearInfo?.academicYear ? `(${receiptData.payment.previousYearInfo.academicYear})` : ''}
            </span>` : '<span></span>'}
          </div>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th class="amount-col">Amount Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.payment.breakdown.schoolFee > 0 ? `
              <tr>
                <td>School Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.schoolFee.toLocaleString()}</td>
              </tr>` : ''}
              ${receiptData.payment.breakdown.transportFee > 0 ? `
              <tr>
                <td>Transport Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.transportFee.toLocaleString()}</td>
              </tr>` : ''}
              ${receiptData.payment.breakdown.hostelFee > 0 ? `
              <tr>
                <td>Hostel Fee</td>
                <td class="amount-col">${receiptData.payment.breakdown.hostelFee.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td><strong>TOTAL PAID</strong></td>
                <td class="amount-col"><strong>₹${receiptData.payment.totalAmount.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Transaction Details -->
        ${(receiptData.payment.transactionId || receiptData.payment.chequeNo || receiptData.payment.bankName || receiptData.payment.referenceNo) ? `
        <div class="transaction-info">
          ${receiptData.payment.transactionId ? `<span class="transaction-item">ID: ${receiptData.payment.transactionId}</span>` : ''}
          ${receiptData.payment.chequeNo ? `<span class="transaction-item">Chq: ${receiptData.payment.chequeNo}</span>` : ''}
          ${receiptData.payment.bankName ? `<span class="transaction-item">Bank: ${receiptData.payment.bankName}</span>` : ''}
        </div>` : ''}

        <!-- 3. Fee Summary Section with Status on Right -->
        <div class="summary-section">
          <div class="summary-header">
            <span class="summary-title">Fee Summary</span>
            <span class="summary-status" style="background: ${paymentStatus === 'PAID' ? '#d4edda' : paymentStatus === 'PARTIAL' ? '#fff3cd' : '#f8d7da'}; color: ${paymentStatus === 'PAID' ? '#155724' : paymentStatus === 'PARTIAL' ? '#856404' : '#721c24'};">
              ${paymentStatus}
            </span>
          </div>
          
          <!-- 2x2 Grid for Current Year, Previous Year, Grand Total, Total Paid -->
          <div class="summary-grid">
            <!-- Current Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Current Year:</span>
              <span class="summary-value">₹${discountedTotal.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Fee (if applicable) -->
            <div class="summary-item">
              <span class="summary-label">Previous Year:</span>
              <span class="summary-value">${previousYearFee > 0 ? '₹' + previousYearFee.toLocaleString() : '₹0'}</span>
            </div>
            
            <!-- Grand Total -->
            <div class="summary-item">
              <span class="summary-label">Grand Total:</span>
              <span class="summary-value">₹${grandTotal.toLocaleString()}</span>
            </div>
            
            <!-- Total Paid -->
            <div class="summary-item">
              <span class="summary-label">Total Paid:</span>
              <span class="summary-value">₹${totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <!-- Total Due (Full Width) -->
          <div class="total-due-row">
            <span class="total-due-label">Total Due:</span>
            <span class="total-due-value">₹${totalDue.toLocaleString()}</span>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">
            ${grandTotal > 0 ? ((totalPaid / grandTotal) * 100).toFixed(1) : 0}% Paid
          </div>
        </div>

        ${receiptData.payment.description ? `
        <div style="margin: 10px 0; font-size: 12px; color: #666; background: #f9f9f9; padding: 8px 12px; border-radius: 6px;">
          <strong>Note:</strong> ${receiptData.payment.description}
        </div>` : ''}

        <!-- 4. Footer with Dashed Line -->
        <div class="footer-section">
          <!-- Received By (Left) and Signature (Right) -->
          <div class="received-signature-row">
            <div class="received-by">
              Received by: <strong>${receiptData.payment.receivedBy}</strong>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-text">Authorized Signatory</div>
            </div>
          </div>

          <!-- Centered Footer Note -->
          <div class="footer-note">
            This is a computer generated receipt and does not require a physical signature.
          </div>
        </div>
      </div>
      <div class="watermark-print">${schoolInfo.name} - Official Receipt</div>
    </body>
    </html>
  `
}