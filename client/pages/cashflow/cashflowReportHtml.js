// cashflowReportHtml.js
export const schoolInfo = {
  name: 'BLURI (E.M) HIGH SCHOOL',
  address: 'Gavaravaram',
  phone: '+91 7382181235',
  email: 'info@bluri.edu.in',
  website: 'www.bluri.edu.in'
}

export const generateCashflowReportHTML = (data) => {
  const {
    records,
    summary,
    filters,
    dateRange,
    generatedAt,
    schoolInfo
  } = data

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (date) => {
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

  // Determine which columns to show based on data
  const hasItems = records.some(r => r.item?.name && r.item.name !== 'Unknown')
  const hasDescriptions = records.some(r => r.description && r.description.trim() !== '')
  const hasPaymentMethods = records.some(r => r.paymentMethod && r.paymentMethod !== 'CASH')

  // Calculate column widths
  const getColumnWidths = () => {
    let totalColumns = 6 // S.No, Date, Type, Category, Person, Amount
    if (hasItems) totalColumns += 1
    if (hasDescriptions) totalColumns += 1
    if (hasPaymentMethods) totalColumns += 1

    return {
      sno: '5%',
      date: '10%',
      type: '10%',
      category: '12%',
      item: hasItems ? '12%' : '0%',
      person: '12%',
      description: hasDescriptions ? '15%' : '0%',
      paymentMethod: hasPaymentMethods ? '10%' : '0%',
      amount: '12%'
    }
  }

  const colWidths = getColumnWidths()

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cashflow Report - ${dateRange}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          .report-container {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          /* School Header */
          .school-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #5053ee;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #5053ee;
            margin: 0 0 5px 0;
          }
          .school-details {
            font-size: 12px;
            color: #666;
            margin: 2px 0;
          }
          
          /* Report Title */
          .report-title {
            text-align: center;
            margin-bottom: 20px;
          }
          .report-title h1 {
            font-size: 20px;
            color: #333;
            margin: 0 0 10px 0;
          }
          
          /* Filter Info */
          .filter-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            border-left: 4px solid #5053ee;
          }
          .filter-item {
            color: #555;
          }
          .filter-item strong {
            color: #333;
          }
          
          /* Summary Cards */
          .summary-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #5053ee;
          }
          .summary-value.income {
            color: #10b981;
          }
          .summary-value.expense {
            color: #ef4444;
          }
          
          /* Table Styles */
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
            table-layout: fixed;
            border: 2px solid #5053ee;
          }
          .transactions-table th {
            background: #5053ee;
            color: white;
            font-weight: 600;
            padding: 12px 6px;
            text-align: center;
            font-size: 12px;
            border: 1px solid #7346e5;
          }
          .transactions-table td {
            padding: 10px 6px;
            border: 1px solid #d1d5db;
            vertical-align: middle;
            word-wrap: break-word;
          }
          .transactions-table tbody tr:hover {
            background: #f9fafb;
          }
          
          /* Row styling based on type */
          .income-row {
            background-color: #f0fdf4;
          }
          .expense-row {
            background-color: #fef2f2;
          }
          
          /* Amount styling */
          .amount-income {
            color: #10b981;
            font-weight: bold;
            text-align: center;
          }
          .amount-expense {
            color: #ef4444;
            font-weight: bold;
            text-align: center;
          }
          
          /* Text alignment */
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          
          /* Type badge */
          .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .type-income {
            background: #d4edda;
            color: #155724;
          }
          .type-expense {
            background: #f8d7da;
            color: #721c24;
          }
          
          /* Table Footer */
          .transactions-table tfoot tr {
            background: #f3f4f6;
            font-weight: bold;
            border-top: 2px solid #5053ee;
          }
          .transactions-table tfoot td {
            padding: 12px 6px;
            background: #f3f4f6;
          }
          
          /* Summary totals */
          .income-total {
            color: #10b981;
            font-weight: bold;
          }
          .expense-total {
            color: #ef4444;
            font-weight: bold;
          }
          .net-total {
            color: #5053ee;
            font-weight: bold;
            font-size: 14px;
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
            .transactions-table th { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              background: #5053ee !important;
              color: white !important;
            }
            .transactions-table td {
              border: 1px solid #000 !important;
            }
            .income-row {
              background-color: #f0fdf4 !important;
            }
            .expense-row {
              background-color: #fef2f2 !important;
            }
          }

          /* Responsive */
          @media screen and (max-width: 768px) {
            .transactions-table {
              font-size: 11px;
            }
            .transactions-table th,
            .transactions-table td {
              padding: 8px 4px;
            }
            .summary-container {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- School Header -->
          <div class="school-header">
            <h1 class="school-name">${schoolInfo.name}</h1>
            <div class="school-details">${schoolInfo.address} | ${schoolInfo.phone} | ${schoolInfo.email} | ${schoolInfo.website}</div>
          </div>

          <!-- Report Title -->
          <div class="report-title">
            <h1>Cashflow Transaction Report</h1>
          </div>

          <!-- Filter Information -->
          <div class="filter-info">
            <span class="filter-item"><strong>Date Range:</strong> ${dateRange}</span>
            <span class="filter-item"><strong>Period:</strong> ${filters.startDate ? formatDate(filters.startDate) : 'N/A'} to ${filters.endDate ? formatDate(filters.endDate) : 'N/A'}</span>
            <span class="filter-item"><strong>Type:</strong> ${filters.type}</span>
            <span class="filter-item"><strong>Category:</strong> ${filters.category}</span>
            <span class="filter-item"><strong>Item:</strong> ${filters.item}</span>
            <span class="filter-item"><strong>Generated:</strong> ${formatDateTime(generatedAt)}</span>
          </div>

          <!-- Summary Cards -->
          <div class="summary-container">
            <div class="summary-card">
              <div class="summary-label">Total Income</div>
              <div class="summary-value income">${formatCurrency(summary.totalIncome)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Expense</div>
              <div class="summary-value expense">${formatCurrency(summary.totalExpense)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Net Balance</div>
              <div class="summary-value" style="color: ${summary.netBalance >= 0 ? '#10b981' : '#ef4444'}">
                ${formatCurrency(summary.netBalance)}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Transactions</div>
              <div class="summary-value">${summary.count}</div>
            </div>
          </div>

          <!-- Transactions Table -->
          <table class="transactions-table">
            <thead>
              <tr>
                <th style="width: ${colWidths.sno}">S.No</th>
                <th style="width: ${colWidths.date}">Date</th>
                <th style="width: ${colWidths.type}">Type</th>
                <th style="width: ${colWidths.category}">Category</th>
                ${hasItems ? `<th style="width: ${colWidths.item}">Item</th>` : ''}
                <th style="width: ${colWidths.person}">Person</th>
                ${hasDescriptions ? `<th style="width: ${colWidths.description}">Description</th>` : ''}
                ${hasPaymentMethods ? `<th style="width: ${colWidths.paymentMethod}">Payment</th>` : ''}
                <th style="width: ${colWidths.amount}">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((record, index) => {
                const isIncome = record.type === 'Income'
                return `
                  <tr class="${isIncome ? 'income-row' : 'expense-row'}">
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">${formatDate(record.date)}</td>
                    <td class="text-center">
                      <span class="type-badge ${isIncome ? 'type-income' : 'type-expense'}">
                        ${record.type}
                      </span>
                    </td>
                    <td class="text-left">${record.category?.name || 'N/A'}</td>
                    ${hasItems ? `<td class="text-left">${record.item?.name || 'N/A'}</td>` : ''}
                    <td class="text-left">${record.person || 'N/A'}</td>
                    ${hasDescriptions ? `<td class="text-left">${record.description || '-'}</td>` : ''}
                    ${hasPaymentMethods ? `<td class="text-center">${record.paymentMethod?.replace('_', ' ') || 'CASH'}</td>` : ''}
                    <td class="${isIncome ? 'amount-income' : 'amount-expense'}">
                      ${isIncome ? '+' : '-'}${record.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="${1}" class="text-right"><strong>Total</strong></td>
                <td></td>
                <td></td>
                <td></td>
                ${hasItems ? '<td></td>' : ''}
                <td></td>
                ${hasDescriptions ? '<td></td>' : ''}
                ${hasPaymentMethods ? '<td></td>' : ''}
                <td class="text-center">
                  <span class="income-total">+${formatCurrency(summary.totalIncome)}</span><br>
                  <span class="expense-total">-${formatCurrency(summary.totalExpense)}</span><br>
                  <span class="net-total">Net: ${formatCurrency(summary.netBalance)}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Summary Row -->
          <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 14px; font-weight: bold; color: #333;">Report Summary</span>
              </div>
              <div style="display: flex; gap: 30px;">
                <div>
                  <span style="font-size: 12px; color: #666;">Income Transactions:</span>
                  <span style="font-size: 14px; font-weight: bold; color: #10b981; margin-left: 8px;">${summary.incomeCount}</span>
                </div>
                <div>
                  <span style="font-size: 12px; color: #666;">Expense Transactions:</span>
                  <span style="font-size: 14px; font-weight: bold; color: #ef4444; margin-left: 8px;">${summary.expenseCount}</span>
                </div>
                <div>
                  <span style="font-size: 12px; color: #666;">Average Transaction:</span>
                  <span style="font-size: 14px; font-weight: bold; color: #5053ee; margin-left: 8px;">${formatCurrency(summary.avg)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            This is a computer generated report - Valid without signature<br>
            Total Records: ${records.length} | Generated on ${formatDateTime(generatedAt)}
          </div>
        </div>
      </body>
    </html>
  `
}