import { supabase } from '../services/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { Alert } from 'react-native';

export type ReportParams = {
  operand: 'Client' | 'Supplier';
  partyId: string; // 'All' or specific id
  month: string; // 'All Time' or 'YYYY-MM'
  paymentDetailsMode: 'Separate column' | 'Comment' | 'None';
  selectedColumns: string[];
};

export async function fetchReportData(params: ReportParams) {
  const { operand, partyId, month } = params;

  // 1. Fetch Projects
  let projectsQuery = supabase.from('projects').select('*, client:clients(*)');
  const { data: projectsData, error: projErr } = await projectsQuery;
  if (projErr) throw projErr;
  
  let filteredProjects = projectsData || [];
  if (operand === 'Client' && partyId !== 'All') {
    filteredProjects = filteredProjects.filter(p => p.client_id === partyId);
  }

  const projectIds = filteredProjects.map(p => p.id);
  if (projectIds.length === 0) return []; // No projects found

  // 2. Fetch Products
  const productTable = operand === 'Client' ? 'client_products' : 'supplier_products';
  let productsQuery = supabase.from(productTable).select('*, supplier:suppliers(*)').in('project_id', projectIds);
  
  const { data: productsData, error: prodErr } = await productsQuery;
  if (prodErr) throw prodErr;
  
  let products = productsData || [];

  if (operand === 'Supplier' && partyId !== 'All') {
    products = products.filter(p => p.supplier_id === partyId);
  }

  // Filter by month
  if (month !== 'All Time') {
    products = products.filter(p => p.date.startsWith(month));
  }

  if (products.length === 0) return [];

  const productIds = products.map(p => p.id);

  // 3. Fetch Charges and Payments
  const chargesTable = operand === 'Client' ? 'client_product_charges' : 'supplier_product_charges';
  const paymentsTable = operand === 'Client' ? 'client_product_payments' : 'supplier_product_payments';
  const idCol = operand === 'Client' ? 'client_product_id' : 'supplier_product_id';

  const { data: chargesData, error: charErr } = await supabase.from(chargesTable).select('*').in(idCol, productIds);
  if (charErr) throw charErr;
  const charges = chargesData || [];

  const { data: paymentsData, error: payErr } = await supabase.from(paymentsTable).select('*').in(idCol, productIds);
  if (payErr) throw payErr;
  const payments = paymentsData || [];

  // 4. Assemble Data
  const rows: any[] = [];

  for (const product of products) {
    const project = filteredProjects.find(p => p.id === product.project_id);
    const prodCharges = charges.filter(c => c[idCol] === product.id);
    const prodPayments = payments.filter(p => p[idCol] === product.id);

    const baseTotal = Number(product.quantity) * Number(product.price);
    const chargesTotal = prodCharges.reduce((acc, curr) => {
      return curr.operation === 'add' ? acc + Number(curr.amount) : acc - Number(curr.amount);
    }, 0);
    const finalTotal = baseTotal + chargesTotal;
    const amountPaid = prodPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = finalTotal - amountPaid;

    const row = {
      id: product.id,
      Date: product.date,
      Party: operand === 'Client' ? project?.client?.name : product.supplier?.name,
      Project: project?.name,
      Product: product.name,
      Quantity: product.quantity,
      Price: product.price,
      Charges: chargesTotal,
      'Final Total': finalTotal,
      'Amount Paid': amountPaid,
      Balance: balance,
      Remarks: product.remarks || '',
      payments: prodPayments,
    };
    rows.push(row);
  }

  return rows;
}

