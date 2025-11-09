import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Eye, Search, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  const fetchInvoices = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/invoices${search ? `?search=${search}` : ''}`);
      setInvoices(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchInvoices(searchTerm);
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
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Invoices</h1>
        <p className="text-slate-600">View and manage all your invoices</p>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
      
      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Items</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Payment</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
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
                      <td className="py-3 px-4 text-sm text-slate-600">{invoice.items.length} items</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-slate-800">
                        ₹{invoice.grand_total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          invoice.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : invoice.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          data-testid={`view-invoice-${invoice.invoice_number}`}
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
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
