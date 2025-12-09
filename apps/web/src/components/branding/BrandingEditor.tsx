import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Upload, Save, Eye } from 'lucide-react';

interface BrandingEditorProps {
  proposalId: string;
  currentBranding: any;
  onSave: (branding: any) => void;
}

export function BrandingEditor({ proposalId, currentBranding, onSave }: BrandingEditorProps) {
  const [branding, setBranding] = useState(currentBranding || {});
  const [uploading, setUploading] = useState(false);

  const handleColorChange = (field: string, value: string) => {
    setBranding({ ...branding, [field]: value });
  };

  const handleLogoUpload = async (type: 'company' | 'client', file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBranding({
          ...branding,
          [`${type}Logo`]: base64
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setUploading(false);
    }
  };

  const handleSave = () => {
    onSave(branding);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="slides">Slides</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize your proposal's color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="text"
                    value={branding.primaryColor || '#F7941D'}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    placeholder="#F7941D"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label>Preview</Label>
                  <input
                    type="color"
                    value={branding.primaryColor || '#F7941D'}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="text"
                    value={branding.secondaryColor || '#0066B3'}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    placeholder="#0066B3"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label>Preview</Label>
                  <input
                    type="color"
                    value={branding.secondaryColor || '#0066B3'}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input
                    id="accentColor"
                    type="text"
                    value={branding.accentColor || '#FFB347'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    placeholder="#FFB347"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label>Preview</Label>
                  <input
                    type="color"
                    value={branding.accentColor || '#FFB347'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="mt-6 p-6 rounded-lg border-4" style={{
                borderColor: branding.primaryColor || '#F7941D',
                background: `linear-gradient(135deg, ${branding.primaryColor || '#F7941D'}15, ${branding.secondaryColor || '#0066B3'}10)`
              }}>
                <h3 className="text-2xl font-bold mb-2" style={{ color: branding.primaryColor || '#F7941D' }}>
                  Sample Heading
                </h3>
                <p className="text-gray-700">This is how your proposal will look with these colors.</p>
                <div className="mt-4 inline-block px-4 py-2 rounded" style={{
                  backgroundColor: branding.accentColor || '#FFB347',
                  color: 'white'
                }}>
                  Accent Color
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company & Client Logos</CardTitle>
              <CardDescription>Upload logos for header, footer, and cover page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Logo */}
              <div className="space-y-3">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleLogoUpload('company', e.target.files[0])}
                        className="hidden"
                        id="company-logo-upload"
                      />
                      <label htmlFor="company-logo-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload company logo</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                      </label>
                    </div>
                  </div>
                  {branding.companyLogo && (
                    <div className="w-32 h-32 border rounded-lg p-2 bg-white flex items-center justify-center">
                      <img
                        src={branding.companyLogo}
                        alt="Company Logo Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Client Logo */}
              <div className="space-y-3">
                <Label>Client Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleLogoUpload('client', e.target.files[0])}
                        className="hidden"
                        id="client-logo-upload"
                      />
                      <label htmlFor="client-logo-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload client logo</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                      </label>
                    </div>
                  </div>
                  {branding.clientLogo && (
                    <div className="w-32 h-32 border rounded-lg p-2 bg-white flex items-center justify-center">
                      <img
                        src={branding.clientLogo}
                        alt="Client Logo Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Usage Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">Logo will appear in:</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor || '#F7941D' }}></span>
                    Cover Page (large, centered)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor || '#F7941D' }}></span>
                    Header (top of every page)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor || '#F7941D' }}></span>
                    Footer (bottom of every page)
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Customize fonts for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Heading Font */}
              <div>
                <Label htmlFor="headingFont">Heading Font</Label>
                <select
                  id="headingFont"
                  value={branding.headingFont || 'Arial'}
                  onChange={(e) => setBranding({ ...branding, headingFont: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </div>

              {/* Body Font */}
              <div>
                <Label htmlFor="fontFamily">Body Font</Label>
                <select
                  id="fontFamily"
                  value={branding.fontFamily || 'Arial'}
                  onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </div>

              {/* Font Preview */}
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: branding.headingFont || 'Arial' }}>
                  Sample Heading Text
                </h3>
                <p className="text-base" style={{ fontFamily: branding.fontFamily || 'Arial' }}>
                  This is how your body text will appear in the proposal. The heading above uses your selected heading font, while this paragraph uses your body font.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Header Customization</CardTitle>
              <CardDescription>Configure header appearance on all pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="headerEnabled"
                  checked={branding.header?.enabled !== false}
                  onChange={(e) => setBranding({
                    ...branding,
                    header: { ...branding.header, enabled: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <Label htmlFor="headerEnabled">Show Header</Label>
              </div>

              {branding.header?.enabled !== false && (
                <>
                  <div>
                    <Label htmlFor="headerText">Header Text</Label>
                    <Input
                      id="headerText"
                      value={branding.header?.text || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        header: { ...branding.header, text: e.target.value }
                      })}
                      placeholder="Company name or tagline"
                    />
                  </div>

                  <div>
                    <Label htmlFor="headerBgColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="headerBgColor"
                        value={branding.header?.backgroundColor || '#ffffff'}
                        onChange={(e) => setBranding({
                          ...branding,
                          header: { ...branding.header, backgroundColor: e.target.value }
                        })}
                      />
                      <input
                        type="color"
                        value={branding.header?.backgroundColor || '#ffffff'}
                        onChange={(e) => setBranding({
                          ...branding,
                          header: { ...branding.header, backgroundColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="headerLogoPosition">Logo Position</Label>
                    <select
                      id="headerLogoPosition"
                      value={branding.header?.logoPosition || 'left'}
                      onChange={(e) => setBranding({
                        ...branding,
                        header: { ...branding.header, logoPosition: e.target.value as 'left' | 'center' | 'right' }
                      })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Footer Customization</CardTitle>
              <CardDescription>Configure footer appearance and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="footerEnabled"
                  checked={branding.footer?.enabled !== false}
                  onChange={(e) => setBranding({
                    ...branding,
                    footer: { ...branding.footer, enabled: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <Label htmlFor="footerEnabled">Show Footer</Label>
              </div>

              {branding.footer?.enabled !== false && (
                <>
                  <div>
                    <Label htmlFor="footerCompanyInfo">Company Information</Label>
                    <Input
                      id="footerCompanyInfo"
                      value={branding.footer?.companyInfo || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        footer: { ...branding.footer, companyInfo: e.target.value }
                      })}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="footerEmail">Email</Label>
                      <Input
                        id="footerEmail"
                        value={branding.footer?.email || ''}
                        onChange={(e) => setBranding({
                          ...branding,
                          footer: { ...branding.footer, email: e.target.value }
                        })}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="footerPhone">Phone</Label>
                      <Input
                        id="footerPhone"
                        value={branding.footer?.phone || ''}
                        onChange={(e) => setBranding({
                          ...branding,
                          footer: { ...branding.footer, phone: e.target.value }
                        })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="footerWebsite">Website</Label>
                    <Input
                      id="footerWebsite"
                      value={branding.footer?.website || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        footer: { ...branding.footer, website: e.target.value }
                      })}
                      placeholder="www.yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="footerAddress">Address</Label>
                    <Input
                      id="footerAddress"
                      value={branding.footer?.address || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        footer: { ...branding.footer, address: e.target.value }
                      })}
                      placeholder="123 Business St, City, State 12345"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="footerPageNumbers"
                      checked={branding.footer?.showPageNumbers !== false}
                      onChange={(e) => setBranding({
                        ...branding,
                        footer: { ...branding.footer, showPageNumbers: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="footerPageNumbers">Show Page Numbers</Label>
                  </div>

                  <div>
                    <Label htmlFor="footerBgColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="footerBgColor"
                        value={branding.footer?.backgroundColor || '#f9fafb'}
                        onChange={(e) => setBranding({
                          ...branding,
                          footer: { ...branding.footer, backgroundColor: e.target.value }
                        })}
                      />
                      <input
                        type="color"
                        value={branding.footer?.backgroundColor || '#f9fafb'}
                        onChange={(e) => setBranding({
                          ...branding,
                          footer: { ...branding.footer, backgroundColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slides" className="space-y-4">
          {/* Thank You Slide */}
          <Card>
            <CardHeader>
              <CardTitle>Thank You Slide</CardTitle>
              <CardDescription>Customize the closing slide of your proposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="thankYouEnabled"
                  checked={branding.thankYouSlide?.enabled !== false}
                  onChange={(e) => setBranding({
                    ...branding,
                    thankYouSlide: { ...branding.thankYouSlide, enabled: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <Label htmlFor="thankYouEnabled">Show Thank You Slide</Label>
              </div>

              {branding.thankYouSlide?.enabled !== false && (
                <>
                  <div>
                    <Label htmlFor="thankYouTitle">Title</Label>
                    <Input
                      id="thankYouTitle"
                      value={branding.thankYouSlide?.title || 'Thank You'}
                      onChange={(e) => setBranding({
                        ...branding,
                        thankYouSlide: { ...branding.thankYouSlide, title: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="thankYouMessage">Message</Label>
                    <textarea
                      id="thankYouMessage"
                      value={branding.thankYouSlide?.message || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        thankYouSlide: { ...branding.thankYouSlide, message: e.target.value }
                      })}
                      placeholder="We look forward to working with you..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="thankYouContact">Contact Person</Label>
                      <Input
                        id="thankYouContact"
                        value={branding.thankYouSlide?.contactPerson || ''}
                        onChange={(e) => setBranding({
                          ...branding,
                          thankYouSlide: { ...branding.thankYouSlide, contactPerson: e.target.value }
                        })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thankYouEmail">Contact Email</Label>
                      <Input
                        id="thankYouEmail"
                        value={branding.thankYouSlide?.contactEmail || ''}
                        onChange={(e) => setBranding({
                          ...branding,
                          thankYouSlide: { ...branding.thankYouSlide, contactEmail: e.target.value }
                        })}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Back Cover */}
          <Card>
            <CardHeader>
              <CardTitle>Back Cover</CardTitle>
              <CardDescription>Design the back cover of your proposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="backCoverEnabled"
                  checked={branding.backCover?.enabled !== false}
                  onChange={(e) => setBranding({
                    ...branding,
                    backCover: { ...branding.backCover, enabled: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <Label htmlFor="backCoverEnabled">Show Back Cover</Label>
              </div>

              {branding.backCover?.enabled !== false && (
                <>
                  <div>
                    <Label htmlFor="backCoverTagline">Tagline</Label>
                    <Input
                      id="backCoverTagline"
                      value={branding.backCover?.tagline || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        backCover: { ...branding.backCover, tagline: e.target.value }
                      })}
                      placeholder="Your company tagline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Social Media Links</Label>
                    <Input
                      value={branding.backCover?.socialMedia?.website || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        backCover: {
                          ...branding.backCover,
                          socialMedia: { ...branding.backCover?.socialMedia, website: e.target.value }
                        }
                      })}
                      placeholder="Website URL"
                    />
                    <Input
                      value={branding.backCover?.socialMedia?.linkedin || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        backCover: {
                          ...branding.backCover,
                          socialMedia: { ...branding.backCover?.socialMedia, linkedin: e.target.value }
                        }
                      })}
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={branding.backCover?.socialMedia?.twitter || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        backCover: {
                          ...branding.backCover,
                          socialMedia: { ...branding.backCover?.socialMedia, twitter: e.target.value }
                        }
                      })}
                      placeholder="Twitter/X URL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="backCoverBgColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backCoverBgColor"
                        value={branding.backCover?.backgroundColor || '#f9fafb'}
                        onChange={(e) => setBranding({
                          ...branding,
                          backCover: { ...branding.backCover, backgroundColor: e.target.value }
                        })}
                      />
                      <input
                        type="color"
                        value={branding.backCover?.backgroundColor || '#f9fafb'}
                        onChange={(e) => setBranding({
                          ...branding,
                          backCover: { ...branding.backCover, backgroundColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={uploading} className="gap-2">
          <Save className="w-4 h-4" />
          Save Branding
        </Button>
      </div>
    </div>
  );
}
