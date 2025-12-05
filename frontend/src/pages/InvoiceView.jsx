import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Printer, ArrowLeft, DollarSign } from 'lucide-react';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchInvoice();
    fetchBusiness();
  }, [id]);
  
  const fetchInvoice = async () => {
    try {
      const res = await axios.get(`${API}/invoices/${id}`);
      setInvoice(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      setLoading(false);
    }
  };
  
  const fetchBusiness = async () => {
    try {
      const res = await axios.get(`${API}/business`);
      setBusiness(res.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handlePaymentUpdate = async (status, method) => {
    try {
      await axios.put(`${API}/invoices/${id}/payment?payment_status=${status}${method ? `&payment_method=${method}` : ''}`);
      toast.success('Payment status updated');
      fetchInvoice();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading invoice...</p>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600">Invoice not found</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="invoice-view-page">
      {/* Action Bar */}
      <div className="no-print flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/invoices')} data-testid="back-btn">
          <ArrowLeft size={18} className="mr-2" />
          Back to Invoices
        </Button>
        <div className="flex gap-3">
          <Button onClick={handlePrint} data-testid="print-btn">
            <Printer size={18} className="mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>
      
      {/* Payment Status Update */}
      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <DollarSign className="text-blue-600" size={24} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Payment Status</p>
              <p className="text-xs text-slate-500">Update payment status and method</p>
            </div>
            <Select value={invoice.payment_status} onValueChange={(value) => handlePaymentUpdate(value, invoice.payment_method)}>
              <SelectTrigger className="w-40" data-testid="update-payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Invoice */}
      <Card className="print-area">
        <CardContent className="p-8">
          {/* Header with Logo */}
          <div className="mb-8 pb-6 border-b-2 border-slate-300">
            {/* Logo - Center Top */}
            {business?.logo && (
              <div className="flex justify-center mb-6">
                <img 
                  src={business.logo} 
                  alt="Company Logo" 
                  style={{ width: '1.5in', height: '1.5in', objectFit: 'contain' }}
                  className="border border-slate-200 rounded p-1"
                />
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                {business ? (
                  <>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">{business.legal_name}</h1>
                    {business.gstin && <p className="text-sm text-slate-600">GSTIN: {business.gstin}</p>}
                    {business.address_1 && (
                      <div className="text-sm text-slate-600 mt-2">
                        <p>{business.address_1}</p>
                        <p>
                          {[business.city, business.state, business.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {business.phone_1 && <p className="text-sm text-slate-600 mt-1">Phone: {business.phone_1}</p>}
                    {business.email_1 && <p className="text-sm text-slate-600">Email: {business.email_1}</p>}
                  </>
                ) : (
                  <h1 className="text-3xl font-bold text-slate-800">Invoice</h1>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-bold text-blue-600 mb-2">INVOICE</h2>
                <p className="text-lg font-semibold text-slate-800">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-600">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {/* Bill To */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Bill To</p>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{invoice.customer_name}</h3>
            {invoice.customer_gstin && <p className="text-sm text-slate-600">GSTIN: {invoice.customer_gstin}</p>}
            {invoice.customer_address && <p className="text-sm text-slate-600">{invoice.customer_address}</p>}
            {invoice.customer_phone && <p className="text-sm text-slate-600">Phone: {invoice.customer_phone}</p>}
          </div>
          
          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">Item</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">HSN</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700">QTY</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Rate (excl. GST)</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Discount</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Tax</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  // Calculate rate excluding GST
                  // taxable_amount = rate * qty - discount
                  const rateExclGST = (item.taxable_amount / item.qty).toFixed(2);
                  
                  return (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-3 px-2 text-sm text-slate-800">
                        <p className="font-medium">{item.product_name}</p>
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </td>
                      <td className="py-3 px-2 text-sm text-slate-600">{item.hsn || '-'}</td>
                      <td className="py-3 px-2 text-sm text-slate-600 text-center">{item.qty} {item.uom}</td>
                      <td className="py-3 px-2 text-sm text-slate-600 text-right">₹{rateExclGST}</td>
                      <td className="py-3 px-2 text-sm text-slate-600 text-right">₹{item.discount_amount.toFixed(2)}</td>
                      <td className="py-3 px-2 text-sm text-slate-600 text-right">
                        {item.igst_percent > 0 ? (
                          <span>IGST {item.igst_percent}%</span>
                        ) : (
                          <span>CGST {item.cgst_percent}% + SGST {item.sgst_percent}%</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold text-slate-800 text-right">₹{item.final_amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm text-slate-700">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.total_discount > 0 && (
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{invoice.total_discount.toFixed(2)}</span>
                </div>
              )}
              {invoice.total_cgst > 0 && (
                <div className="flex justify-between text-sm text-slate-700">
                  <span>CGST:</span>
                  <span className="font-semibold">₹{invoice.total_cgst.toFixed(2)}</span>
                </div>
              )}
              {invoice.total_sgst > 0 && (
                <div className="flex justify-between text-sm text-slate-700">
                  <span>SGST:</span>
                  <span className="font-semibold">₹{invoice.total_sgst.toFixed(2)}</span>
                </div>
              )}
              {invoice.total_igst > 0 && (
                <div className="flex justify-between text-sm text-slate-700">
                  <span>IGST:</span>
                  <span className="font-semibold">₹{invoice.total_igst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-800 pt-3 border-t-2 border-slate-300">
                <span>Grand Total:</span>
                <span className="text-blue-600" data-testid="invoice-grand-total">₹{invoice.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Info */}
          <div className="mt-8 pt-6 border-t border-slate-300">
            <div className="flex justify-between items-center">
              <div>
                {invoice.payment_method && (
                  <p className="text-sm text-slate-600">Payment Method: <span className="font-semibold">{invoice.payment_method.toUpperCase()}</span></p>
                )}
                <p className="text-sm text-slate-600">Payment Status: 
                  <span className={`ml-2 font-semibold ${
                    invoice.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {invoice.payment_status.toUpperCase()}
                  </span>
                </p>
              </div>
              {invoice.notes && (
                <div className="text-right max-w-md">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">Thank you for your business!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceView;
