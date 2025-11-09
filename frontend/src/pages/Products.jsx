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
import { Plus, Search, Package } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hsn: '',
    default_rate: '',
    uom: 'pcs'
  });
  
  useEffect(() => {
    fetchProducts();
    fetchHsnCodes();
  }, []);
  
  const fetchProducts = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/products${search ? `?search=${search}` : ''}`);
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };
  
  const fetchHsnCodes = async () => {
    try {
      const res = await axios.get(`${API}/hsn-codes`);
      setHsnCodes(res.data);
    } catch (error) {
      console.error('Error fetching HSN codes:', error);
    }
  };
  
  const handleSearch = () => {
    fetchProducts(searchTerm);
  };
  
  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }
    
    try {
      await axios.post(`${API}/products`, {
        ...formData,
        default_rate: formData.default_rate ? parseFloat(formData.default_rate) : null
      });
      toast.success('Product saved successfully');
      
      setShowDialog(false);
      setFormData({
        name: '',
        description: '',
        hsn: '',
        default_rate: '',
        uom: 'pcs'
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Products</h1>
          <p className="text-slate-600">Manage your product catalog</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-product-btn">
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Product name"
                  data-testid="product-name-input"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Product description"
                  rows={2}
                />
              </div>
              <div>
                <Label>HSN Code</Label>
                <Input
                  list="hsn-list"
                  value={formData.hsn}
                  onChange={(e) => setFormData({...formData, hsn: e.target.value})}
                  placeholder="HSN code"
                />
                <datalist id="hsn-list">
                  {hsnCodes.map((hsn) => (
                    <option key={hsn.code} value={hsn.code}>{hsn.code} - {hsn.description}</option>
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Default Rate (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.default_rate}
                  onChange={(e) => setFormData({...formData, default_rate: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Unit of Measurement</Label>
                <Input
                  value={formData.uom}
                  onChange={(e) => setFormData({...formData, uom: e.target.value})}
                  placeholder="pcs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} data-testid="save-product-btn">Save Product</Button>
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
                placeholder="Search by product name or HSN code..."
                className="pl-10"
                data-testid="search-product-input"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <p className="text-slate-500 text-center">No products found</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1">{product.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {product.hsn && (
                    <p className="text-slate-600">
                      <span className="font-semibold">HSN:</span> {product.hsn}
                    </p>
                  )}
                  {product.default_rate && (
                    <p className="text-slate-600">
                      <span className="font-semibold">Rate:</span> ₹{product.default_rate.toFixed(2)}
                    </p>
                  )}
                  <p className="text-slate-600">
                    <span className="font-semibold">UOM:</span> {product.uom}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Products;
