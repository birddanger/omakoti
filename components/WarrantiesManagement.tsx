import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Calendar } from 'lucide-react';
import warrantiesService, { Warranty } from '../services/warrantiesService';
import { useLanguage } from '../contexts/LanguageContext';

interface Appliance {
  id: string;
  type: string;
  modelNumber?: string;
  yearInstalled: number;
  warranty?: Warranty;
}

interface WarrantiesManagementProps {
  appliances: Appliance[];
  onWarrantyUpdated?: () => void;
}

const WarrantiesManagement: React.FC<WarrantiesManagementProps> = ({ appliances, onWarrantyUpdated }) => {
  const { translations } = useLanguage();
  const [warranties, setWarranties] = useState<Map<string, Warranty>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider: '',
    expirationDate: '',
    coverageDetails: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWarranties = () => {
      const warrantiesMap = new Map<string, Warranty>();
      appliances.forEach(appliance => {
        if (appliance.warranty) {
          warrantiesMap.set(appliance.id, appliance.warranty);
        }
      });
      setWarranties(warrantiesMap);
    };

    loadWarranties();
  }, [appliances]);

  const handleAddWarranty = (applianceId: string) => {
    setShowForm(applianceId);
    setFormData({
      provider: '',
      expirationDate: '',
      coverageDetails: ''
    });
    setError('');
  };

  const handleEditWarranty = (warranty: Warranty) => {
    setEditingId(warranty.id);
    setFormData({
      provider: warranty.provider,
      expirationDate: warranty.expirationDate,
      coverageDetails: warranty.coverageDetails || ''
    });
    setShowForm(warranty.applianceId);
    setError('');
  };

  const handleSaveWarranty = async (applianceId: string) => {
    try {
      setLoading(true);
      setError('');

      if (!formData.provider || !formData.expirationDate) {
        setError(translations.warrantyValidationError || 'Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (editingId) {
        // Update existing warranty
        const updated = await warrantiesService.update(editingId, {
          applianceId,
          ...formData
        });
        setWarranties(prev => new Map(prev).set(applianceId, updated));
      } else {
        // Create new warranty
        const created = await warrantiesService.create({
          applianceId,
          ...formData
        });
        setWarranties(prev => new Map(prev).set(applianceId, created));
      }

      setShowForm(null);
      setEditingId(null);
      setFormData({
        provider: '',
        expirationDate: '',
        coverageDetails: ''
      });

      onWarrantyUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save warranty');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarranty = async (warrantyId: string) => {
    try {
      setLoading(true);
      await warrantiesService.delete(warrantyId);
      
      // Find and remove the warranty
      const applianceId = Array.from(warranties.entries()).find(
        ([, w]) => w.id === warrantyId
      )?.[0];
      
      if (applianceId) {
        const newMap = new Map(warranties);
        newMap.delete(applianceId);
        setWarranties(newMap);
      }

      onWarrantyUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete warranty');
    } finally {
      setLoading(false);
    }
  };

  const isWarrantyExpired = (expirationDate: string): boolean => {
    return new Date(expirationDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {translations.warranties || 'Warranties'}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {appliances.map(appliance => {
          const warranty = warranties.get(appliance.id);
          const isExpired = warranty && isWarrantyExpired(warranty.expirationDate);

          return (
            <div key={appliance.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{appliance.type}</h4>
                  <p className="text-sm text-gray-600">
                    {appliance.modelNumber && `Model: ${appliance.modelNumber}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {translations.installed || 'Installed'}: {appliance.yearInstalled}
                  </p>
                </div>
              </div>

              {warranty ? (
                <div className={`mb-3 p-3 rounded ${isExpired ? 'bg-red-50' : 'bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {translations.provider || 'Provider'}: {warranty.provider}
                      </p>
                      <div className="flex items-center mt-1 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span className={isExpired ? 'text-red-700 font-medium' : 'text-gray-600'}>
                          {translations.expirationDate || 'Expiration Date'}: {new Date(warranty.expirationDate).toLocaleDateString()}
                          {isExpired && ` (${translations.expired || 'Expired'})`}
                        </span>
                      </div>
                      {warranty.coverageDetails && (
                        <p className="text-sm text-gray-600 mt-1">
                          {translations.coverage || 'Coverage'}: {warranty.coverageDetails}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleEditWarranty(warranty)}
                        className="p-2 text-gray-600 hover:bg-white rounded-lg"
                        title={translations.edit || 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWarranty(warranty.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title={translations.delete || 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">
                  {translations.noWarranty || 'No warranty information'}
                </p>
              )}

              {showForm !== appliance.id && !warranty && (
                <button
                  onClick={() => handleAddWarranty(appliance.id)}
                  className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {translations.addWarranty || 'Add Warranty'}
                </button>
              )}

              {showForm === appliance.id && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations.provider || 'Provider'} *
                    </label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={translations.provider || 'Provider'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations.expirationDate || 'Expiration Date'} *
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations.coverage || 'Coverage Details'}
                    </label>
                    <textarea
                      value={formData.coverageDetails}
                      onChange={(e) => setFormData({ ...formData, coverageDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                      placeholder={translations.coverageDetails || 'What is covered?'}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveWarranty(appliance.id)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      {loading ? (translations.saving || 'Saving...') : (translations.save || 'Save')}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(null);
                        setEditingId(null);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      {translations.cancel || 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarrantiesManagement;
