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
import { UserPlus, Search, Edit } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    gstin: '',
    phone_1: '',
    phone_2: '',
    email_1: '',
    email_2: '',
    address_1: '',
    address_2: ''
  });
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const fetchCustomers = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/customers${search ? `?search=${search}` : ''}`);
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
  
  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Customer name is required');
      return;
    }
    
    try {
      if (editingCustomer) {
        await axios.put(`${API}/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await axios.post(`${API}/customers`, formData);
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
        address_2: ''
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
      address_2: customer.address_2 || ''
    });
    setShowDialog(true);
  };
  
  const handleDialogChange = (open) => {
    setShowDialog(open);
    if (!open) {
      // Only reset when closing
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
        address_2: ''
      });
    }
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
              <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button onClick={handleSubmit} data-testid="save-customer-btn">Save Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                placeholder="Search by name, nickname, or phone..."
                className="pl-10"
                data-testid="search-customer-input"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <p className="text-slate-500 text-center">No customers found</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.nickname && (
                      <p className="text-sm text-slate-500 mt-1">{customer.nickname}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(customer)}
                    data-testid={`edit-customer-${customer.name}`}
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {customer.gstin && (
                    <p className="text-slate-600">
                      <span className="font-semibold">GSTIN:</span> {customer.gstin}
                    </p>
                  )}
                  {customer.phone_1 && (
                    <p className="text-slate-600">
                      <span className="font-semibold">Phone:</span> {customer.phone_1}
                    </p>
                  )}
                  {customer.email_1 && (
                    <p className="text-slate-600">
                      <span className="font-semibold">Email:</span> {customer.email_1}
                    </p>
                  )}
                  {customer.address_1 && (
                    <p className="text-slate-600">
                      <span className="font-semibold">Address:</span> {customer.address_1}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;
