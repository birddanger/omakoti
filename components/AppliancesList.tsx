import React, { useState, useEffect } from 'react';
import { Appliance } from '../types';
import { appliancesService } from '../services/appliancesService';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import WarrantiesManagement from './WarrantiesManagement';

interface AppliancesListProps {
  propertyId: string;
}

const AppliancesList: React.FC<AppliancesListProps> = ({ propertyId }) => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    type: '',
    modelNumber: '',
    yearInstalled: new Date().getFullYear(),
    monthInstalled: new Date().getMonth() + 1
  });

  useEffect(() => {
    loadAppliances();
  }, [propertyId]);

  const loadAppliances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appliancesService.getAppliances(propertyId);
      setAppliances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appliances');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type.trim()) {
      setError(t('appliances.add'));
      return;
    }

    try {
      setError(null);
      await appliancesService.createAppliance(propertyId, {
        type: formData.type,
        modelNumber: formData.modelNumber || undefined,
        yearInstalled: formData.yearInstalled,
        monthInstalled: formData.monthInstalled
      });

      setFormData({
        type: '',
        modelNumber: '',
        yearInstalled: new Date().getFullYear(),
        monthInstalled: new Date().getMonth() + 1
      });
      setShowForm(false);
      await loadAppliances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add appliance');
    }
  };

  const handleDeleteAppliance = async (applianceId: string) => {
    if (!confirm(t('checklist.delete_confirm'))) {
      return;
    }

    try {
      setError(null);
      await appliancesService.deleteAppliance(applianceId);
      await loadAppliances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appliance');
    }
  };

  const monthNames = [
    t('month.January'), t('month.February'), t('month.March'), t('month.April'), 
    t('month.May'), t('month.June'), t('month.July'), t('month.August'), 
    t('month.September'), t('month.October'), t('month.November'), t('month.December')
  ];

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">⚙️</span>
        {t('appliances.title')}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex items-start">
          <AlertCircle className="text-red-600 mr-3 mt-0.5" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">{t('plan.ai.analyzing')}</p>
      ) : (
        <>
          {appliances.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4">
              {appliances.map((appliance) => (
                <div key={appliance.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{appliance.type}</h4>
                        {appliance.modelNumber && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{t('appliances.model')}:</span> {appliance.modelNumber}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{t('detail.recorded_maint')}:</span> {monthNames[appliance.monthInstalled - 1]} {appliance.yearInstalled}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAppliance(appliance.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('appliances.delete_confirm')}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Warranty Section for each appliance */}
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <WarrantiesManagement appliances={[appliance]} onWarrantyUpdated={() => loadAppliances()} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              {t('appliances.add')}
            </button>
          )}

          {showForm && (
            <form onSubmit={handleAddAppliance} className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
              <h4 className="font-semibold mb-4">{t('appliances.form_title')}</h4>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('appliances.type')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t('appliances.type')}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('appliances.model')} <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={t('appliances.model')}
                  value={formData.modelNumber}
                  onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('appliances.year')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearInstalled}
                    onChange={(e) => setFormData({ ...formData, yearInstalled: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('appliances.month')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.monthInstalled}
                    onChange={(e) => setFormData({ ...formData, monthInstalled: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {t('appliances.add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                >
                  {t('form.cancel')}
                </button>
              </div>
            </form>
          )}

          {appliances.length === 0 && !showForm && (
            <p className="text-gray-500 text-center py-4">
              {t('appliances.no_appliances')}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AppliancesList;
