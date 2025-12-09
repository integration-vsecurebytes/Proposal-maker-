import { useState } from 'react';
import { Palette, RefreshCw } from 'lucide-react';

interface ColorPickerProps {
  initialColors?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    successColor?: string;
    warningColor?: string;
    errorColor?: string;
    backgroundColor?: string;
    surfaceColor?: string;
  };
  onApplyColors?: (colors: any) => void;
}

export function ManualColorPicker({ initialColors, onApplyColors }: ColorPickerProps) {
  const [colors, setColors] = useState({
    primary: initialColors?.primaryColor || '#3b82f6',
    secondary: initialColors?.secondaryColor || '#10b981',
    accent: initialColors?.accentColor || '#FFB347',
    success: initialColors?.successColor || '#4ECDC4',
    warning: initialColors?.warningColor || '#FF6B6B',
    error: initialColors?.errorColor || '#ef4444',
    background: initialColors?.backgroundColor || '#ffffff',
    surface: initialColors?.surfaceColor || '#f9fafb',
  });

  const handleColorChange = (colorKey: string, value: string) => {
    setColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleApply = () => {
    if (onApplyColors) {
      onApplyColors(colors);
    }
  };

  const handleReset = () => {
    setColors({
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#FFB347',
      success: '#4ECDC4',
      warning: '#FF6B6B',
      error: '#ef4444',
      background: '#ffffff',
      surface: '#f9fafb',
    });
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
    { key: 'secondary', label: 'Secondary Color', description: 'Supporting brand color' },
    { key: 'accent', label: 'Accent Color', description: 'Highlighting elements' },
    { key: 'success', label: 'Success Color', description: 'Positive actions' },
    { key: 'warning', label: 'Warning Color', description: 'Caution indicators' },
    { key: 'error', label: 'Error Color', description: 'Error states' },
    { key: 'background', label: 'Background Color', description: 'Page background' },
    { key: 'surface', label: 'Surface Color', description: 'Card backgrounds' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Manual Color Picker</h2>
        <p className="text-gray-600">Customize your proposal colors manually</p>
      </div>

      {/* Color Grid */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {colorFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">{field.label}</span>
                <span className="block text-xs text-gray-500">{field.description}</span>
              </label>
              <div className="flex items-center gap-3">
                {/* Color preview */}
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                  style={{ backgroundColor: colors[field.key as keyof typeof colors] }}
                  onClick={() => {
                    const input = document.getElementById(`color-${field.key}`);
                    if (input) input.click();
                  }}
                />
                {/* Color input */}
                <div className="flex-1">
                  <input
                    id={`color-${field.key}`}
                    type="color"
                    value={colors[field.key as keyof typeof colors]}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-full h-12 cursor-pointer rounded-lg border-2 border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    value={colors[field.key as keyof typeof colors]}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-full mt-2 px-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t flex gap-3">
          <button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Palette className="h-5 w-5" />
            Apply Colors to Proposal
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Color Preview</h4>
        <div
          className="rounded-lg overflow-hidden border-2 border-gray-200"
          style={{ backgroundColor: colors.background }}
        >
          {/* Preview Header */}
          <div className="p-6 text-white" style={{ backgroundColor: colors.primary }}>
            <h3 className="text-2xl font-bold mb-1">Your Proposal Title</h3>
            <p className="text-white/90">Professional Business Solutions</p>
          </div>

          {/* Preview Content */}
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <h4 className="font-semibold mb-2" style={{ color: colors.primary }}>
                Executive Summary
              </h4>
              <p className="text-sm text-gray-700">
                This is how your content will look with the selected colors.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: colors.primary }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded font-medium"
                style={{ backgroundColor: colors.secondary, color: 'white' }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded font-medium"
                style={{ backgroundColor: colors.accent, color: 'white' }}
              >
                Accent Button
              </button>
            </div>

            <div className="flex gap-3">
              <div
                className="flex-1 p-3 rounded text-white text-sm font-medium text-center"
                style={{ backgroundColor: colors.success }}
              >
                Success
              </div>
              <div
                className="flex-1 p-3 rounded text-white text-sm font-medium text-center"
                style={{ backgroundColor: colors.warning }}
              >
                Warning
              </div>
              <div
                className="flex-1 p-3 rounded text-white text-sm font-medium text-center"
                style={{ backgroundColor: colors.error }}
              >
                Error
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
