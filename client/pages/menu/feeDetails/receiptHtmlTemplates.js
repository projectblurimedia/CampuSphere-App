export const schoolInfo = {
  name: 'BLURI (E.M) HIGH SCHOOL',
  address: 'Gavaravaram',
  phone: '+91 7382181235',
  email: 'info@bluri.edu.in',
  website: 'www.bluri.edu.in'
}

export const generateReceiptHTML = (receiptData) => {
  // Calculate totals if not provided
  const originalTotal = receiptData.feeSummary?.originalTotalFee || 
    (receiptData.student?.originalSchoolFee + receiptData.student?.originalTransportFee + receiptData.student?.originalHostelFee) || 0
  
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 
    (receiptData.student?.discountedSchoolFee + receiptData.student?.discountedTransportFee + receiptData.student?.discountedHostelFee) || 0
  
  const totalPaid = receiptData.feeSummary?.totalPaid || receiptData.payment?.totalAmount || 0
  const totalDue = receiptData.feeSummary?.totalDue || (discountedTotal - totalPaid) || 0
  const totalDiscount = receiptData.feeSummary?.totalDiscount || (originalTotal - discountedTotal) || 0
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === discountedTotal ? 'UNPAID' : 'PARTIAL'

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
          padding: 20px;
          background: #f5f5f5;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1d9bf0;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          color: #1d9bf0;
          margin-bottom: 5px;
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
          margin-top: 10px;
        }
        .receipt-no {
          font-size: 16px;
          color: #666;
          margin-top: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        .status-paid {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status-partial {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
        }
        .status-unpaid {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .student-info {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          width: 120px;
        }
        .info-value {
          color: #333;
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #1d9bf0;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .amount-col {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          background: #f0f0f0;
        }
        .summary-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #1d9bf0;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #1d9bf0;
          margin-bottom: 15px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          padding: 10px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .summary-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }
        .summary-amount {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .summary-amount-small {
          font-size: 14px;
          color: #666;
        }
        .progress-bar {
          margin-top: 15px;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #1d9bf0;
          width: ${discountedTotal > 0 ? (totalPaid / discountedTotal * 100) : 0}%;
        }
        .payment-details {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .fee-breakdown {
          margin: 20px 0;
        }
        .fee-component {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .component-name {
          font-weight: bold;
          color: #555;
        }
        .component-amounts {
          display: flex;
          gap: 20px;
        }
        .original-amount {
          color: #999;
          text-decoration: line-through;
          font-size: 12px;
        }
        .discounted-amount {
          color: #28a745;
          font-weight: bold;
        }
        .paid-amount {
          color: #1d9bf0;
          font-weight: bold;
        }
        .due-amount {
          color: #dc3545;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px dashed #ddd;
          display: flex;
          justify-content: flex-end;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .note {
          font-size: 12px;
          color: #999;
          margin-top: 20px;
          text-align: center;
        }
        .watermark {
          position: fixed;
          bottom: 10px;
          right: 10px;
          font-size: 10px;
          color: #ccc;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="school-name">${schoolInfo.name}</div>
          <div class="school-address">${schoolInfo.address}</div>
          <div class="school-contact">${schoolInfo.phone} | ${schoolInfo.email} | ${schoolInfo.website}</div>
          <div class="receipt-title">FEE PAYMENT RECEIPT</div>
          <div class="receipt-no">Receipt No: ${receiptData.receiptNo}</div>
          <div class="status-badge status-${paymentStatus.toLowerCase()}">
            ${paymentStatus}
          </div>
        </div>

        <div class="student-info">
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${receiptData.student.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Admission No:</span>
            <span class="info-value">${receiptData.student.admissionNo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${receiptData.student.class} - ${receiptData.student.section}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Parent Name:</span>
            <span class="info-value">${receiptData.student.parentName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Parent Phone:</span>
            <span class="info-value">${receiptData.student.parentPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Date:</span>
            <span class="info-value">${new Date(receiptData.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>

        <!-- Fee Summary Section - Shows what was to be paid vs what's paid -->
        <div class="summary-section">
          <div class="summary-title">Fee Summary</div>
          
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Original Total Fee</div>
              <div class="summary-amount">₹${originalTotal.toLocaleString()}</div>
              <div class="summary-amount-small">Before discounts</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Total Discount</div>
              <div class="summary-amount" style="color: #ff9800;">₹${totalDiscount.toLocaleString()}</div>
              <div class="summary-amount-small">${originalTotal > 0 ? ((totalDiscount / originalTotal) * 100).toFixed(1) : 0}% off</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Discounted Total</div>
              <div class="summary-amount" style="color: #28a745;">₹${discountedTotal.toLocaleString()}</div>
              <div class="summary-amount-small">Final amount to pay</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Total Paid</div>
              <div class="summary-amount" style="color: #1d9bf0;">₹${totalPaid.toLocaleString()}</div>
              <div class="summary-amount-small">Across all payments</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Remaining Balance</div>
              <div class="summary-amount" style="color: ${totalDue > 0 ? '#dc3545' : '#28a745'};">₹${totalDue.toLocaleString()}</div>
              <div class="summary-amount-small">${totalDue === 0 ? 'Fully Paid' : 'Still due'}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Payment Progress</div>
              <div class="summary-amount">${discountedTotal > 0 ? ((totalPaid / discountedTotal) * 100).toFixed(1) : 0}%</div>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Fee Breakdown by Component -->
        <div class="fee-breakdown">
          <div class="summary-title">Fee Component Breakdown</div>
          
          ${receiptData.student?.originalSchoolFee > 0 ? `
          <div class="fee-component">
            <span class="component-name">School Fee</span>
            <div class="component-amounts">
              <span class="original-amount">₹${receiptData.student.originalSchoolFee.toLocaleString()}</span>
              <span class="discounted-amount">₹${receiptData.student.discountedSchoolFee?.toLocaleString() || receiptData.student.originalSchoolFee.toLocaleString()}</span>
              <span class="paid-amount">₹${(receiptData.student.schoolFeePaid || 0).toLocaleString()}</span>
              <span class="due-amount">₹${((receiptData.student.discountedSchoolFee || receiptData.student.originalSchoolFee) - (receiptData.student.schoolFeePaid || 0)).toLocaleString()}</span>
            </div>
          </div>` : ''}
          
          ${receiptData.student?.originalTransportFee > 0 ? `
          <div class="fee-component">
            <span class="component-name">Transport Fee</span>
            <div class="component-amounts">
              <span class="original-amount">₹${receiptData.student.originalTransportFee.toLocaleString()}</span>
              <span class="discounted-amount">₹${receiptData.student.discountedTransportFee?.toLocaleString() || receiptData.student.originalTransportFee.toLocaleString()}</span>
              <span class="paid-amount">₹${(receiptData.student.transportFeePaid || 0).toLocaleString()}</span>
              <span class="due-amount">₹${((receiptData.student.discountedTransportFee || receiptData.student.originalTransportFee) - (receiptData.student.transportFeePaid || 0)).toLocaleString()}</span>
            </div>
          </div>` : ''}
          
          ${receiptData.student?.originalHostelFee > 0 ? `
          <div class="fee-component">
            <span class="component-name">Hostel Fee</span>
            <div class="component-amounts">
              <span class="original-amount">₹${receiptData.student.originalHostelFee.toLocaleString()}</span>
              <span class="discounted-amount">₹${receiptData.student.discountedHostelFee?.toLocaleString() || receiptData.student.originalHostelFee.toLocaleString()}</span>
              <span class="paid-amount">₹${(receiptData.student.hostelFeePaid || 0).toLocaleString()}</span>
              <span class="due-amount">₹${((receiptData.student.discountedHostelFee || receiptData.student.originalHostelFee) - (receiptData.student.hostelFeePaid || 0)).toLocaleString()}</span>
            </div>
          </div>` : ''}
        </div>

        <!-- Current Payment Details -->
        <table>
          <thead>
            <tr>
              <th>Fee Component</th>
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
              <td><strong>TOTAL PAID (This Transaction)</strong></td>
              <td class="amount-col"><strong>₹${receiptData.payment.totalAmount.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="payment-details">
          <div class="info-row">
            <span class="info-label">Payment Mode:</span>
            <span class="info-value">${receiptData.payment.mode.replace('_', ' ')}</span>
          </div>
          ${receiptData.payment.transactionId ? `
          <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span class="info-value">${receiptData.payment.transactionId}</span>
          </div>` : ''}
          ${receiptData.payment.chequeNo ? `
          <div class="info-row">
            <span class="info-label">Cheque No:</span>
            <span class="info-value">${receiptData.payment.chequeNo}</span>
          </div>` : ''}
          ${receiptData.payment.bankName ? `
          <div class="info-row">
            <span class="info-label">Bank:</span>
            <span class="info-value">${receiptData.payment.bankName}</span>
          </div>` : ''}
          ${receiptData.payment.referenceNo ? `
          <div class="info-row">
            <span class="info-label">Reference No:</span>
            <span class="info-value">${receiptData.payment.referenceNo}</span>
          </div>` : ''}
          ${receiptData.payment.description ? `
          <div class="info-row">
            <span class="info-label">Description:</span>
            <span class="info-value">${receiptData.payment.description}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Received By:</span>
            <span class="info-value">${receiptData.payment.receivedBy}</span>
          </div>
        </div>

        <!-- Payment History Summary -->
        ${receiptData.paymentHistory && receiptData.paymentHistory.length > 1 ? `
        <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
          <div style="font-weight: bold; margin-bottom: 10px;">Payment History</div>
          ${receiptData.paymentHistory.map(p => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid #eee;">
              <span>${new Date(p.date).toLocaleDateString()}</span>
              <span>${p.receiptNo}</span>
              <span style="font-weight: bold;">₹${p.totalAmount.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>` : ''}

        <div class="footer">
          <div class="signature">
            <div>____________________</div>
            <div>Authorized Signatory</div>
          </div>
        </div>

        <div class="note">
          This is a computer generated receipt and does not require a physical signature.
        </div>
      </div>
      <div class="watermark">${schoolInfo.name} - Official Receipt</div>
    </body>
    </html>
  `
}

export const generatePrintHTML = (receiptData) => {
  // Calculate totals if not provided
  const originalTotal = receiptData.feeSummary?.originalTotalFee || 
    (receiptData.student?.originalSchoolFee + receiptData.student?.originalTransportFee + receiptData.student?.originalHostelFee) || 0
  
  const discountedTotal = receiptData.feeSummary?.discountedTotalFee || 
    (receiptData.student?.discountedSchoolFee + receiptData.student?.discountedTransportFee + receiptData.student?.discountedHostelFee) || 0
  
  const totalPaid = receiptData.feeSummary?.totalPaid || receiptData.payment?.totalAmount || 0
  const totalDue = receiptData.feeSummary?.totalDue || (discountedTotal - totalPaid) || 0
  const totalDiscount = receiptData.feeSummary?.totalDiscount || (originalTotal - discountedTotal) || 0
  
  const paymentStatus = totalDue === 0 ? 'PAID' : totalDue === discountedTotal ? 'UNPAID' : 'PARTIAL'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .school-address {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        .school-contact {
          font-size: 11px;
          color: #888;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          margin-top: 10px;
        }
        .receipt-no {
          font-size: 16px;
          margin-top: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        .student-info {
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
        }
        .summary-section {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          padding: 10px;
          background: white;
          border: 1px solid #eee;
          border-radius: 4px;
        }
        .summary-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }
        .summary-amount {
          font-size: 16px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
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
        .footer {
          margin-top: 50px;
          display: flex;
          justify-content: flex-end;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="school-name">${schoolInfo.name}</div>
          <div class="school-address">${schoolInfo.address}</div>
          <div class="school-contact">${schoolInfo.phone} | ${schoolInfo.email}</div>
          <div class="receipt-title">FEE PAYMENT RECEIPT</div>
          <div class="receipt-no">Receipt No: ${receiptData.receiptNo}</div>
          <div class="status-badge" style="background: ${paymentStatus === 'PAID' ? '#d4edda' : paymentStatus === 'PARTIAL' ? '#fff3cd' : '#f8d7da'}; color: ${paymentStatus === 'PAID' ? '#155724' : paymentStatus === 'PARTIAL' ? '#856404' : '#721c24'};">
            ${paymentStatus}
          </div>
        </div>

        <div class="student-info">
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span>${receiptData.student.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Admission No:</span>
            <span>${receiptData.student.admissionNo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Class & Section:</span>
            <span>${receiptData.student.class} - ${receiptData.student.section}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Parent Name:</span>
            <span>${receiptData.student.parentName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Parent Phone:</span>
            <span>${receiptData.student.parentPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Date:</span>
            <span>${new Date(receiptData.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-title">Fee Summary</div>
          
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Original Total</div>
              <div class="summary-amount">₹${originalTotal.toLocaleString()}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Discount Applied</div>
              <div class="summary-amount">₹${totalDiscount.toLocaleString()}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Discounted Total</div>
              <div class="summary-amount">₹${discountedTotal.toLocaleString()}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Total Paid</div>
              <div class="summary-amount">₹${totalPaid.toLocaleString()}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Remaining Due</div>
              <div class="summary-amount">₹${totalDue.toLocaleString()}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Payment Progress</div>
              <div class="summary-amount">${discountedTotal > 0 ? ((totalPaid / discountedTotal) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fee Component</th>
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

        <div class="payment-details">
          <div class="info-row">
            <span class="info-label">Payment Mode:</span>
            <span>${receiptData.payment.mode.replace('_', ' ')}</span>
          </div>
          ${receiptData.payment.transactionId ? `
          <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span>${receiptData.payment.transactionId}</span>
          </div>` : ''}
          ${receiptData.payment.chequeNo ? `
          <div class="info-row">
            <span class="info-label">Cheque No:</span>
            <span>${receiptData.payment.chequeNo}</span>
          </div>` : ''}
          ${receiptData.payment.bankName ? `
          <div class="info-row">
            <span class="info-label">Bank:</span>
            <span>${receiptData.payment.bankName}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Received By:</span>
            <span>${receiptData.payment.receivedBy}</span>
          </div>
        </div>

        <div class="footer">
          <div class="signature">
            <div>____________________</div>
            <div>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}