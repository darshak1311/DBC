import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CardPreview } from './CardPreview';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Camera, 
  Instagram, 
  Linkedin, 
  Github, 
  Twitter, 
  Globe,
  Facebook,
  Youtube,
  Palette,
  Type,
  Shapes,
  Layout,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Upload,
  LogOut,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

interface FormData {
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  avatar_url: string;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

interface SocialLinkForm {
  platform: string;
  username: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { name: 'Instagram', icon: Instagram, baseUrl: 'https://instagram.com/' },
  { name: 'LinkedIn', icon: Linkedin, baseUrl: 'https://linkedin.com/in/' },
  { name: 'GitHub', icon: Github, baseUrl: 'https://github.com/' },
  { name: 'Twitter', icon: Twitter, baseUrl: 'https://twitter.com/' },
  { name: 'Facebook', icon: Facebook, baseUrl: 'https://facebook.com/' },
  { name: 'You Tube', icon: Youtube, baseUrl: 'https://youtube.com/@' },
  { name: 'Website', icon: Globe, baseUrl: 'https://' },
];

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Raleway',
  'Poppins',
  'Nunito',
  'Playfair Display'
];

const CARD_SHAPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'hexagon', label: 'Hexagon' }
];

const LAYOUT_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'creative', label: 'Creative' }
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    phone: '',
    email: user?.email || '',
    website: '',
    avatar_url: '',
    theme: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    shape: 'rectangle',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });
  const [newSocialLink, setNewSocialLink] = useState<SocialLinkForm>({
    platform: 'Instagram',
    username: '',
    url: ''
  });

  useEffect(() => {
    loadBusinessCard();
  }, [user]);

  useEffect(() => {
    // Load Google Font
    if (formData.layout.font) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${formData.layout.font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [formData.layout.font]);

  const loadBusinessCard = async () => {
    if (!user) return;

    try {
      // Load business card
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cardError && cardError.code !== 'PGRST116') {
        console.error('Error loading business card:', cardError);
        return;
      }

      if (cardData) {
        setBusinessCard(cardData);
        setFormData({
          title: cardData.title || '',
          company: cardData.company || '',
          phone: cardData.phone || '',
          email: cardData.email || user.email || '',
          website: cardData.website || '',
          avatar_url: cardData.avatar_url || '',
          theme: cardData.theme as any || formData.theme,
          shape: cardData.shape || 'rectangle',
          layout: cardData.layout as any || formData.layout,
          is_published: cardData.is_published
        });

        // Load social links
        const { data: linksData, error: linksError } = await supabase
          .from('social_links')
          .select('*')
          .eq('card_id', cardData.id);

        if (linksError) {
          console.error('Error loading social links:', linksError);
        } else {
          setSocialLinks(linksData || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (colorType: string, color: string) => {
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [colorType]: color
      }
    }));
  };

  const handleLayoutChange = (layoutField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [layoutField]: value
      }
    }));
  };

  const handleSocialLinkChange = (field: string, value: string) => {
    setNewSocialLink(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate URL when username changes
      if (field === 'username' || field === 'platform') {
        const platform = SOCIAL_PLATFORMS.find(p => p.name === updated.platform);
        if (platform && updated.username) {
          updated.url = platform.baseUrl + updated.username;
        }
      }
      
      return updated;
    });
  };

  const addSocialLink = async () => {
    if (!businessCard || !newSocialLink.username) return;

    try {
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          card_id: businessCard.id,
          platform: newSocialLink.platform,
          username: newSocialLink.username,
          url: newSocialLink.url
        })
        .select()
        .single();

      if (error) throw error;

      setSocialLinks(prev => [...prev, data]);
      setNewSocialLink({
        platform: 'Instagram',
        username: '',
        url: ''
      });
    } catch (error) {
      console.error('Error adding social link:', error);
    }
  };

  const removeSocialLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setSocialLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (error) {
      console.error('Error removing social link:', error);
    }
  };

  const saveBusinessCard = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published
      };

      if (businessCard) {
        // Update existing card
        const { error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', businessCard.id);

        if (error) throw error;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;
        setBusinessCard(data);
      }

      // Show success message (you could add a toast notification here)
      console.log('Business card saved successfully!');
    } catch (error) {
      console.error('Error saving business card:', error);
    } finally {
      setSaving(false);
    }
  };

  const viewPublicCard = () => {
    if (businessCard && formData.is_published) {
      window.open(`/c/${businessCard.id}`, '_blank');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your business card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Business Card Editor</h1>
                <p className="text-sm text-gray-500">Create and customize your digital business card</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {businessCard && formData.is_published && (
                <button
                  onClick={viewPublicCard}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Public Card
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Published:</span>
                <button
                  onClick={() => handleInputChange('is_published', !formData.is_published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_published ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                {formData.is_published ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <button
                onClick={saveBusinessCard}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form Inputs */}
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>
              <div className="space-y-4">
                {/* Profile Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                      {formData.avatar_url && (
                        <button
                          onClick={() => handleInputChange('avatar_url', '')}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your website URL"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Instagram className="w-5 h-5" />
                Social Media Links
              </h2>
              
              {/* Existing Social Links */}
              <div className="space-y-3 mb-4">
                {socialLinks.map((link) => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.name === link.platform);
                  const Icon = platform?.icon || Globe;
                  return (
                    <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{link.platform}</div>
                        <div className="text-sm text-gray-600">{link.username}</div>
                      </div>
                      <button
                        onClick={() => removeSocialLink(link.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add New Social Link */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={newSocialLink.platform}
                    onChange={(e) => handleSocialLinkChange('platform', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.name} value={platform.name}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newSocialLink.username}
                    onChange={(e) => handleSocialLinkChange('username', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Username"
                  />
                  </div>
                  <input
                    type="url"
                    value={newSocialLink.url}
                    onChange={(e) => handleSocialLinkChange('url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full URL (auto-generated)"
                  />
                  <button
                    onClick={addSocialLink}
                    disabled={!newSocialLink.username || !newSocialLink.url}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
              </div>
            </div>

            {/* Design Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Design Controls
              </h2>
              
              {/* Theme Colors */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium text-gray-700">Theme Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.theme.primary}
                        onChange={(e) => handleThemeChange('primary', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.theme.primary}
                        onChange={(e) => handleThemeChange('primary', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.theme.secondary}
                        onChange={(e) => handleThemeChange('secondary', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.theme.secondary}
                        onChange={(e) => handleThemeChange('secondary', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.theme.background}
                        onChange={(e) => handleThemeChange('background', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.theme.background}
                        onChange={(e) => handleThemeChange('background', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.theme.text}
                        onChange={(e) => handleThemeChange('text', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.theme.text}
                        onChange={(e) => handleThemeChange('text', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Family
                </label>
                <select
                  value={formData.layout.font}
                  onChange={(e) => handleLayoutChange('font', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {GOOGLE_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shape Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shapes className="w-4 h-4" />
                  Card Shape
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_SHAPES.map((shape) => (
                    <button
                      key={shape.value}
                      onClick={() => handleInputChange('shape', shape.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.shape === shape.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Layout Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => handleLayoutChange('style', style.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.layout.style === style.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="lg:sticky lg:top-8">
            <CardPreview
              formData={formData}
              socialLinks={socialLinks}
            />
          </div>
        </div>
      </div>
    </div>
  );
};