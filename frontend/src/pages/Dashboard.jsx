import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  RefreshCw, 
  Calendar,
  AlertCircle,
  User,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_sales: 0,
    total_pending_dues: 0,
    top_5_dues: [],
    invoice_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];
    
    switch(dateFilter) {
      case 'today':
        startDate = endDate;
        break;
      case '7days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        startDate = last7Days.toISOString().split('T')[0];
        break;
      case '30days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        startDate = last30Days.toISOString().split('T')[0];
        break;
      case 'quarterly':
        const last3Months = new Date(today);
        last3Months.setMonth(today.getMonth() - 3);
        startDate = last3Months.toISOString().split('T')[0];
        break;
      case 'halfyearly':
        const last6Months = new Date(today);
        last6Months.setMonth(today.getMonth() - 6);
        startDate = last6Months.toISOString().split('T')[0];
        break;
      case 'yearly':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        startDate = lastYear.toISOString().split('T')[0];
        break;
      case 'fy':
        // Indian FY: April to March
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();
        
        if (currentMonth >= 3) { // April (3) to December (11)
          startDate = `${currentYear}-04-01`;
        } else { // January (0) to March (2)
          startDate = `${currentYear - 1}-04-01`;
        }
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        startDate = endDate;
    }
    
    return { startDate, endDate };
  };
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const response = await axios.get(`${API}/dashboard/stats`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    fetchDashboardStats();
    toast.success('Dashboard refreshed');
  };
  
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
  };
  
  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    fetchDashboardStats();
  };
  
  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchDashboardStats();
    }
  }, [dateFilter]);
  
  const getFilterLabel = () => {
    const labels = {
      'today': 'Today',
      '7days': 'Last 7 Days',
      '30days': 'Last 30 Days',
      'quarterly': 'Quarterly (Last 3 Months)',
      'halfyearly': 'Half Yearly (Last 6 Months)',
      'yearly': 'Yearly (Last 12 Months)',
      'fy': 'Financial Year (Apr-Mar)',
      'custom': 'Custom Date Range'
    };
    return labels[dateFilter] || 'Today';
  };
  
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Dashboard</h1>
          <p className="text-slate-600">Overview of your sales and pending dues</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Date Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar size={20} />
            Date Filter: <span className="text-blue-600">{getFilterLabel()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="quarterly">Quarterly (Last 3 Months)</SelectItem>
                  <SelectItem value="halfyearly">Half Yearly (Last 6 Months)</SelectItem>
                  <SelectItem value="yearly">Yearly (Last 12 Months)</SelectItem>
                  <SelectItem value="fy">Financial Year (Apr-Mar)</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === 'custom' && (
              <>
                <div className="flex-1">
                  <Input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
                <Button onClick={handleApplyCustomDate}>
                  Apply
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Sales Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Sales</p>
                <p className="text-3xl font-bold text-slate-800">₹{stats.total_sales.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">{stats.invoice_count} invoices</p>
              </div>
              <div className="bg-green-100 text-green-600 p-4 rounded-xl">
                <Receipt size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Dues Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Pending Dues</p>
                <p className="text-3xl font-bold text-slate-800">₹{stats.total_pending_dues.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">From unpaid & partial payments</p>
              </div>
              <div className="bg-orange-100 text-orange-600 p-4 rounded-xl">
                <AlertCircle size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* TOP 5 Pending Dues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">TOP 5 Invoices by Pending Dues</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.top_5_dues.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No pending dues at the moment!</p>
              <p className="text-sm text-slate-400 mt-1">All invoices are paid 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.top_5_dues.map((invoice, index) => (
                <div 
                  key={invoice.invoice_id} 
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        <User size={16} />
                        {invoice.customer_name}
                      </p>
                      <p className="text-sm text-slate-600 font-medium">Invoice: {invoice.invoice_number}</p>
                      <p className="text-xs text-slate-500">
                        {invoice.payment_status === 'unpaid' ? 'Unpaid' : `Partial (Paid: ₹${invoice.paid_amount.toFixed(2)})`}
                        {' • '}
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">₹{invoice.due_amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Due Amount</p>
                    <p className="text-xs text-slate-400">Total: ₹{invoice.grand_total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">Dashboard Information</p>
              <p className="text-xs text-blue-700 mt-1">
                • Sales data is calculated based on invoice dates within the selected period<br />
                • Pending dues include both unpaid and partially paid invoices<br />
                • Use the refresh button to reload the latest data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