export async function exportToExcel(params: ReportParams, data: any[]) {
  try {
    const wsData: any[] = [];
    const headers = [...params.selectedColumns];
    if (params.paymentDetailsMode === 'Separate column') {
      headers.push('Payment Date', 'Payment Mode', 'Payment Notes');
    }
    wsData.push(headers);

    for (const row of data) {
      if (params.paymentDetailsMode === 'Separate column') {
        if (row.payments && row.payments.length > 0) {
          row.payments.forEach((payment: any, index: number) => {
            const rowData: any[] = [];
            headers.forEach(col => {
              if (col === 'Payment Date') rowData.push(payment.date);
              else if (col === 'Payment Mode') rowData.push(payment.payment_mode);
              else if (col === 'Payment Notes') rowData.push(payment.notes || '');
              else rowData.push(index === 0 ? row[col] : ''); // Only show main data on first row
            });
            wsData.push(rowData);
          });
        } else {
          const rowData = headers.map(col => {
             if (['Payment Date', 'Payment Mode', 'Payment Notes'].includes(col)) return '';
             return row[col];
          });
          wsData.push(rowData);
        }
      } else {
        const rowData = params.selectedColumns.map(col => row[col as keyof typeof row]);
        wsData.push(rowData);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Handle Comment mode
    if (params.paymentDetailsMode === 'Comment') {
      const amountPaidIndex = params.selectedColumns.indexOf('Amount Paid');
      if (amountPaidIndex !== -1) {
        for (let r = 0; r < data.length; r++) {
          const row = data[r];
          if (row.payments && row.payments.length > 0) {
            const commentText = row.payments.map((p: any) => `${p.date} - ${p.payment_mode}: ${p.amount}`).join('\n');
            const cellAddress = XLSX.utils.encode_cell({ r: r + 1, c: amountPaidIndex }); // r+1 for header
            if (!ws[cellAddress]) ws[cellAddress] = { t: 'n', v: row['Amount Paid'] };
            ws[cellAddress].c = [{ a: 'System', t: commentText }] as any; // Ignore TS error for comment type
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + `Report_${Date.now()}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Sharing not available');
    }
  } catch (e: any) {
    Alert.alert('Error exporting Excel', e.message);
  }
}

export async function exportToPDF(params: ReportParams, data: any[]) {
  try {
    const headers = [...params.selectedColumns];
    if (params.paymentDetailsMode === 'Separate column') {
      headers.push('Payment Date', 'Payment Mode', 'Payment Notes');
    }

    let tableHtml = `
      <table border="1" style="width:100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr>
            ${headers.map(h => `<th style="padding: 4px;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (const row of data) {
      if (params.paymentDetailsMode === 'Separate column' && row.payments && row.payments.length > 0) {
        row.payments.forEach((payment: any, index: number) => {
          tableHtml += '<tr>';
          headers.forEach(col => {
            if (col === 'Payment Date') tableHtml += `<td style="padding: 4px;">${payment.date}</td>`;
            else if (col === 'Payment Mode') tableHtml += `<td style="padding: 4px;">${payment.payment_mode}</td>`;
            else if (col === 'Payment Notes') tableHtml += `<td style="padding: 4px;">${payment.notes || ''}</td>`;
            else tableHtml += `<td style="padding: 4px;">${index === 0 ? (row[col] ?? '') : ''}</td>`;
          });
          tableHtml += '</tr>';
        });
      } else {
        tableHtml += '<tr>';
        headers.forEach(col => {
           let val = row[col] ?? '';
           if (col === 'Amount Paid' && params.paymentDetailsMode === 'Comment' && row.payments?.length > 0) {
             const comments = row.payments.map((p: any) => `${p.date}-${p.payment_mode}: ${p.amount}`).join(', ');
             val += `<br/><small style="color: gray;">${comments}</small>`;
           }
           tableHtml += `<td style="padding: 4px;">${val}</td>`;
        });
        tableHtml += '</tr>';
      }
    }

    tableHtml += `
        </tbody>
      </table>
    `;

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        </head>
        <body style="font-family: sans-serif;">
          <h2 style="text-align: center;">${params.operand} Report</h2>
          <p>Party: ${params.partyId === 'All' ? 'All' : data[0]?.Party || 'Unknown'}</p>
          <p>Month: ${params.month}</p>
          ${tableHtml}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Sharing not available');
    }
  } catch (e: any) {
    Alert.alert('Error exporting PDF', e.message);
  }
}
