import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        axios.get(`${API}/invoices?limit=5`),
        axios.get(`${API}/customers`)
      ]);
      
      const invoices = invoicesRes.data;
      const customers = customersRes.data;
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
      const pendingPayments = invoices.filter(inv => inv.payment_status === 'unpaid').reduce((sum, inv) => sum + inv.grand_total, 0);
      
      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalRevenue: totalRevenue,
        pendingPayments: pendingPayments
      });
      
      setRecentInvoices(invoices.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };
  
  const statCards = [
    { title: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Pending Payments', value: `₹${stats.pendingPayments.toFixed(2)}`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome to your billing dashboard</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-800" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No invoices yet. Create your first invoice!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{invoice.customer_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-slate-800">₹{invoice.grand_total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          invoice.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {invoice.payment_status}
                        </span>
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

export default Dashboard;
