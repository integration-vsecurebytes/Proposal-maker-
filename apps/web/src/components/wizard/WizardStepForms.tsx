import { ClientSelector } from './ClientSelector';

interface StepFormProps {
  data: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function ClientInfoStep({ data, errors, onChange }: StepFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Client Information</h3>
        <p className="text-sm text-gray-500">
          Search for an existing client or enter new client details
        </p>
      </div>

      <ClientSelector
        value={{
          clientName: data.clientName || '',
          clientCompany: data.clientCompany || '',
        }}
        onChange={(client) => {
          onChange('clientName', client.clientName);
          onChange('clientCompany', client.clientCompany);
        }}
      />

      {/* Optional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={data.clientEmail || ''}
            onChange={(e) => onChange('clientEmail', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors?.clientEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="contact@company.com"
          />
          {errors?.clientEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={data.clientPhone || ''}
            onChange={(e) => onChange('clientPhone', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors?.clientPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {errors?.clientPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
          )}
        </div>
      </div>

      {errors?.clientName && (
        <p className="text-sm text-red-600">{errors.clientName}</p>
      )}
      {errors?.clientCompany && (
        <p className="text-sm text-red-600">{errors.clientCompany}</p>
      )}
    </div>
  );
}

export function ProjectDetailsStep({ data, errors, onChange }: StepFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project Details</h3>
        <p className="text-sm text-gray-500">
          Provide information about the project
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.projectTitle || ''}
          onChange={(e) => onChange('projectTitle', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors?.projectTitle ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Website Redesign Project"
        />
        {errors?.projectTitle && (
          <p className="mt-1 text-sm text-red-600">{errors.projectTitle}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.projectType || ''}
          onChange={(e) => onChange('projectType', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors?.projectType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select project type</option>
          <option value="Website Development">Website Development</option>
          <option value="Mobile App Development">Mobile App Development</option>
          <option value="Software Development">Software Development</option>
          <option value="UI/UX Design">UI/UX Design</option>
          <option value="Consulting">Consulting</option>
          <option value="Other">Other</option>
        </select>
        {errors?.projectType && (
          <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry
        </label>
        <input
          type="text"
          value={data.industry || ''}
          onChange={(e) => onChange('industry', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Technology, Healthcare, Finance, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Brief description of the project..."
        />
      </div>
    </div>
  );
}

export function ScopeTimelineStep({ data, errors, onChange }: StepFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scope & Timeline</h3>
        <p className="text-sm text-gray-500">
          Define the project scope and timeline
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Scope <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.scope || ''}
          onChange={(e) => onChange('scope', e.target.value)}
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors?.scope ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe what will be included in this project..."
        />
        {errors?.scope && (
          <p className="mt-1 text-sm text-red-600">{errors.scope}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timeline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.timeline || ''}
          onChange={(e) => onChange('timeline', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors?.timeline ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., 3 months, 12 weeks"
        />
        {errors?.timeline && (
          <p className="mt-1 text-sm text-red-600">{errors.timeline}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={data.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={data.endDate || ''}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

export function BudgetStep({ data, errors, onChange }: StepFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Budget & Pricing</h3>
        <p className="text-sm text-gray-500">
          Define the project budget and payment terms
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={data.budget || ''}
            onChange={(e) => onChange('budget', e.target.value)}
            className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors?.budget ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="50000"
          />
        </div>
        {errors?.budget && (
          <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pricing Model
        </label>
        <select
          value={data.pricingModel || ''}
          onChange={(e) => onChange('pricingModel', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select pricing model</option>
          <option value="Fixed Price">Fixed Price</option>
          <option value="Time & Materials">Time & Materials</option>
          <option value="Milestone-based">Milestone-based</option>
          <option value="Retainer">Retainer</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Terms
        </label>
        <textarea
          value={data.paymentTerms || ''}
          onChange={(e) => onChange('paymentTerms', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 50% upfront, 50% upon completion"
        />
      </div>
    </div>
  );
}

export function TemplateSelectionStep({ data, onChange }: StepFormProps) {
  // Mock templates - in real app, fetch from API
  const templates = [
    { id: '1', name: 'Professional', description: 'Clean and modern design' },
    { id: '2', name: 'Creative', description: 'Bold and colorful' },
    { id: '3', name: 'Minimal', description: 'Simple and elegant' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Template</h3>
        <p className="text-sm text-gray-500">
          Select a template for your proposal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange('templateId', template.id)}
            className={`p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors ${
              data.templateId === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewStep({ data }: StepFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Confirm</h3>
        <p className="text-sm text-gray-500">
          Review all details before creating the proposal
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Client</h4>
          <p className="mt-1 text-base text-gray-900">
            {data.clientName} - {data.clientCompany}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Project</h4>
          <p className="mt-1 text-base text-gray-900">{data.projectTitle}</p>
          <p className="text-sm text-gray-600">{data.projectType}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Timeline</h4>
          <p className="mt-1 text-base text-gray-900">{data.timeline}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Budget</h4>
          <p className="mt-1 text-base text-gray-900">${data.budget}</p>
        </div>
      </div>
    </div>
  );
}
