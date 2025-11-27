import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Eye, Search, PlusCircle, Edit2, Trash2, Download, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      const res = await axios.get(`${API}/invoices?${params.toString()}`);
      setInvoices(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInvoices();
  }, [sortBy, sortOrder]);
  
  const handleSearch = () => {
    fetchInvoices();
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  const handleDelete = async (invoiceId, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? It will be moved to archives.`)) {
      try {
        await axios.delete(`${API}/invoices/${invoiceId}`);
        toast.success('Invoice moved to archives');
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      }
    }
  };
  
  const downloadPDF = async (invoice) => {
    try {
      // Fetch business details for the invoice header
      const businessRes = await axios.get(`${API}/business`);
      const business = businessRes.data;
      
      // Generate properly formatted invoice HTML matching InvoiceView format
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <meta charset="UTF-8">
            <style>
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 10mm; }
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #1e293b;
                padding: 32px;
                background: white;
              }
              .invoice-card {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 48px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 48px;
                padding-bottom: 32px;
                border-bottom: 2px solid #cbd5e1;
              }
              .business-info h1 {
                font-size: 28px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 4px;
              }
              .business-info p {
                font-size: 14px;
                color: #475569;
                line-height: 1.6;
              }
              .invoice-info {
                text-align: right;
              }
              .invoice-info h2 {
                font-size: 36px;
                font-weight: 700;
                color: #2563eb;
                margin-bottom: 8px;
              }
              .invoice-info .invoice-number {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
              }
              .invoice-info .invoice-date {
                font-size: 14px;
                color: #475569;
              }
              .bill-to {
                margin-bottom: 48px;
              }
              .bill-to .label {
                font-size: 12px;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
              }
              .bill-to h3 {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 4px;
              }
              .bill-to p {
                font-size: 14px;
                color: #475569;
                line-height: 1.6;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 48px;
              }
              thead tr {
                border-bottom: 2px solid #cbd5e1;
              }
              th {
                padding: 12px 8px;
                font-size: 14px;
                font-weight: 600;
                color: #475569;
                text-align: left;
              }
              th.right { text-align: right; }
              th.center { text-align: center; }
              tbody tr {
                border-bottom: 1px solid #e2e8f0;
              }
              td {
                padding: 12px 8px;
                font-size: 14px;
                color: #1e293b;
              }
              td.right { text-align: right; }
              td.center { text-align: center; }
              .item-name {
                font-weight: 500;
              }
              .item-description {
                font-size: 12px;
                color: #64748b;
                margin-top: 2px;
              }
              .totals {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 48px;
              }
              .totals-table {
                width: 320px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
                color: #475569;
              }
              .total-row.grand {
                padding-top: 16px;
                border-top: 2px solid #cbd5e1;
                font-size: 18px;
                font-weight: 700;
                color: #1e293b;
              }
              .total-row.grand .amount {
                color: #2563eb;
              }
              .payment-info {
                margin-top: 48px;
                padding-top: 32px;
                border-top: 1px solid #cbd5e1;
                display: flex;
                justify-content: space-between;
              }
              .payment-info p {
                font-size: 14px;
                color: #475569;
                margin-bottom: 4px;
              }
              .payment-info .status {
                font-weight: 600;
                text-transform: uppercase;
              }
              .payment-info .status.paid { color: #16a34a; }
              .payment-info .status.unpaid { color: #ea580c; }
              .payment-info .status.partial { color: #eab308; }
              .notes {
                text-align: right;
                max-width: 400px;
              }
              .notes .label {
                font-size: 12px;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 4px;
              }
              .footer {
                margin-top: 64px;
                padding-top: 32px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
              }
              .footer p {
                font-size: 12px;
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="invoice-card">
              <!-- Header -->
              <div class="header">
                <div class="business-info">
                  ${business ? `
                    <h1>${business.legal_name}</h1>
                    ${business.nickname ? `<p>${business.nickname}</p>` : ''}
                    ${business.gstin ? `<p>GSTIN: ${business.gstin}</p>` : ''}
                    ${business.state ? `<p>State: ${business.state} (${business.state_code})</p>` : ''}
                    ${business.address_1 ? `<p style="margin-top: 8px;">${business.address_1}</p>` : ''}
                    ${business.phone_1 ? `<p>Phone: ${business.phone_1}</p>` : ''}
                    ${business.email_1 ? `<p>Email: ${business.email_1}</p>` : ''}
                  ` : '<h1>Invoice</h1>'}
                </div>
                <div class="invoice-info">
                  <h2>INVOICE</h2>
                  <p class="invoice-number">${invoice.invoice_number}</p>
                  <p class="invoice-date">Date: ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <!-- Bill To -->
              <div class="bill-to">
                <p class="label">Bill To</p>
                <h3>${invoice.customer_name}</h3>
                ${invoice.customer_gstin ? `<p>GSTIN: ${invoice.customer_gstin}</p>` : ''}
                ${invoice.customer_address ? `<p>${invoice.customer_address}</p>` : ''}
                ${invoice.customer_phone ? `<p>Phone: ${invoice.customer_phone}</p>` : ''}
              </div>
              
              <!-- Items Table -->
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>HSN</th>
                    <th class="center">QTY</th>
                    <th class="right">Rate</th>
                    <th class="right">Discount</th>
                    <th class="right">Tax</th>
                    <th class="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td>
                        <div class="item-name">${item.product_name}</div>
                        ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                      </td>
                      <td>${item.hsn || '-'}</td>
                      <td class="center">${item.qty} ${item.uom}</td>
                      <td class="right">₹${item.rate.toFixed(2)}</td>
                      <td class="right">₹${item.discount_amount.toFixed(2)}</td>
                      <td class="right">
                        ${item.igst_percent > 0 
                          ? `IGST ${item.igst_percent}%` 
                          : `CGST ${item.cgst_percent}% + SGST ${item.sgst_percent}%`
                        }
                      </td>
                      <td class="right"><strong>₹${item.final_amount.toFixed(2)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <!-- Totals -->
              <div class="totals">
                <div class="totals-table">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span><strong>₹${invoice.subtotal.toFixed(2)}</strong></span>
                  </div>
                  ${invoice.total_discount > 0 ? `
                    <div class="total-row">
                      <span>Discount:</span>
                      <span><strong>-₹${invoice.total_discount.toFixed(2)}</strong></span>
                    </div>
                  ` : ''}
                  ${invoice.total_cgst > 0 ? `
                    <div class="total-row">
                      <span>CGST:</span>
                      <span><strong>₹${invoice.total_cgst.toFixed(2)}</strong></span>
                    </div>
                  ` : ''}
                  ${invoice.total_sgst > 0 ? `
                    <div class="total-row">
                      <span>SGST:</span>
                      <span><strong>₹${invoice.total_sgst.toFixed(2)}</strong></span>
                    </div>
                  ` : ''}
                  ${invoice.total_igst > 0 ? `
                    <div class="total-row">
                      <span>IGST:</span>
                      <span><strong>₹${invoice.total_igst.toFixed(2)}</strong></span>
                    </div>
                  ` : ''}
                  <div class="total-row grand">
                    <span>Grand Total:</span>
                    <span class="amount">₹${invoice.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <!-- Payment Info -->
              <div class="payment-info">
                <div>
                  ${invoice.payment_method ? `<p>Payment Method: <strong>${invoice.payment_method.toUpperCase()}</strong></p>` : ''}
                  ${invoice.transaction_reference ? `<p>Reference: <strong>${invoice.transaction_reference}</strong></p>` : ''}
                  <p>Payment Status: <span class="status ${invoice.payment_status}">${invoice.payment_status.toUpperCase()}</span></p>
                  ${invoice.payment_status === 'partial' && invoice.balance_due > 0 ? `
                    <p>Paid Amount: <strong>₹${invoice.paid_amount.toFixed(2)}</strong></p>
                    <p style="color: #ea580c;">Balance Due: <strong>₹${invoice.balance_due.toFixed(2)}</strong></p>
                  ` : ''}
                </div>
                ${invoice.notes ? `
                  <div class="notes">
                    <p class="label">Notes</p>
                    <p>${invoice.notes}</p>
                  </div>
                ` : ''}
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p>Thank you for your business!</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const getStatusBadge = (status) => {
    const statusMap = {
      'fully_paid': { bg: 'bg-green-100', text: 'text-green-700', label: 'Fully Paid' },
      'partial': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
      'unpaid': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Unpaid' }
    };
    const config = statusMap[status] || statusMap['unpaid'];
    return (
      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading invoices...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="invoice-list-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Invoices</h1>
          <p className="text-slate-600">View and manage all your invoices</p>
        </div>
        <Button 
          onClick={() => navigate('/create-invoice')}
          data-testid="create-invoice-btn"
          size="lg"
        >
          <PlusCircle size={20} className="mr-2" />
          Create Invoice
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by invoice number or customer name..."
                className="pl-10"
                data-testid="search-invoice-input"
              />
            </div>
            <Button onClick={handleSearch} data-testid="search-btn">
              Search
            </Button>
          </div>
          
          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          {(startDate || endDate) && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTimeout(fetchInvoices, 100);
                }}
              >
                Clear Dates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => handleSort('invoice_number')}
                    >
                      <div className="flex items-center gap-2">
                        Invoice #
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => handleSort('invoice_date')}
                    >
                      <div className="flex items-center gap-2">
                        Invoice Date
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => handleSort('customer_name')}
                    >
                      <div className="flex items-center gap-2">
                        Customer
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => handleSort('grand_total')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Bill Amount
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{invoice.customer_name}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-slate-800">
                        ₹{invoice.grand_total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(invoice.payment_status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            title="View"
                            className="h-8 w-8"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                            title="Edit"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadPDF(invoice)}
                            title="Download PDF"
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                            title="Delete"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceList;
