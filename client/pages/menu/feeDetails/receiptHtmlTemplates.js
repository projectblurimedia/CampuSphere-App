export const schoolInfo = {
  name: 'BLURI (E.M) HIGH SCHOOL',
  address: 'Gavaravaram',
  phone: '+91 7382181235',
  email: 'info@bluri.edu.in',
  website: 'www.bluri.edu.in'
}

export const generateReceiptHTML = (receiptData) => {
  // Calculate totals correctly
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 0 // Current year total fee: 32500
  const currentYearPaid = receiptData.feeSummary?.currentYearTotalPaid || 0 // Current year paid: 2000
  const previousYearFee = receiptData.feeSummary?.previousYearFee || 0 // Previous year total fee: 55000
  const previousYearPaid = receiptData.feeSummary?.previousYearPaid || 0 // Previous year paid: 55000
  
  const grandTotal = discountedTotal + previousYearFee // 32500 + 55000 = 87500
  const totalPaid = currentYearPaid + previousYearPaid // 2000 + 55000 = 57000
  const totalDue = grandTotal - totalPaid // 87500 - 57000 = 30500 ✅
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === grandTotal ? 'UNPAID' : 'PARTIAL'

  // Get payment breakdown
  const previousYearBreakdown = receiptData.payment?.previousYearBreakdown || { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 }
  const currentYearBreakdown = receiptData.payment?.currentYearBreakdown || { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 }
  
  // Check if transport or hostel fees exist
  const hasTransportFee = receiptData.feeSummary?.discountedTransportFee > 0 || 
                         currentYearBreakdown.transportFee > 0 || 
                         previousYearBreakdown.transportFee > 0
  const hasHostelFee = receiptData.feeSummary?.discountedHostelFee > 0 || 
                      currentYearBreakdown.hostelFee > 0 || 
                      previousYearBreakdown.hostelFee > 0

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
        .transaction-header {
          background: #1d9bf0;
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .transaction-header-title {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }
        .payment-mode-badge {
          background: white;
          color: #1d9bf0;
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .breakdown-section {
          margin-bottom: 20px;
          padding: 0 15px;
        }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #f0f0f0;
          border-radius: 6px;
        }
        .breakdown-title {
          font-size: 14px;
          font-weight: bold;
        }
        .previous-year-title {
          color: #ff9800;
        }
        .current-year-title {
          color: #1d9bf0;
        }
        .breakdown-total {
          font-size: 14px;
          font-weight: bold;
        }
        .previous-year-total {
          color: #ff9800;
        }
        .current-year-total {
          color: #1d9bf0;
        }
        .fee-items-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .fee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
          padding: 10px 12px;
          border-radius: 6px;
        }
        .fee-label {
          font-size: 13px;
          color: #555;
          font-weight: 500;
        }
        .fee-amount {
          font-size: 14px;
          font-weight: bold;
        }
        .totals-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin: 15px 15px 15px 15px;
        }
        .total-paid-box {
          flex: 1;
          background: #1d9bf0;
          padding: 12px 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-due-box {
          flex: 1;
          background: #dc3545;
          padding: 12px 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          color: white;
          font-size: 14px;
          font-weight: bold;
        }
        .total-amount {
          color: white;
          font-size: 18px;
          font-weight: bold;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 8px 15px;
          border-radius: 6px;
          margin: 10px 15px 15px 15px;
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
          width: ${grandTotal > 0 ? ((totalPaid / grandTotal) * 100) : 0}%;
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

        <!-- Student Info -->
        <div class="student-info">
          <div class="student-name-row">
            <span class="student-name-label">Student Name:</span>
            <span class="student-name-value">${receiptData.student.name}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${receiptData.student.displayClass} - ${receiptData.student.section}</span>
          </div>
          
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
          
          <div class="info-item">
            <span class="info-label">Parent Name:</span>
            <span class="info-value">${receiptData.student.parentName}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Parent Phone:</span>
            <span class="info-value">${receiptData.student.parentPhone}</span>
          </div>
        </div>

        <!-- THIS TRANSACTION BREAKDOWN - Blue Header -->
        <div class="transaction-header">
          <span class="transaction-header-title">THIS TRANSACTION BREAKDOWN</span>
          <span class="payment-mode-badge">${receiptData.payment.mode.replace('_', ' ')}</span>
        </div>
        
        <!-- Previous Year Payment (if any) -->
        ${previousYearBreakdown.total > 0 ? `
        <div class="breakdown-section">
          <div class="breakdown-header">
            <div class="breakdown-title previous-year-title">
              PREVIOUS YEAR PAYMENT
            </div>
            <div class="breakdown-total previous-year-total">
              Total: ₹${previousYearBreakdown.total.toLocaleString()}
            </div>
          </div>
          <div class="fee-items-grid">
            ${previousYearBreakdown.schoolFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.schoolFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasTransportFee && previousYearBreakdown.transportFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.transportFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasHostelFee && previousYearBreakdown.hostelFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.hostelFee.toLocaleString()}</span>
            </div>` : ''}
          </div>
        </div>` : ''}
        
        <!-- Current Year Payment -->
        ${currentYearBreakdown.total > 0 ? `
        <div class="breakdown-section">
          <div class="breakdown-header">
            <div class="breakdown-title current-year-title">
              CURRENT YEAR PAYMENT
            </div>
            <div class="breakdown-total current-year-total">
              Total: ₹${currentYearPaid.toLocaleString()}
            </div>
          </div>
          <div class="fee-items-grid">
            ${currentYearBreakdown.schoolFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.schoolFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasTransportFee && currentYearBreakdown.transportFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.transportFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasHostelFee && currentYearBreakdown.hostelFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.hostelFee.toLocaleString()}</span>
            </div>` : ''}
          </div>
        </div>` : ''}
        
        <!-- Totals Row - Paid and Due Side by Side -->
        <div class="totals-row">
          <div class="total-paid-box">
            <span class="total-label">TOTAL PAID</span>
            <span class="total-amount">₹${receiptData.payment.totalAmount.toLocaleString()}</span>
          </div>
          <div class="total-due-box">
            <span class="total-label">TOTAL DUE</span>
            <span class="total-amount">₹${totalDue.toLocaleString()}</span>
          </div>
        </div>

        <!-- Transaction Details -->
        ${(receiptData.payment.transactionId || receiptData.payment.chequeNo || receiptData.payment.bankName || receiptData.payment.referenceNo) ? `
        <div class="transaction-info">
          ${receiptData.payment.transactionId ? `<span class="transaction-item">ID: ${receiptData.payment.transactionId}</span>` : ''}
          ${receiptData.payment.chequeNo ? `<span class="transaction-item">Chq: ${receiptData.payment.chequeNo}</span>` : ''}
          ${receiptData.payment.bankName ? `<span class="transaction-item">Bank: ${receiptData.payment.bankName}</span>` : ''}
          ${receiptData.payment.referenceNo ? `<span class="transaction-item">Ref: ${receiptData.payment.referenceNo}</span>` : ''}
        </div>` : ''}

        <!-- Fee Summary Section -->
        <div class="summary-section">
          <div class="summary-header">
            <span class="summary-title">FEE SUMMARY</span>
            <span class="summary-status status-${paymentStatus.toLowerCase()}">${paymentStatus}</span>
          </div>
          
          <!-- 2x2 Grid -->
          <div class="summary-grid">
            <!-- Current Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Current Year Fee:</span>
              <span class="summary-value" style="color: #1d9bf0;">₹${discountedTotal.toLocaleString()}</span>
            </div>
            
            <!-- Current Year Paid -->
            <div class="summary-item">
              <span class="summary-label">Current Year Paid:</span>
              <span class="summary-value" style="color: #28a745;">₹${currentYearPaid.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Previous Year Fee:</span>
              <span class="summary-value" style="color: #ff9800;">₹${previousYearFee.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Paid -->
            <div class="summary-item">
              <span class="summary-label">Previous Year Paid:</span>
              <span class="summary-value" style="color: #28a745;">₹${previousYearPaid.toLocaleString()}</span>
            </div>
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

        <!-- Footer -->
        <div class="footer-section">
          <div class="received-signature-row">
            <div class="received-by">
              Received by: <strong>${receiptData.payment.receivedBy}</strong>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-text">Authorized Signatory</div>
            </div>
          </div>

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
  // Calculate totals correctly
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 0 // Current year total fee: 32500
  const currentYearPaid = receiptData.feeSummary?.currentYearTotalPaid || 0 // Current year paid: 2000
  const previousYearFee = receiptData.feeSummary?.previousYearFee || 0 // Previous year total fee: 55000
  const previousYearPaid = receiptData.feeSummary?.previousYearPaid || 0 // Previous year paid: 55000
  
  const grandTotal = discountedTotal + previousYearFee // 32500 + 55000 = 87500
  const totalPaid = currentYearPaid + previousYearPaid // 2000 + 55000 = 57000
  const totalDue = grandTotal - totalPaid // 87500 - 57000 = 30500 ✅
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === grandTotal ? 'UNPAID' : 'PARTIAL'

  // Get payment breakdown
  const previousYearBreakdown = receiptData.payment?.previousYearBreakdown || { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 }
  const currentYearBreakdown = receiptData.payment?.currentYearBreakdown || { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 }
  
  // Check if transport or hostel fees exist
  const hasTransportFee = receiptData.feeSummary?.discountedTransportFee > 0 || 
                         currentYearBreakdown.transportFee > 0 || 
                         previousYearBreakdown.transportFee > 0
  const hasHostelFee = receiptData.feeSummary?.discountedHostelFee > 0 || 
                      currentYearBreakdown.hostelFee > 0 || 
                      previousYearBreakdown.hostelFee > 0

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
        .transaction-header {
          background: #000;
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .transaction-header-title {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }
        .payment-mode-badge {
          background: white;
          color: #000;
          padding: 4px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .breakdown-section {
          margin-bottom: 20px;
          padding: 0 15px;
        }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #f0f0f0;
          border-radius: 6px;
        }
        .breakdown-title {
          font-size: 14px;
          font-weight: bold;
        }
        .previous-year-title {
          color: #ff9800;
        }
        .current-year-title {
          color: #1d9bf0;
        }
        .breakdown-total {
          font-size: 14px;
          font-weight: bold;
        }
        .previous-year-total {
          color: #ff9800;
        }
        .current-year-total {
          color: #1d9bf0;
        }
        .fee-items-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .fee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
          padding: 10px 12px;
          border-radius: 6px;
        }
        .fee-label {
          font-size: 13px;
          color: #555;
          font-weight: 500;
        }
        .fee-amount {
          font-size: 14px;
          font-weight: bold;
        }
        .totals-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin: 15px 15px 15px 15px;
        }
        .total-paid-box {
          flex: 1;
          background: #000;
          padding: 12px 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-due-box {
          flex: 1;
          background: #333;
          padding: 12px 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          color: white;
          font-size: 14px;
          font-weight: bold;
        }
        .total-amount {
          color: white;
          font-size: 18px;
          font-weight: bold;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 8px 15px;
          border-radius: 6px;
          margin: 10px 15px 15px 15px;
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
          width: ${grandTotal > 0 ? ((totalPaid / grandTotal) * 100) : 0}%;
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

        <!-- Student Info -->
        <div class="student-info">
          <div class="student-name-row">
            <span class="student-name-label">Student Name:</span>
            <span class="student-name-value">${receiptData.student.name}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${receiptData.student.displayClass} - ${receiptData.student.section}</span>
          </div>
          
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
          
          <div class="info-item">
            <span class="info-label">Parent Name:</span>
            <span class="info-value">${receiptData.student.parentName}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Parent Phone:</span>
            <span class="info-value">${receiptData.student.parentPhone}</span>
          </div>
        </div>

        <!-- THIS TRANSACTION BREAKDOWN - Black Header for Print -->
        <div class="transaction-header">
          <span class="transaction-header-title">THIS TRANSACTION BREAKDOWN</span>
          <span class="payment-mode-badge">${receiptData.payment.mode.replace('_', ' ')}</span>
        </div>
        
        <!-- Previous Year Payment (if any) -->
        ${previousYearBreakdown.total > 0 ? `
        <div class="breakdown-section">
          <div class="breakdown-header">
            <div class="breakdown-title previous-year-title">
              PREVIOUS YEAR PAYMENT
            </div>
            <div class="breakdown-total previous-year-total">
              Total: ₹${previousYearBreakdown.total.toLocaleString()}
            </div>
          </div>
          <div class="fee-items-grid">
            ${previousYearBreakdown.schoolFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.schoolFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasTransportFee && previousYearBreakdown.transportFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.transportFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasHostelFee && previousYearBreakdown.hostelFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount" style="color: #ff9800;">₹${previousYearBreakdown.hostelFee.toLocaleString()}</span>
            </div>` : ''}
          </div>
        </div>` : ''}
        
        <!-- Current Year Payment -->
        ${currentYearBreakdown.total > 0 ? `
        <div class="breakdown-section">
          <div class="breakdown-header">
            <div class="breakdown-title current-year-title">
              CURRENT YEAR PAYMENT
            </div>
            <div class="breakdown-total current-year-total">
              Total: ₹${currentYearPaid.toLocaleString()}
            </div>
          </div>
          <div class="fee-items-grid">
            ${currentYearBreakdown.schoolFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.schoolFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasTransportFee && currentYearBreakdown.transportFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.transportFee.toLocaleString()}</span>
            </div>` : ''}
            ${hasHostelFee && currentYearBreakdown.hostelFee > 0 ? `
            <div class="fee-item">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount" style="color: #1d9bf0;">₹${currentYearBreakdown.hostelFee.toLocaleString()}</span>
            </div>` : ''}
          </div>
        </div>` : ''}
        
        <!-- Totals Row - Paid and Due Side by Side -->
        <div class="totals-row">
          <div class="total-paid-box">
            <span class="total-label">TOTAL PAID</span>
            <span class="total-amount">₹${receiptData.payment.totalAmount.toLocaleString()}</span>
          </div>
          <div class="total-due-box">
            <span class="total-label">TOTAL DUE</span>
            <span class="total-amount">₹${totalDue.toLocaleString()}</span>
          </div>
        </div>

        <!-- Transaction Details -->
        ${(receiptData.payment.transactionId || receiptData.payment.chequeNo || receiptData.payment.bankName || receiptData.payment.referenceNo) ? `
        <div class="transaction-info">
          ${receiptData.payment.transactionId ? `<span class="transaction-item">ID: ${receiptData.payment.transactionId}</span>` : ''}
          ${receiptData.payment.chequeNo ? `<span class="transaction-item">Chq: ${receiptData.payment.chequeNo}</span>` : ''}
          ${receiptData.payment.bankName ? `<span class="transaction-item">Bank: ${receiptData.payment.bankName}</span>` : ''}
          ${receiptData.payment.referenceNo ? `<span class="transaction-item">Ref: ${receiptData.payment.referenceNo}</span>` : ''}
        </div>` : ''}

        <!-- Fee Summary Section -->
        <div class="summary-section">
          <div class="summary-header">
            <span class="summary-title">FEE SUMMARY</span>
            <span class="summary-status" style="background: ${paymentStatus === 'PAID' ? '#d4edda' : paymentStatus === 'PARTIAL' ? '#fff3cd' : '#f8d7da'}; color: ${paymentStatus === 'PAID' ? '#155724' : paymentStatus === 'PARTIAL' ? '#856404' : '#721c24'};">
              ${paymentStatus}
            </span>
          </div>
          
          <!-- 2x2 Grid -->
          <div class="summary-grid">
            <!-- Current Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Current Year Fee:</span>
              <span class="summary-value">₹${discountedTotal.toLocaleString()}</span>
            </div>
            
            <!-- Current Year Paid -->
            <div class="summary-item">
              <span class="summary-label">Current Year Paid:</span>
              <span class="summary-value">₹${currentYearPaid.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Fee -->
            <div class="summary-item">
              <span class="summary-label">Previous Year Fee:</span>
              <span class="summary-value">₹${previousYearFee.toLocaleString()}</span>
            </div>
            
            <!-- Previous Year Paid -->
            <div class="summary-item">
              <span class="summary-label">Previous Year Paid:</span>
              <span class="summary-value">₹${previousYearPaid.toLocaleString()}</span>
            </div>
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

        <!-- Footer -->
        <div class="footer-section">
          <div class="received-signature-row">
            <div class="received-by">
              Received by: <strong>${receiptData.payment.receivedBy}</strong>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-text">Authorized Signatory</div>
            </div>
          </div>

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