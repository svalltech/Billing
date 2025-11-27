import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building, Search, Edit, Trash2, Download, Upload, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { indianStatesAndCities, indianStates } from '@/data/indianStates';
import { gstStateCodeOptions, extractStateCodeFromGSTIN } from '@/data/gstStateCodes';

const Businesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [availableCities, setAvailableCities] = useState([]);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: '',
    nickname: '',
    gstin: '',
    state_code: '',
    state: '',
    city: '',
    pan: '',
    others: '',
    phone_1: '',
    phone_2: '',
    email_1: '',
    email_2: '',
    address_1: '',
    address_2: ''
  });
  
  useEffect(() => {
    fetchBusinesses();
  }, []);
  
  // Client-side sorting - memoized to prevent unnecessary recalculations
  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [businesses, sortBy, sortOrder]);
  
  const fetchBusinesses = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/businesses?search=${search}`);
      setBusinesses(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchBusinesses(searchTerm);
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
    if (!formData.legal_name) {
      toast.error('Business legal name is required');
      return;
    }
    
    try {
      // Clean data - convert empty strings to null for optional fields
      const cleanData = {
        legal_name: formData.legal_name,
        nickname: formData.nickname || null,
        gstin: formData.gstin || null,
        state_code: formData.state_code || null,
        state: formData.state || null,
        city: formData.city || null,
        pan: formData.pan || null,
        others: formData.others || null,
        phone_1: formData.phone_1 || null,
        phone_2: formData.phone_2 || null,
        email_1: formData.email_1 || null,
        email_2: formData.email_2 || null,
        address_1: formData.address_1 || null,
        address_2: formData.address_2 || null
      };
      
      if (editingBusiness) {
        await axios.put(`${API}/businesses/${editingBusiness.id}`, cleanData);
        toast.success('Business updated successfully');
      } else {
        await axios.post(`${API}/businesses`, cleanData);
        toast.success('Business created successfully');
      }
      
      setShowDialog(false);
      setEditingBusiness(null);
      setFormData({
        legal_name: '',
        nickname: '',
        gstin: '',
        state_code: '',
        state: '',
        city: '',
        pan: '',
        others: '',
        phone_1: '',
        phone_2: '',
        email_1: '',
        email_2: '',
        address_1: '',
        address_2: ''
      });
      fetchBusinesses();
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error('Failed to save business');
    }
  };
  
  const handleEdit = (business) => {
    setEditingBusiness(business);
    setFormData({
      legal_name: business.legal_name,
      nickname: business.nickname || '',
      gstin: business.gstin || '',
      state_code: business.state_code || '',
      state: business.state || '',
      city: business.city || '',
      pan: business.pan || '',
      others: business.others || '',
      phone_1: business.phone_1 || '',
      phone_2: business.phone_2 || '',
      email_1: business.email_1 || '',
      email_2: business.email_2 || '',
      address_1: business.address_1 || '',
      address_2: business.address_2 || ''
    });
    setShowDialog(true);
  };
  
  const handleDelete = async (businessId, businessName) => {
    if (window.confirm(`Are you sure you want to delete ${businessName}?`)) {
      try {
        await axios.delete(`${API}/businesses/${businessId}`);
        toast.success('Business deleted successfully');
        fetchBusinesses();
      } catch (error) {
        console.error('Error deleting business:', error);
        toast.error('Failed to delete business');
      }
    }
  };
  
  const handleDialogChange = (open) => {
    setShowDialog(open);
    if (!open) {
      setEditingBusiness(null);
      setFormData({
        legal_name: '',
        nickname: '',
        gstin: '',
        state_code: '',
        state: '',
        city: '',
        pan: '',
        others: '',
        phone_1: '',
        phone_2: '',
        email_1: '',
        email_2: '',
        address_1: '',
        address_2: ''
      });
    }
  };
  
  // Export functions
  const exportToExcel = () => {
    const data = businesses.map(b => ({
      'State': b.state || '',
      'City': b.city || '',
      'Business Legal Name': b.legal_name,
      'Business Nickname': b.nickname || '',
      'GSTIN': b.gstin || '',
      'State Code': b.state_code || '',
      'PAN': b.pan || '',
      'Others': b.others || '',
      'Phone 1': b.phone_1 || '',
      'Phone 2': b.phone_2 || '',
      'Email 1': b.email_1 || '',
      'Email 2': b.email_2 || '',
      'Address 1': b.address_1 || '',
      'Address 2': b.address_2 || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Businesses');
    XLSX.writeFile(wb, 'businesses.xlsx');
    toast.success('Exported to Excel');
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Businesses List', 14, 15);
    
    const tableData = businesses.map(b => [
      b.state || '-',
      b.city || '-',
      b.legal_name,
      b.nickname || '-',
      b.gstin || '-',
      b.state_code || '-',
      b.pan || '-',
      b.phone_1 || '-',
      b.email_1 || '-'
    ]);
    
    autoTable(doc, {
      head: [['State', 'City', 'Legal Name', 'Nickname', 'GSTIN', 'State Code', 'PAN', 'Phone', 'Email']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 7 }
    });
    
    doc.save('businesses.pdf');
    toast.success('Exported to PDF');
  };
  
  const exportToWord = () => {
    let content = '<html><head><style>table { border-collapse: collapse; width: 100%; font-size: 10px; } th, td { border: 1px solid black; padding: 6px; text-align: left; } th { background-color: #f0f0f0; font-weight: bold; }</style></head><body>';
    content += '<h1>Businesses List</h1>';
    content += '<table><tr><th>State</th><th>City</th><th>Legal Name</th><th>Nickname</th><th>GSTIN</th><th>State Code</th><th>PAN</th><th>Phone 1</th><th>Phone 2</th><th>Email 1</th><th>Email 2</th><th>Address 1</th><th>Address 2</th></tr>';
    
    businesses.forEach(b => {
      content += `<tr>
        <td>${b.state || ''}</td>
        <td>${b.city || ''}</td>
        <td>${b.legal_name}</td>
        <td>${b.nickname || ''}</td>
        <td>${b.gstin || ''}</td>
        <td>${b.state_code || ''}</td>
        <td>${b.pan || ''}</td>
        <td>${b.phone_1 || ''}</td>
        <td>${b.phone_2 || ''}</td>
        <td>${b.email_1 || ''}</td>
        <td>${b.email_2 || ''}</td>
        <td>${b.address_1 || ''}</td>
        <td>${b.address_2 || ''}</td>
      </tr>`;
    });
    
    content += '</table></body></html>';
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'businesses.doc';
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
            await axios.post(`${API}/businesses`, {
              legal_name: row['Business Legal Name'] || row.legal_name,
              nickname: row['Business Nickname'] || row.nickname || null,
              gstin: row.GSTIN || row.gstin || null,
              state: row.State || row.state || null,
              city: row.City || row.city || null,
              state_code: row['State Code'] || row.state_code || null,
              pan: row.PAN || row.pan || null,
              others: row.Others || row.others || null,
              phone_1: row['Phone 1'] || row.phone_1 || null,
              phone_2: row['Phone 2'] || row.phone_2 || null,
              email_1: row['Email 1'] || row.email_1 || null,
              email_2: row['Email 2'] || row.email_2 || null,
              address_1: row['Address 1'] || row.address_1 || null,
              address_2: row['Address 2'] || row.address_2 || null
            });
            successCount++;
          } catch (err) {
            console.error('Error importing row:', err);
          }
        }
        
        toast.success(`Imported ${successCount} businesses successfully`);
        fetchBusinesses();
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
          <p className="mt-4 text-slate-600">Loading businesses...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="businesses-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Businesses</h1>
          <p className="text-slate-600">Manage your business database</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showDialog} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button data-testid="add-business-btn">
                <Building size={18} className="mr-2" />
                Add Business
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Business Legal Name *</Label>
                  <Input
                    value={formData.legal_name}
                    onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                    placeholder="Legal name"
                    data-testid="business-legal-name-input"
                  />
                </div>
                <div>
                  <Label>Business Nickname</Label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="Nickname or trade name"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="City"
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
                  <Label>State Code</Label>
                  <Input
                    value={formData.state_code}
                    onChange={(e) => setFormData({...formData, state_code: e.target.value})}
                    placeholder="State code"
                  />
                </div>
                <div>
                  <Label>PAN</Label>
                  <Input
                    value={formData.pan}
                    onChange={(e) => setFormData({...formData, pan: e.target.value})}
                    placeholder="PAN number"
                  />
                </div>
                <div>
                  <Label>Others</Label>
                  <Input
                    value={formData.others}
                    onChange={(e) => setFormData({...formData, others: e.target.value})}
                    placeholder="Other details"
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
                <div className="col-span-2">
                  <Label>Address 1</Label>
                  <Textarea
                    value={formData.address_1}
                    onChange={(e) => setFormData({...formData, address_1: e.target.value})}
                    placeholder="Primary address"
                    rows={2}
                  />
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
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} data-testid="save-business-btn">Save Business</Button>
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
                  placeholder="Search by name, city, state, GSTIN..."
                  className="pl-10"
                  data-testid="search-business-input"
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
      
      {/* Business Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No businesses found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('state')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        State <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('city')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        City <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('legal_name')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Business Legal Name <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('nickname')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Business Nickname <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('gstin')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        GSTIN <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Linked Customers</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => (
                    <tr key={business.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-600">{business.state || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{business.city || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{business.legal_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{business.nickname || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{business.gstin || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {business.linked_customers && business.linked_customers.length > 0 ? (
                          <span title={business.linked_customers.join(', ')}>
                            {business.linked_customers_count} customer{business.linked_customers_count !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(business)}
                            data-testid={`edit-business-${business.legal_name}`}
                          >
                            <Edit size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(business.id, business.legal_name)}
                            data-testid={`delete-business-${business.legal_name}`}
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

export default Businesses;
