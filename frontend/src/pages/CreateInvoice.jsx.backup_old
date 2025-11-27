import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [items, setItems] = useState([{
    product_name: '',
    description: '',
    hsn: '',
    qty: 1,
    uom: 'pcs',
    rate: 0,
    total: 0,
    discount_amount: 0,
    cgst_percent: 0,
    sgst_percent: 0,
    igst_percent: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    taxable_amount: 0,
    final_amount: 0
  }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');
  
  const [newCustomer, setNewCustomer] = useState({
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
    fetchProducts();
    fetchGstRates();
  }, []);
  
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API}/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  const fetchGstRates = async () => {
    try {
      const res = await axios.get(`${API}/gst-rates`);
      setGstRates(res.data);
    } catch (error) {
      console.error('Error fetching GST rates:', error);
    }
  };
  
  const handleCreateCustomer = async () => {
    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }
    
    try {
      const res = await axios.post(`${API}/customers`, newCustomer);
      setCustomers([...customers, res.data]);
      setSelectedCustomer(res.data);
      setShowNewCustomerDialog(false);
      setNewCustomer({
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
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };
  
  const handleProductSelect = async (index, productName) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        product_name: product.name,
        description: product.description || '',
        hsn: product.hsn || '',
        rate: product.default_rate || 0
      };
      setItems(updatedItems);
      calculateItemTotal(index, updatedItems);
    } else {
      // New product - save it
      if (productName) {
        try {
          await axios.post(`${API}/products`, {
            name: productName,
            uom: 'pcs'
          });
          fetchProducts();
        } catch (error) {
          console.error('Error saving product:', error);
        }
      }
    }
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
    calculateItemTotal(index, updatedItems);
  };
  
  const calculateItemTotal = (index, itemsArray) => {
    const item = itemsArray[index];
    const total = item.qty * item.rate;
    const taxableAmount = total - item.discount_amount;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    
    if (item.igst_percent > 0) {
      igstAmount = (taxableAmount * item.igst_percent) / 100;
    } else {
      cgstAmount = (taxableAmount * item.cgst_percent) / 100;
      sgstAmount = (taxableAmount * item.sgst_percent) / 100;
    }
    
    const finalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
    
    itemsArray[index] = {
      ...item,
      total,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      final_amount: finalAmount
    };
    
    setItems([...itemsArray]);
  };
  
  const addItem = () => {
    setItems([...items, {
      product_name: '',
      description: '',
      hsn: '',
      qty: 1,
      uom: 'pcs',
      rate: 0,
      total: 0,
      discount_amount: 0,
      cgst_percent: 0,
      sgst_percent: 0,
      igst_percent: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      taxable_amount: 0,
      final_amount: 0
    }]);
  };
  
  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };
  
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
    const totalCgst = items.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSgst = items.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalIgst = items.reduce((sum, item) => sum + item.igst_amount, 0);
    const totalTax = totalCgst + totalSgst + totalIgst;
    const grandTotal = items.reduce((sum, item) => sum + item.final_amount, 0);
    
    return { subtotal, totalDiscount, totalCgst, totalSgst, totalIgst, totalTax, grandTotal };
  };
  
  const handleSaveInvoice = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    if (items.some(item => !item.product_name)) {
      toast.error('Please fill in all product details');
      return;
    }
    
    const totals = calculateTotals();
    
    const invoiceData = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      customer_gstin: selectedCustomer.gstin || null,
      customer_address: selectedCustomer.address_1 || null,
      customer_phone: selectedCustomer.phone_1 || null,
      items,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_cgst: totals.totalCgst,
      total_sgst: totals.totalSgst,
      total_igst: totals.totalIgst,
      total_tax: totals.totalTax,
      grand_total: totals.grandTotal,
      payment_method: paymentMethod || null,
      payment_status: paymentStatus,
      notes: notes || null
    };
    
    try {
      const res = await axios.post(`${API}/invoices`, invoiceData);
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${res.data.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };
  
  const totals = calculateTotals();
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="create-invoice-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Create Invoice</h1>
        <p className="text-slate-600">Generate a new invoice for your customer</p>
      </div>
      
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Select Customer</Label>
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(value) => {
                  const customer = customers.find(c => c.id === value);
                  setSelectedCustomer(customer);
                }}
              >
                <SelectTrigger data-testid="customer-select">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone_1 ? `- ${customer.phone_1}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
              <DialogTrigger asChild>
                <Button className="mt-6" data-testid="new-customer-btn">
                  <UserPlus size={18} className="mr-2" />
                  New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Customer name"
                      data-testid="new-customer-name"
                    />
                  </div>
                  <div>
                    <Label>Nickname</Label>
                    <Input
                      value={newCustomer.nickname}
                      onChange={(e) => setNewCustomer({...newCustomer, nickname: e.target.value})}
                      placeholder="Nickname"
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      value={newCustomer.gstin}
                      onChange={(e) => setNewCustomer({...newCustomer, gstin: e.target.value})}
                      placeholder="GST number"
                    />
                  </div>
                  <div>
                    <Label>Phone 1</Label>
                    <Input
                      value={newCustomer.phone_1}
                      onChange={(e) => setNewCustomer({...newCustomer, phone_1: e.target.value})}
                      placeholder="Primary phone"
                    />
                  </div>
                  <div>
                    <Label>Phone 2</Label>
                    <Input
                      value={newCustomer.phone_2}
                      onChange={(e) => setNewCustomer({...newCustomer, phone_2: e.target.value})}
                      placeholder="Secondary phone"
                    />
                  </div>
                  <div>
                    <Label>Email 1</Label>
                    <Input
                      type="email"
                      value={newCustomer.email_1}
                      onChange={(e) => setNewCustomer({...newCustomer, email_1: e.target.value})}
                      placeholder="Primary email"
                    />
                  </div>
                  <div>
                    <Label>Email 2</Label>
                    <Input
                      type="email"
                      value={newCustomer.email_2}
                      onChange={(e) => setNewCustomer({...newCustomer, email_2: e.target.value})}
                      placeholder="Secondary email"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address 1</Label>
                    <Textarea
                      value={newCustomer.address_1}
                      onChange={(e) => setNewCustomer({...newCustomer, address_1: e.target.value})}
                      placeholder="Primary address"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address 2</Label>
                    <Textarea
                      value={newCustomer.address_2}
                      onChange={(e) => setNewCustomer({...newCustomer, address_2: e.target.value})}
                      placeholder="Secondary address"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateCustomer} data-testid="save-new-customer-btn">Save Customer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {selectedCustomer && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-slate-800">{selectedCustomer.name}</p>
              {selectedCustomer.gstin && <p className="text-sm text-slate-600">GSTIN: {selectedCustomer.gstin}</p>}
              {selectedCustomer.phone_1 && <p className="text-sm text-slate-600">Phone: {selectedCustomer.phone_1}</p>}
              {selectedCustomer.address_1 && <p className="text-sm text-slate-600">{selectedCustomer.address_1}</p>}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-slate-700 pb-2 border-b">
                <div className="col-span-2">Product</div>
                <div className="col-span-1">HSN</div>
                <div className="col-span-1">QTY</div>
                <div className="col-span-1">Rate</div>
                <div className="col-span-1">Discount</div>
                <div className="col-span-1">CGST%</div>
                <div className="col-span-1">SGST%</div>
                <div className="col-span-1">IGST%</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Items */}
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-start">
                  <div className="col-span-2">
                    <Input
                      list={`products-${index}`}
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      onBlur={(e) => handleProductSelect(index, e.target.value)}
                      placeholder="Product name"
                      className="text-sm"
                    />
                    <datalist id={`products-${index}`}>
                      {products.map((product) => (
                        <option key={product.id} value={product.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={item.hsn}
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                      placeholder="HSN"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.discount_amount}
                      onChange={(e) => handleItemChange(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={item.cgst_percent.toString()}
                      onValueChange={(value) => {
                        handleItemChange(index, 'cgst_percent', parseFloat(value));
                        handleItemChange(index, 'sgst_percent', parseFloat(value));
                        handleItemChange(index, 'igst_percent', 0);
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map((rate) => (
                          <SelectItem key={rate.value} value={(rate.value / 2).toString()}>{rate.value / 2}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.sgst_percent}
                      readOnly
                      className="text-sm bg-slate-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={item.igst_percent.toString()}
                      onValueChange={(value) => {
                        handleItemChange(index, 'igst_percent', parseFloat(value));
                        if (parseFloat(value) > 0) {
                          handleItemChange(index, 'cgst_percent', 0);
                          handleItemChange(index, 'sgst_percent', 0);
                        }
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map((rate) => (
                          <SelectItem key={rate.value} value={rate.value.toString()}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={`₹${item.final_amount.toFixed(2)}`}
                      readOnly
                      className="text-sm font-semibold bg-slate-50"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={addItem} variant="outline" className="w-full" data-testid="add-item-btn">
            <Plus size={18} className="mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>
      
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal:</span>
            <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Discount:</span>
            <span className="font-semibold">-₹{totals.totalDiscount.toFixed(2)}</span>
          </div>
          {totals.totalCgst > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>CGST:</span>
              <span className="font-semibold">₹{totals.totalCgst.toFixed(2)}</span>
            </div>
          )}
          {totals.totalSgst > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>SGST:</span>
              <span className="font-semibold">₹{totals.totalSgst.toFixed(2)}</span>
            </div>
          )}
          {totals.totalIgst > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>IGST:</span>
              <span className="font-semibold">₹{totals.totalIgst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-700 pt-2 border-t">
            <span className="text-lg font-semibold">Grand Total:</span>
            <span className="text-2xl font-bold text-blue-600" data-testid="grand-total">₹{totals.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="payment-method-select">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger data-testid="payment-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or terms..."
              rows={3}
            />
          </div>
          
          <Button onClick={handleSaveInvoice} className="w-full" size="lg" data-testid="save-invoice-btn">
            <Save size={20} className="mr-2" />
            Save Invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoice;
