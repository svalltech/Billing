import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [adminBusiness, setAdminBusiness] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [gstType, setGstType] = useState(null); // 'cgst_sgst' or 'igst'
  const [items, setItems] = useState([{
    product_name: '',
    description: '',
    hsn: '',
    qty: 1,
    uom: 'pcs',
    rate_mode: 'with_gst', // 'with_gst' or 'without_gst'
    rate: 0,
    gst_rate: 18,
    custom_gst_rate: null,
    total: 0,
    discount_amount: 0,
    cgst_percent: 0,
    sgst_percent: 0,
    igst_percent: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    taxable_amount: 0,
    final_amount: 0,
    confirmed: false
  }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');
  
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
  
  const fetchAdminBusiness = async () => {
    try {
      const res = await axios.get(`${API}/business`);
      setAdminBusiness(res.data);
    } catch (error) {
      console.error('Error fetching admin business:', error);
    }
  };
  
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchAdminBusiness();
  }, []);
  
  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(customer => {
      const nameMatch = customer.name?.toLowerCase().includes(search);
      const businessMatch = customer.business_name?.toLowerCase().includes(search);
      const gstinMatch = customer.gstin?.toLowerCase().includes(search);
      return nameMatch || businessMatch || gstinMatch;
    });
  }, [customers, customerSearch]);
  
  // Determine GST type when customer is selected
  useEffect(() => {
    if (selectedCustomer && adminBusiness) {
      const customerState = selectedCustomer.state_1 || '';
      const adminState = adminBusiness.state || '';
      
      if (customerState && adminState) {
        if (customerState.toLowerCase() === adminState.toLowerCase()) {
          setGstType('cgst_sgst');
        } else {
          setGstType('igst');
        }
      } else {
        setGstType('cgst_sgst'); // Default to CGST/SGST
      }
    }
  }, [selectedCustomer, adminBusiness]);
  
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };
  
  const getCustomerDisplayText = (customer) => {
    let text = customer.name;
    
    // Add business name if exists and not "NA"
    if (customer.business_name && customer.business_name !== 'NA') {
      text += ` - ${customer.business_name}`;
    }
    
    // Add GSTIN if exists
    if (customer.gstin) {
      text += ` - ${customer.gstin}`;
    }
    
    return text;
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
        gst_rate: product.gst_rate || 18,
        rate: product.default_rate || 0
      };
      setItems(updatedItems);
      calculateItemTotal(index, updatedItems);
    }
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
    
    // Recalculate if rate, qty, discount, gst_rate, custom_gst_rate, or rate_mode changes
    if (['rate', 'qty', 'discount_amount', 'gst_rate', 'custom_gst_rate', 'rate_mode'].includes(field)) {
      calculateItemTotal(index, updatedItems);
    }
  };
  
  const calculateItemTotal = (index, itemsArray) => {
    const item = itemsArray[index];
    const gstRate = item.custom_gst_rate ? parseFloat(item.custom_gst_rate) : item.gst_rate;
    
    let taxableAmount = 0;
    let gstAmount = 0;
    let finalAmount = 0;
    
    if (item.rate_mode === 'with_gst') {
      // User enters final price (including GST)
      // We need to back-calculate taxable amount and GST
      const enteredPrice = item.qty * item.rate;
      const priceAfterDiscount = enteredPrice - item.discount_amount;
      
      // Final amount = Taxable + GST
      // Final amount = Taxable + (Taxable * GST%)
      // Final amount = Taxable * (1 + GST%)
      // Therefore: Taxable = Final amount / (1 + GST%)
      taxableAmount = priceAfterDiscount / (1 + (gstRate / 100));
      gstAmount = priceAfterDiscount - taxableAmount;
      finalAmount = priceAfterDiscount;
    } else {
      // User enters base price (without GST)
      // GST is added on top
      const basePrice = item.qty * item.rate;
      taxableAmount = basePrice - item.discount_amount;
      gstAmount = (taxableAmount * gstRate) / 100;
      finalAmount = taxableAmount + gstAmount;
    }
    
    // Distribute GST based on type (CGST/SGST or IGST)
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    
    if (gstType === 'igst') {
      igstAmount = gstAmount;
      igstPercent = gstRate;
    } else {
      // CGST/SGST - split equally
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
      cgstPercent = gstRate / 2;
      sgstPercent = gstRate / 2;
    }
    
    itemsArray[index] = {
      ...item,
      total: item.qty * item.rate,
      taxable_amount: taxableAmount,
      cgst_percent: cgstPercent,
      sgst_percent: sgstPercent,
      igst_percent: igstPercent,
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
      rate_mode: 'with_gst',
      rate: 0,
      gst_rate: 18,
      custom_gst_rate: null,
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
          <div>
            <Label>Select Customer *</Label>
            <div className="relative">
              <Input
                value={selectedCustomer ? getCustomerDisplayText(selectedCustomer) : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) {
                    setSelectedCustomer(null);
                  }
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search by customer name, business name, or GSTIN..."
                className="w-full"
                data-testid="customer-search"
              />
              
              {showCustomerDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <p className="font-medium text-slate-800">{getCustomerDisplayText(customer)}</p>
                        {customer.phone_1 && (
                          <p className="text-sm text-slate-500">{customer.phone_1}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-slate-500">
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {selectedCustomer && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
              <p className="font-semibold text-slate-800 text-lg">{selectedCustomer.name}</p>
              {selectedCustomer.business_name && selectedCustomer.business_name !== 'NA' && (
                <p className="text-sm text-slate-600">Business: {selectedCustomer.business_name}</p>
              )}
              {selectedCustomer.gstin && <p className="text-sm text-slate-600">GSTIN: {selectedCustomer.gstin}</p>}
              {selectedCustomer.phone_1 && <p className="text-sm text-slate-600">Phone: {selectedCustomer.phone_1}</p>}
              {selectedCustomer.address_1 && <p className="text-sm text-slate-600">{selectedCustomer.address_1}</p>}
              {selectedCustomer.state_1 && <p className="text-sm text-slate-600">State: {selectedCustomer.state_1}</p>}
              
              {/* GST Type Indicator */}
              <div className="mt-3 pt-3 border-t border-blue-300">
                <p className="text-sm font-semibold text-blue-700">
                  {gstType === 'igst' ? '📦 Inter-State Supply (IGST)' : '📍 Intra-State Supply (CGST + SGST)'}
                </p>
              </div>
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
          {!itemsConfirmed && items.map((item, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6 space-y-4">
                {/* Product Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      list={`products-${index}`}
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      onBlur={(e) => handleProductSelect(index, e.target.value)}
                      placeholder="Enter or select product"
                    />
                    <datalist id={`products-${index}`}>
                      {products.map((product) => (
                        <option key={product.id} value={product.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label>HSN Code</Label>
                    <Input
                      value={item.hsn}
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                      placeholder="HSN code"
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Product description (optional)"
                    rows={2}
                  />
                </div>
                
                {/* Quantity and Rate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={item.uom}
                      onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      value={item.discount_amount}
                      onChange={(e) => handleItemChange(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {/* Rate Toggle and GST Rate */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label className="mb-2 block">Rate Type *</Label>
                      <div className="flex items-center gap-2 bg-white border-2 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'rate_mode', 'with_gst')}
                          className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                            item.rate_mode === 'with_gst'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          With GST
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'rate_mode', 'without_gst')}
                          className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                            item.rate_mode === 'without_gst'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Without GST
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>
                        Rate (₹) *
                        <span className="text-xs text-slate-500 ml-1">
                          {item.rate_mode === 'with_gst' ? '(Inc. GST)' : '(Exc. GST)'}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <Label>GST Rate (%)</Label>
                      <div className="flex gap-2">
                        <Select
                          value={item.custom_gst_rate ? 'custom' : item.gst_rate.toString()}
                          onValueChange={(value) => {
                            const updatedItems = [...items];
                            if (value === 'custom') {
                              updatedItems[index] = {
                                ...updatedItems[index],
                                custom_gst_rate: ''
                              };
                              setItems(updatedItems);
                            } else {
                              updatedItems[index] = {
                                ...updatedItems[index],
                                gst_rate: parseFloat(value),
                                custom_gst_rate: null
                              };
                              setItems(updatedItems);
                              calculateItemTotal(index, updatedItems);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {item.custom_gst_rate !== null && item.custom_gst_rate !== undefined && (
                          <Input
                            type="number"
                            value={item.custom_gst_rate}
                            onChange={(e) => handleItemChange(index, 'custom_gst_rate', e.target.value)}
                            placeholder="Enter %"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-24"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Calculation Summary */}
                  <div className="mt-4 pt-4 border-t border-slate-300 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Taxable Amount</p>
                      <p className="font-semibold text-slate-800">₹{item.taxable_amount.toFixed(2)}</p>
                    </div>
                    {gstType === 'cgst_sgst' ? (
                      <>
                        <div>
                          <p className="text-slate-500">CGST ({item.cgst_percent}%)</p>
                          <p className="font-semibold text-slate-800">₹{item.cgst_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">SGST ({item.sgst_percent}%)</p>
                          <p className="font-semibold text-slate-800">₹{item.sgst_amount.toFixed(2)}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-slate-500">IGST ({item.igst_percent}%)</p>
                        <p className="font-semibold text-slate-800">₹{item.igst_amount.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">Final Amount</p>
                      <p className="font-bold text-blue-600 text-base">₹{item.final_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Remove Button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Remove Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!itemsConfirmed && (
            <>
              <Button onClick={addItem} variant="outline" className="w-full" data-testid="add-item-btn">
                <Plus size={18} className="mr-2" />
                Add Item
              </Button>
              
              <Button 
                onClick={() => {
                  // Validate all items have product name
                  if (items.some(item => !item.product_name)) {
                    toast.error('Please fill in all product names before confirming');
                    return;
                  }
                  setItemsConfirmed(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                data-testid="confirm-items-btn"
              >
                Confirm Items
              </Button>
            </>
          )}
          
          {/* Confirmed Items Summary */}
          {itemsConfirmed && (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-green-800">✓ Items Confirmed</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemsConfirmed(false)}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    Edit Items
                  </Button>
                </div>
                
                {/* Items Summary Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">#</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Product Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Unit Price (with GST)</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Value (with GST)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{item.product_name}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{item.qty} {item.uom}</td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            ₹{item.rate_mode === 'with_gst' 
                              ? item.rate.toFixed(2) 
                              : (item.rate * (1 + ((item.custom_gst_rate ? parseFloat(item.custom_gst_rate) : item.gst_rate) / 100))).toFixed(2)
                            }
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">
                            ₹{item.final_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2">
                      <tr>
                        <td colSpan="4" className="py-3 px-4 text-right font-bold text-slate-800">
                          Grand Total:
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600 text-lg">
                          ₹{items.reduce((sum, item) => sum + item.final_amount, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
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
          
          {/* Payment Details */}
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
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
                placeholder="Additional notes or terms"
                rows={3}
              />
            </div>
          </div>
          
          {/* Save Button */}
          {itemsConfirmed && (
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveInvoice} 
                size="lg"
                disabled={!selectedCustomer}
                data-testid="save-invoice-btn"
              >
                <Receipt size={20} className="mr-2" />
                Save Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoice;
