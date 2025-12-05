import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Building, Upload, X } from 'lucide-react';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logo, setLogo] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    legal_name: '',
    nickname: '',
    gstin: '',
    state_code: '',
    state: '',
    city: '',
    pincode: '',
    pan: '',
    others: '',
    phone_1: '',
    phone_2: '',
    email_1: '',
    email_2: '',
    website: '',
    address_1: '',
    address_2: '',
    ship_state: '',
    ship_city: ''
  });
  const [copyBillToShip, setCopyBillToShip] = useState(false);
  
  useEffect(() => {
    fetchBusiness();
  }, []);
  
  const fetchBusiness = async () => {
    try {
      const res = await axios.get(`${API}/business`);
      if (res.data) {
        setFormData({
          legal_name: res.data.legal_name || '',
          nickname: res.data.nickname || '',
          gstin: res.data.gstin || '',
          state_code: res.data.state_code || '',
          state: res.data.state || '',
          city: res.data.city || '',
          pincode: res.data.pincode || '',
          pan: res.data.pan || '',
          others: res.data.others || '',
          phone_1: res.data.phone_1 || '',
          phone_2: res.data.phone_2 || '',
          email_1: res.data.email_1 || '',
          email_2: res.data.email_2 || '',
          website: res.data.website || '',
          address_1: res.data.address_1 || '',
          address_2: res.data.address_2 || '',
          ship_state: res.data.ship_state || '',
          ship_city: res.data.ship_city || ''
        });
        setLogo(res.data.logo || null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching business:', error);
      setLoading(false);
    }
  };
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post(`${API}/business/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setLogo(res.data.logo);
      toast.success('Logo uploaded successfully');
      setUploadingLogo(false);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      setUploadingLogo(false);
    }
  };
  
  const handleRemoveLogo = async () => {
    try {
      await axios.post(`${API}/business`, {
        ...formData,
        logo: null,
        email_1: formData.email_1 || null,
        email_2: formData.email_2 || null
      });
      setLogo(null);
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleCopyBillToShip = (checked) => {
    setCopyBillToShip(checked);
    if (checked) {
      setFormData({
        ...formData,
        address_2: formData.address_1,
        ship_state: formData.state,
        ship_city: formData.city,
        phone_2: formData.phone_1
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.legal_name) {
      toast.error('Business legal name is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data with null values for empty emails
      const dataToSend = {
        ...formData,
        logo: logo,
        email_1: formData.email_1 || null,
        email_2: formData.email_2 || null
      };
      
      await axios.post(`${API}/business`, dataToSend);
      toast.success('Business details saved successfully');
      setSaving(false);
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error('Failed to save business details');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="business-settings-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">Business Settings</h1>
        <p className="text-slate-600">Configure your business profile and information</p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="text-blue-600" size={24} />
              </div>
              <CardTitle className="text-2xl">Business Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="border-b pb-6">
              <Label>Company Logo</Label>
              <p className="text-xs text-slate-500 mb-3">Upload your company logo (will be displayed on invoices at 1.5"×1.5")</p>
              
              {logo ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={logo} 
                      alt="Business Logo" 
                      className="w-32 h-32 object-contain border-2 border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      <Upload size={16} className="mr-2" />
                      Change Logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} className="mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload size={16} className="mr-2" />
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Legal Name *</Label>
                <Input
                  value={formData.legal_name}
                  onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                  placeholder="Business legal name"
                  required
                  data-testid="business-legal-name"
                />
              </div>
              <div>
                <Label>Business Nickname</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  placeholder="Trade name or nickname"
                />
              </div>
            </div>
            
            {/* Tax Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="State name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="City name"
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  placeholder="Pincode"
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
            </div>
            
            {/* Contact Info */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label>Website</Label>
                  <Input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Address</h3>
              <div className="space-y-4">
                <div>
                  <Label>Address 1</Label>
                  <Textarea
                    value={formData.address_1}
                    onChange={(e) => setFormData({...formData, address_1: e.target.value})}
                    placeholder="Primary business address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Address 2</Label>
                  <Textarea
                    value={formData.address_2}
                    onChange={(e) => setFormData({...formData, address_2: e.target.value})}
                    placeholder="Secondary address (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button type="submit" size="lg" disabled={saving} data-testid="save-business-btn">
                <Save size={20} className="mr-2" />
                {saving ? 'Saving...' : 'Save Business Details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default BusinessSettings;
