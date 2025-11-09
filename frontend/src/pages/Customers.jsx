import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserPlus, Search, Edit, Trash2, Download, Upload, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    gstin: '',
    phone_1: '',
    phone_2: '',
    email_1: '',
    email_2: '',
    address_1: '',
    city_1: '',
    state_1: '',
    pincode_1: '',
    address_2: '',
    city_2: '',
    state_2: '',
    pincode_2: ''
  });
  
  useEffect(() => {
    fetchCustomers();
  }, [sortBy, sortOrder]);
  
  const fetchCustomers = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/customers?search=${search}&sort_by=${sortBy}&sort_order=${sortOrder}`);
      setCustomers(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchCustomers(searchTerm);
  };
  
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Customer name is required');
      return;
    }
    
    try {
      // Clean data - convert empty strings to null for optional fields
      const cleanData = {
        name: formData.name,
        nickname: formData.nickname || null,
        gstin: formData.gstin || null,
        phone_1: formData.phone_1 || null,
        phone_2: formData.phone_2 || null,
        email_1: formData.email_1 || null,
        email_2: formData.email_2 || null,
        address_1: formData.address_1 || null,
        city_1: formData.city_1 || null,
        state_1: formData.state_1 || null,
        pincode_1: formData.pincode_1 || null,
        address_2: formData.address_2 || null,
        city_2: formData.city_2 || null,
        state_2: formData.state_2 || null,
        pincode_2: formData.pincode_2 || null
      };
      
      if (editingCustomer) {
        await axios.put(`${API}/customers/${editingCustomer.id}`, cleanData);
        toast.success('Customer updated successfully');
      } else {
        await axios.post(`${API}/customers`, cleanData);
        toast.success('Customer created successfully');
      }
      
      setShowDialog(false);
      setEditingCustomer(null);
      setFormData({
        name: '',
        nickname: '',
        gstin: '',
        phone_1: '',
        phone_2: '',
        email_1: '',
        email_2: '',
        address_1: '',
        city_1: '',
        state_1: '',
        pincode_1: '',
        address_2: '',
        city_2: '',
        state_2: '',
        pincode_2: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };
  
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      nickname: customer.nickname || '',
      gstin: customer.gstin || '',
      phone_1: customer.phone_1 || '',
      phone_2: customer.phone_2 || '',
      email_1: customer.email_1 || '',
      email_2: customer.email_2 || '',
      address_1: customer.address_1 || '',
      city_1: customer.city_1 || '',
      state_1: customer.state_1 || '',
      pincode_1: customer.pincode_1 || '',
      address_2: customer.address_2 || '',
      city_2: customer.city_2 || '',
      state_2: customer.state_2 || '',
      pincode_2: customer.pincode_2 || ''
    });
    setShowDialog(true);
  };
  
  const handleDelete = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete ${customerName}?`)) {
      try {
        await axios.delete(`${API}/customers/${customerId}`);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };
  
  const handleDialogChange = (open) => {
    setShowDialog(open);
    if (!open) {
      setEditingCustomer(null);
      setFormData({
        name: '',
        nickname: '',
        gstin: '',
        phone_1: '',
        phone_2: '',
        email_1: '',
        email_2: '',
        address_1: '',
        city_1: '',
        state_1: '',
        pincode_1: '',
        address_2: '',
        city_2: '',
        state_2: '',
        pincode_2: ''
      });
    }
  };
  
  // Export functions
  const exportToExcel = () => {
    const data = customers.map(c => ({
      'Name': c.name,
      'Nickname': c.nickname || '',
      'GSTIN': c.gstin || '',
      'Phone 1': c.phone_1 || '',
      'Phone 2': c.phone_2 || '',
      'Email 1': c.email_1 || '',
      'Email 2': c.email_2 || '',
      'Address 1': c.address_1 || '',
      'City 1': c.city_1 || '',
      'State 1': c.state_1 || '',
      'Pincode 1': c.pincode_1 || '',
      'Address 2': c.address_2 || '',
      'City 2': c.city_2 || '',
      'State 2': c.state_2 || '',
      'Pincode 2': c.pincode_2 || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.xlsx');
    toast.success('Exported to Excel');
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Customers List', 14, 15);
    
    const tableData = customers.map(c => [
      c.name,
      c.nickname || '-',
      c.gstin || '-',
      c.phone_1 || '-',
      c.phone_2 || '-',
      c.email_1 || '-',
      c.email_2 || '-',
      c.address_1 || '-',
      c.city_1 || '-',
      c.state_1 || '-',
      c.pincode_1 || '-',
      c.address_2 || '-',
      c.city_2 || '-',
      c.state_2 || '-',
      c.pincode_2 || '-'
    ]);
    
    autoTable(doc, {
      head: [['Name', 'Nickname', 'GSTIN', 'Phone 1', 'Phone 2', 'Email 1', 'Email 2', 'Address 1', 'City 1', 'State 1', 'Pincode 1', 'Address 2', 'City 2', 'State 2', 'Pincode 2']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 6 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 12 },
        2: { cellWidth: 18 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 25 },
        8: { cellWidth: 12 },
        9: { cellWidth: 12 },
        10: { cellWidth: 12 },
        11: { cellWidth: 25 },
        12: { cellWidth: 12 },
        13: { cellWidth: 12 },
        14: { cellWidth: 12 }
      }
    });
    
    doc.save('customers.pdf');
    toast.success('Exported to PDF');
  };
  
  const exportToWord = () => {
    let content = '<html><head><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; }</style></head><body>';
    content += '<h1>Customers List</h1>';
    content += '<table><tr><th>Name</th><th>State</th><th>City</th><th>Pincode</th><th>Mobile</th><th>Email</th><th>GSTIN</th></tr>';
    
    customers.forEach(c => {
      content += `<tr><td>${c.name}</td><td>${c.state_1 || ''}</td><td>${c.city_1 || ''}</td><td>${c.pincode_1 || ''}</td><td>${c.phone_1 || ''}</td><td>${c.email_1 || ''}</td><td>${c.gstin || ''}</td></tr>`;
    });
    
    content += '</table></body></html>';
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.doc';
    a.click();
    toast.success('Exported to Word');
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        let successCount = 0;
        for (const row of jsonData) {
          try {
            await axios.post(`${API}/customers`, {
              name: row.Name || row.name,
              address_1: row['Address 1'] || row.address_1 || '',
              city_1: row['City 1'] || row.city_1 || '',
              state_1: row['State 1'] || row.state_1 || '',
              pincode_1: row['Pincode 1'] || row.pincode_1 || '',
              phone_1: row.Mobile || row.mobile || row.phone_1 || '',
              email_1: row.Email || row.email || row.email_1 || '',
              gstin: row.GSTIN || row.gstin || ''
            });
            successCount++;
          } catch (err) {
            console.error('Error importing row:', err);
          }
        }
        
        toast.success(`Imported ${successCount} customers successfully`);
        fetchCustomers();
      } catch (error) {
        console.error('Error importing file:', error);
        toast.error('Failed to import file');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading customers...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="customers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Customers</h1>
          <p className="text-slate-600">Manage your customer database</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showDialog} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button data-testid="add-customer-btn">
                <UserPlus size={18} className="mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Customer name"
                    data-testid="customer-name-input"
                  />
                </div>
                <div>
                  <Label>Nickname</Label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="Nickname"
                  />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    placeholder="GST number"
                  />
                </div>
                <div>
                  <Label>Phone 1</Label>
                  <Input
                    value={formData.phone_1}
                    onChange={(e) => setFormData({...formData, phone_1: e.target.value})}
                    placeholder="Primary phone"
                  />
                </div>
                <div>
                  <Label>Phone 2</Label>
                  <Input
                    value={formData.phone_2}
                    onChange={(e) => setFormData({...formData, phone_2: e.target.value})}
                    placeholder="Secondary phone"
                  />
                </div>
                <div>
                  <Label>Email 1</Label>
                  <Input
                    type="email"
                    value={formData.email_1}
                    onChange={(e) => setFormData({...formData, email_1: e.target.value})}
                    placeholder="Primary email"
                  />
                </div>
                <div>
                  <Label>Email 2</Label>
                  <Input
                    type="email"
                    value={formData.email_2}
                    onChange={(e) => setFormData({...formData, email_2: e.target.value})}
                    placeholder="Secondary email"
                  />
                </div>
                
                {/* Address 1 Section */}
                <div className="col-span-2 mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Address 1</h3>
                </div>
                <div className="col-span-2">
                  <Label>Address 1</Label>
                  <Textarea
                    value={formData.address_1}
                    onChange={(e) => setFormData({...formData, address_1: e.target.value})}
                    placeholder="Primary address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>City 1</Label>
                  <Input
                    value={formData.city_1}
                    onChange={(e) => setFormData({...formData, city_1: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State 1</Label>
                  <Input
                    value={formData.state_1}
                    onChange={(e) => setFormData({...formData, state_1: e.target.value})}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label>Pincode 1</Label>
                  <Input
                    value={formData.pincode_1}
                    onChange={(e) => setFormData({...formData, pincode_1: e.target.value})}
                    placeholder="Pincode"
                  />
                </div>
                
                {/* Address 2 Section */}
                <div className="col-span-2 mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Address 2 (Optional)</h3>
                </div>
                <div className="col-span-2">
                  <Label>Address 2</Label>
                  <Textarea
                    value={formData.address_2}
                    onChange={(e) => setFormData({...formData, address_2: e.target.value})}
                    placeholder="Secondary address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>City 2</Label>
                  <Input
                    value={formData.city_2}
                    onChange={(e) => setFormData({...formData, city_2: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State 2</Label>
                  <Input
                    value={formData.state_2}
                    onChange={(e) => setFormData({...formData, state_2: e.target.value})}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label>Pincode 2</Label>
                  <Input
                    value={formData.pincode_2}
                    onChange={(e) => setFormData({...formData, pincode_2: e.target.value})}
                    placeholder="Pincode"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} data-testid="save-customer-btn">Save Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Search and Export */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, city, state, phone..."
                  className="pl-10"
                  data-testid="search-customer-input"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel} size="sm">
                <Download size={16} className="mr-2" />
                Excel
              </Button>
              <Button variant="outline" onClick={exportToPDF} size="sm">
                <Download size={16} className="mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={exportToWord} size="sm">
                <Download size={16} className="mr-2" />
                Word
              </Button>
              <Button variant="outline" size="sm" className="relative">
                <Upload size={16} className="mr-2" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No customers found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Name <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('state_1')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        State <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('city_1')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        City <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Pincode</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Mobile</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{customer.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{customer.state_1 || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{customer.city_1 || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{customer.pincode_1 || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{customer.phone_1 || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{customer.email_1 || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            data-testid={`edit-customer-${customer.name}`}
                          >
                            <Edit size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            data-testid={`delete-customer-${customer.name}`}
                          >
                            <Trash2 size={16} className="text-red-600" />
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

export default Customers;
