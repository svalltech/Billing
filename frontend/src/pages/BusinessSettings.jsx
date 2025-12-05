import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Building } from 'lucide-react';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          pan: res.data.pan || '',
          others: res.data.others || '',
          phone_1: res.data.phone_1 || '',
          phone_2: res.data.phone_2 || '',
          email_1: res.data.email_1 || '',
          email_2: res.data.email_2 || '',
          address_1: res.data.address_1 || '',
          address_2: res.data.address_2 || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching business:', error);
      setLoading(false);
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
      await axios.post(`${API}/business`, formData);
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
