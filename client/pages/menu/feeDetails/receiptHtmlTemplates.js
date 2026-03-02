import { schoolDetails } from "@/schoolDetails"

export const generateReceiptHTML = (receiptData) => {
  // Get metadata which contains the breakdown
  const metadata = receiptData.payment?.metadata || {}
  
  // THIS TRANSACTION PAID AMOUNTS - from metadata.paid
  const paidInThisTransaction = {
    school: metadata.paid?.school || 0,
    transport: metadata.paid?.transport || 0,
    hostel: metadata.paid?.hostel || 0,
    total: metadata.paid?.total || receiptData.payment?.totalAmount || 0
  }
  
  // REMAINING AMOUNTS AFTER THIS PAYMENT - from metadata.remaining (COMBINED total)
  const remainingAfterPayment = {
    school: metadata.remaining?.school || 0,
    transport: metadata.remaining?.transport || 0,
    hostel: metadata.remaining?.hostel || 0,
    total: metadata.remaining?.total || 0
  }
  
  // Check if transport or hostel fees exist
  const hasTransportFee = paidInThisTransaction.transport > 0 || remainingAfterPayment.transport > 0
  const hasHostelFee = paidInThisTransaction.hostel > 0 || remainingAfterPayment.hostel > 0

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
          color: #333;
          font-size: 14px;
        }
        .student-name-value {
          color: #000;
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
          color: #333;
          font-size: 12px;
        }
        .info-value {
          color: #000;
          font-size: 12px;
          font-weight: 500;
        }
        .transaction-header {
          background: #1d9bf0;
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 20px;
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
        .breakdown-container {
          display: flex;
          flex-direction: row;
          gap: 15px;
          margin-bottom: 20px;
        }
        .paid-column {
          flex: 1;
          background: #f0fff0;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #28a745;
        }
        .due-column {
          flex: 1;
          background: #fff0f0;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #dc3545;
        }
        .column-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(0,0,0,0.1);
        }
        .paid-title {
          color: #28a745;
        }
        .due-title {
          color: #dc3545;
        }
        .fee-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .fee-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        .fee-amount {
          font-size: 16px;
          font-weight: bold;
        }
        .paid-amount {
          color: #28a745;
        }
        .due-amount {
          color: #dc3545;
        }
        .total-row {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          font-size: 16px;
          font-weight: bold;
          color: #000;
        }
        .total-value {
          font-size: 20px;
          font-weight: bold;
        }
        .paid-total-value {
          color: #28a745;
        }
        .due-total-value {
          color: #dc3545;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 12px 15px;
          border-radius: 8px;
          margin: 15px 0;
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #333;
          justify-content: center;
          flex-wrap: wrap;
          border: 1px solid #e0e0e0;
        }
        .transaction-item {
          background: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
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
          color: #333;
        }
        .received-by strong {
          color: #000;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          width: 180px;
          border-bottom: 2px solid #333;
          margin-bottom: 4px;
        }
        .signature-text {
          font-size: 11px;
          color: #666;
          font-weight: 500;
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
          <div class="school-name">${schoolDetails.name}</div>
          <div class="school-address">${schoolDetails.address}</div>
          <div class="school-contact">${schoolDetails.phone} | ${schoolDetails.email} | ${schoolDetails.website}</div>
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
        
        <!-- Two Column Layout - Paid and Due Side by Side -->
        <div class="breakdown-container">
          <!-- PAID COLUMN -->
          <div class="paid-column">
            <div class="column-title paid-title">✓ PAID</div>
            
            ${paidInThisTransaction.school > 0 ? `
            <div class="fee-row">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.school.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasTransportFee && paidInThisTransaction.transport > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.transport.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasHostelFee && paidInThisTransaction.hostel > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.hostel.toLocaleString()}</span>
            </div>` : ''}
            
            <div class="total-row">
              <span class="total-label">TOTAL PAID</span>
              <span class="total-value paid-total-value">₹${paidInThisTransaction.total.toLocaleString()}</span>
            </div>
          </div>
          
          <!-- DUE COLUMN -->
          <div class="due-column">
            <div class="column-title due-title">⚠ DUE</div>
            
            ${remainingAfterPayment.school > 0 ? `
            <div class="fee-row">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.school.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasTransportFee && remainingAfterPayment.transport > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.transport.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasHostelFee && remainingAfterPayment.hostel > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.hostel.toLocaleString()}</span>
            </div>` : ''}
            
            <div class="total-row">
              <span class="total-label">TOTAL DUE</span>
              <span class="total-value due-total-value">₹${remainingAfterPayment.total.toLocaleString()}</span>
            </div>
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

        ${receiptData.payment.description ? `
        <div style="margin: 10px 0; font-size: 12px; color: #333; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border: 1px solid #e0e0e0;">
          <strong style="color: #000;">Note:</strong> ${receiptData.payment.description}
        </div>` : ''}

        <!-- Years Fully Paid Notification -->
        ${metadata.yearsFullyPaid?.length > 0 ? `
        <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; font-weight: 500; border: 1px solid #c3e6cb;">
          <strong>✓ Fully Cleared:</strong> ${metadata.yearsFullyPaid.join(', ')}
        </div>` : ''}

        ${metadata.wasFullyPaid ? `
        <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; font-weight: 500; border: 1px solid #c3e6cb;">
          <strong>✓ Fully Cleared:</strong> ${metadata.academicYear}
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
      <div class="watermark">${schoolDetails.name} - Official Receipt</div>
    </body>
    </html>
  `
}

export const generatePrintHTML = (receiptData) => {
  // Get metadata which contains the breakdown
  const metadata = receiptData.payment?.metadata || {}
  
  // THIS TRANSACTION PAID AMOUNTS - from metadata.paid
  const paidInThisTransaction = {
    school: metadata.paid?.school || 0,
    transport: metadata.paid?.transport || 0,
    hostel: metadata.paid?.hostel || 0,
    total: metadata.paid?.total || receiptData.payment?.totalAmount || 0
  }
  
  // REMAINING AMOUNTS AFTER THIS PAYMENT - from metadata.remaining (COMBINED total)
  const remainingAfterPayment = {
    school: metadata.remaining?.school || 0,
    transport: metadata.remaining?.transport || 0,
    hostel: metadata.remaining?.hostel || 0,
    total: metadata.remaining?.total || 0
  }
  
  // Check if transport or hostel fees exist
  const hasTransportFee = paidInThisTransaction.transport > 0 || remainingAfterPayment.transport > 0
  const hasHostelFee = paidInThisTransaction.hostel > 0 || remainingAfterPayment.hostel > 0

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
          color: #333;
          font-size: 14px;
        }
        .student-name-value {
          color: #000;
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
          color: #333;
          font-size: 12px;
        }
        .info-value {
          color: #000;
          font-size: 12px;
          font-weight: 500;
        }
        .transaction-header {
          background: #000;
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 20px;
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
        .breakdown-container {
          display: flex;
          flex-direction: row;
          gap: 15px;
          margin-bottom: 20px;
        }
        .paid-column {
          flex: 1;
          background: #f0fff0;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #28a745;
        }
        .due-column {
          flex: 1;
          background: #fff0f0;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #dc3545;
        }
        .column-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(0,0,0,0.1);
        }
        .paid-title {
          color: #28a745;
        }
        .due-title {
          color: #dc3545;
        }
        .fee-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .fee-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        .fee-amount {
          font-size: 16px;
          font-weight: bold;
        }
        .paid-amount {
          color: #28a745;
        }
        .due-amount {
          color: #dc3545;
        }
        .total-row {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          font-size: 16px;
          font-weight: bold;
          color: #000;
        }
        .total-value {
          font-size: 20px;
          font-weight: bold;
        }
        .paid-total-value {
          color: #28a745;
        }
        .due-total-value {
          color: #dc3545;
        }
        .transaction-info {
          background: #f9f9f9;
          padding: 12px 15px;
          border-radius: 8px;
          margin: 15px 0;
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #333;
          justify-content: center;
          flex-wrap: wrap;
          border: 1px solid #e0e0e0;
        }
        .transaction-item {
          background: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
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
          color: #333;
        }
        .received-by strong {
          color: #000;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          width: 180px;
          border-bottom: 2px solid #333;
          margin-bottom: 4px;
        }
        .signature-text {
          font-size: 11px;
          color: #666;
          font-weight: 500;
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
          <div class="school-name">${schoolDetails.name}</div>
          <div class="school-address">${schoolDetails.address}</div>
          <div class="school-contact">${schoolDetails.phone} | ${schoolDetails.email}</div>
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
        
        <!-- Two Column Layout - Paid and Due Side by Side -->
        <div class="breakdown-container">
          <!-- PAID COLUMN -->
          <div class="paid-column">
            <div class="column-title paid-title">✓ PAID</div>
            
            ${paidInThisTransaction.school > 0 ? `
            <div class="fee-row">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.school.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasTransportFee && paidInThisTransaction.transport > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.transport.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasHostelFee && paidInThisTransaction.hostel > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount paid-amount">₹${paidInThisTransaction.hostel.toLocaleString()}</span>
            </div>` : ''}
            
            <div class="total-row">
              <span class="total-label">TOTAL PAID</span>
              <span class="total-value paid-total-value">₹${paidInThisTransaction.total.toLocaleString()}</span>
            </div>
          </div>
          
          <!-- DUE COLUMN -->
          <div class="due-column">
            <div class="column-title due-title">⚠ DUE</div>
            
            ${remainingAfterPayment.school > 0 ? `
            <div class="fee-row">
              <span class="fee-label">School Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.school.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasTransportFee && remainingAfterPayment.transport > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Transport Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.transport.toLocaleString()}</span>
            </div>` : ''}
            
            ${hasHostelFee && remainingAfterPayment.hostel > 0 ? `
            <div class="fee-row">
              <span class="fee-label">Hostel Fee</span>
              <span class="fee-amount due-amount">₹${remainingAfterPayment.hostel.toLocaleString()}</span>
            </div>` : ''}
            
            <div class="total-row">
              <span class="total-label">TOTAL DUE</span>
              <span class="total-value due-total-value">₹${remainingAfterPayment.total.toLocaleString()}</span>
            </div>
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

        ${receiptData.payment.description ? `
        <div style="margin: 10px 0; font-size: 12px; color: #333; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border: 1px solid #e0e0e0;">
          <strong style="color: #000;">Note:</strong> ${receiptData.payment.description}
        </div>` : ''}

        <!-- Years Fully Paid Notification -->
        ${metadata.yearsFullyPaid?.length > 0 ? `
        <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; font-weight: 500; border: 1px solid #c3e6cb;">
          <strong>✓ Fully Cleared:</strong> ${metadata.yearsFullyPaid.join(', ')}
        </div>` : ''}

        ${metadata.wasFullyPaid ? `
        <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; font-weight: 500; border: 1px solid #c3e6cb;">
          <strong>✓ Fully Cleared:</strong> ${metadata.academicYear}
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
      <div class="watermark-print">${schoolDetails.name} - Official Receipt</div>
    </body>
    </html>
  `
}