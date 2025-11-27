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
  
  const downloadPDF = (invoice) => {
    // Generate PDF download
    const printContent = `
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <h1>Invoice ${invoice.invoice_number}</h1>
          <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${invoice.customer_name}</p>
          ${invoice.customer_gstin ? `<p><strong>GSTIN:</strong> ${invoice.customer_gstin}</p>` : ''}
          ${invoice.customer_address ? `<p><strong>Address:</strong> ${invoice.customer_address}</p>` : ''}
          
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.product_name}</td>
                  <td>${item.qty} ${item.uom}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.final_amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p class="total">Grand Total: ₹${invoice.grand_total.toFixed(2)}</p>
          <p><strong>Payment Status:</strong> ${invoice.payment_status}</p>
          ${invoice.payment_method ? `<p><strong>Payment Method:</strong> ${invoice.payment_method}</p>` : ''}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
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
