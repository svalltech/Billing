import { useState, useEffect } from 'react';
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
import { Plus, Search, Edit, Trash2, ArrowUpDown } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    hsn: '',
    gst_rate: '',
    default_rate: '',
    uom: 'pcs'
  });
  
  useEffect(() => {
    fetchProducts();
    fetchHsnCodes();
  }, [sortBy, sortOrder]);
  
  const fetchProducts = async (search = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/products?search=${search}&sort_by=${sortBy}&sort_order=${sortOrder}`);
      setProducts(res.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(res.data.map(p => p.category).filter(c => c))];
      setCategories(uniqueCategories);
      
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
      toast.error('Product name is required');
      return;
    }
    
    try {
      const cleanData = {
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        hsn: formData.hsn || null,
        gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : null,
        default_rate: formData.default_rate ? parseFloat(formData.default_rate) : null,
        uom: formData.uom || 'pcs'
      };
      
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, cleanData);
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, cleanData);
        toast.success('Product created successfully');
      }
      
      setShowDialog(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        hsn: '',
        gst_rate: '',
        default_rate: '',
        uom: 'pcs'
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };
  
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      hsn: product.hsn || '',
      gst_rate: product.gst_rate || '',
      default_rate: product.default_rate || '',
      uom: product.uom || 'pcs'
    });
    setShowDialog(true);
  };
  
  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      try {
        await axios.delete(`${API}/products/${productId}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };
  
  const handleDialogChange = (open) => {
    setShowDialog(open);
    if (!open) {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        hsn: '',
        gst_rate: '',
        default_rate: '',
        uom: 'pcs'
      });
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
        <Dialog open={showDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="add-product-btn">
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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
              <div>
                <Label>Product Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Category"
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
                <Label>GST Rate (%)</Label>
                <Select
                  value={formData.gst_rate.toString()}
                  onValueChange={(value) => setFormData({...formData, gst_rate: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Product description"
                  rows={2}
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
                placeholder="Search by product name, category or HSN code..."
                className="pl-10"
                data-testid="search-product-input"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Category <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Product Name <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('hsn')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        HSN Code <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <button
                        onClick={() => handleSort('gst_rate')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        GST Rate <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-600">{product.category || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{product.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{product.hsn || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {product.gst_rate ? `${product.gst_rate}%` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            data-testid={`edit-product-${product.name}`}
                          >
                            <Edit size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.name)}
                            data-testid={`delete-product-${product.name}`}
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

export default Products;
