import { useState, useEffect } from 'react';
import { useWizardStore } from '../../stores/wizard';
import { Search, Building2, User, CheckCircle2 } from 'lucide-react';

interface Client {
  clientName: string;
  clientCompany: string;
  lastProposalDate?: Date;
  proposalCount: number;
}

interface ClientSelectorProps {
  value: {
    clientName: string;
    clientCompany: string;
  };
  onChange: (client: { clientName: string; clientCompany: string }) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { searchClients, autofillClient } = useWizardStore();

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchClients(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, searchClients]);

  const handleSelectClient = async (client: Client) => {
    onChange({
      clientName: client.clientName,
      clientCompany: client.clientCompany,
    });

    // Auto-fill additional client details
    await autofillClient(client.clientName, client.clientCompany);

    setSearchQuery('');
    setShowResults(false);
  };

  const handleClickOutside = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="space-y-4">
      {/* Search existing clients */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Existing Clients
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={handleClickOutside}
            placeholder="Search by client name or company..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((client, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectClient(client)}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0 text-left"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {client.clientName}
                    </p>
                    {client.proposalCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {client.proposalCount} proposals
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm text-gray-600">{client.clientCompany}</p>
                  </div>
                  {client.lastProposalDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last proposal: {new Date(client.lastProposalDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or enter manually</span>
        </div>
      </div>

      {/* Manual client entry */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.clientName}
            onChange={(e) => onChange({ ...value, clientName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.clientCompany}
            onChange={(e) => onChange({ ...value, clientCompany: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Acme Corporation"
          />
        </div>
      </div>

      {/* Selected client indicator */}
      {value.clientName && value.clientCompany && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900">
              {value.clientName}
            </p>
            <p className="text-sm text-green-700">{value.clientCompany}</p>
          </div>
        </div>
      )}
    </div>
  );
}
