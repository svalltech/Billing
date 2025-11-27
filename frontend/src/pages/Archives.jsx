import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Eye, RotateCcw, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Archives = () => {
  const navigate = useNavigate();
  const [deletedInvoices, setDeletedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDeletedInvoices();
  }, []);
  
  const fetchDeletedInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/invoices?include_deleted=true`);
      setDeletedInvoices(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching deleted invoices:', error);
      toast.error('Failed to load archived invoices');
      setLoading(false);
    }
  };
  
  const handleRestore = async (invoiceId, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to restore invoice ${invoiceNumber}?`)) {
      try {
        await axios.post(`${API}/invoices/${invoiceId}/restore`);
        toast.success('Invoice restored successfully');
        fetchDeletedInvoices();
      } catch (error) {
        console.error('Error restoring invoice:', error);
        toast.error('Failed to restore invoice');
      }
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
          <p className="mt-4 text-slate-600">Loading archives...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Archive size={36} className="text-slate-600" />
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Archives</h1>
          <p className="text-slate-600">View and restore deleted invoices</p>
        </div>
      </div>
      
      {/* Deleted Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Deleted Bills ({deletedInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {deletedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No deleted invoices found</p>
              <p className="text-slate-400 text-sm mt-2">Deleted invoices will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Customer</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Deleted On</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedInvoices.map((invoice) => (
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
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {invoice.deleted_at ? new Date(invoice.deleted_at).toLocaleDateString() : 'N/A'}
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
                            onClick={() => handleRestore(invoice.id, invoice.invoice_number)}
                            title="Restore"
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                          >
                            <RotateCcw size={16} />
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

export default Archives;
