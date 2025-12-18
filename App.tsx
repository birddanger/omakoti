import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PropertyDetails from './components/PropertyDetails';
import PropertyCard from './components/PropertyCard';
import FilesView from './components/FilesView';
import LandingPage from './components/LandingPage';
import { LoginPage, RegisterPage } from './components/Auth';
import { Property, MaintenanceLog, PropertyType, User, AppDocument, HeatingType, PlannedTask } from './types';
import { Plus, Search, Loader2, Download, AlertCircle } from 'lucide-react';
import { authService } from './services/authService';
import { propertyService } from './services/propertyService';
import { logsService } from './services/logsService';
import { tasksService } from './services/tasksService';
import { documentsService } from './services/documentsService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);

  // Check for active session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthLoading(false);
  }, []);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when logged out
      setProperties([]);
      setLogs([]);
      setDocuments([]);
      setPlannedTasks([]);
    }
  }, [user]);

  const loadUserData = async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      const [propsData, logsData, docsData, tasksData] = await Promise.all([
        propertyService.getAll(),
        logsService.getAll(),
        documentsService.getAll(),
        tasksService.getAll()
      ]);
      setProperties(propsData);
      setLogs(logsData);
      setDocuments(docsData);
      setPlannedTasks(tasksData);
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
      console.error('Data loading error:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Handlers for CRUD operations
  const addLog = async (log: Omit<MaintenanceLog, 'id'>) => {
    try {
      const newLog = await logsService.create(log);
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      setError('Failed to add maintenance log');
      console.error(err);
    }
  };

  const updateLog = async (updatedLog: MaintenanceLog) => {
    try {
      const result = await logsService.update(updatedLog.id, updatedLog);
      setLogs(prev => prev.map(log => log.id === updatedLog.id ? result : log));
    } catch (err) {
      setError('Failed to update maintenance log');
      console.error(err);
    }
  };

  const addProperty = async (property: Omit<Property, 'id'>) => {
    try {
      const newProp = await propertyService.create(property);
      setProperties(prev => [...prev, newProp]);
    } catch (err) {
      setError('Failed to add property');
      console.error(err);
    }
  };

  const addDocument = async (doc: Omit<AppDocument, 'id'>) => {
    try {
      const newDoc = await documentsService.upload(doc);
      setDocuments(prev => [newDoc, ...prev]);
    } catch (err) {
      setError('Failed to upload document');
      console.error(err);
    }
  };

  const addPlannedTask = async (task: Omit<PlannedTask, 'id'>) => {
    try {
      const newTask = await tasksService.create(task);
      setPlannedTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError('Failed to add planned task');
      console.error(err);
    }
  };

  const deletePlannedTask = async (id: string) => {
    try {
      await tasksService.delete(id);
      setPlannedTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete planned task');
      console.error(err);
    }
  };

  const completePlannedTask = async (task: PlannedTask) => {
    try {
      // Mark task as completed
      await tasksService.complete(task.id);
      
      // Remove from planned tasks
      setPlannedTasks(prev => prev.filter(t => t.id !== task.id));

      // Parse cost and create maintenance log
      const costString = task.estimatedCost.replace(/[^0-9.]/g, '');
      const parsedCost = parseFloat(costString) || 0;

      const newLog: Omit<MaintenanceLog, 'id'> = {
        propertyId: task.propertyId,
        title: task.title,
        date: new Date().toISOString().split('T')[0],
        cost: parsedCost,
        category: 'General',
        provider: '',
        notes: `Completed from planned task. Original priority: ${task.priority}. Original due date: ${task.dueDate}`
      };

      await addLog(newLog);
    } catch (err) {
      setError('Failed to complete planned task');
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) return;

    const BOM = "\uFEFF";
    const headers = ['Date', 'Property', 'Title', 'Cost', 'Category', 'Provider', 'Notes'];
    
    const csvRows = logs.map(log => {
      const propName = properties.find(p => p.id === log.propertyId)?.name || 'Unknown';
      const row = [
        log.date,
        propName,
        log.title,
        log.cost,
        log.category,
        log.provider,
        log.notes
      ];
      return row.map(field => {
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
    });

    const csvContent = BOM + headers.join(',') + '\n' + csvRows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  // Property List View Component
  const PropertiesList: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [newProp, setNewProp] = useState<Partial<Property>>({
      name: '', 
      address: '', 
      type: PropertyType.SingleFamily, 
      yearBuilt: 2000, 
      area: 120,
      heatingType: HeatingType.District,
      floors: 1
    });

    const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProp.name || !newProp.address || !user) return;
      
      setIsSubmitting(true);
      try {
        const p: Omit<Property, 'id'> = {
          userId: user.id,
          name: newProp.name!,
          address: newProp.address!,
          type: newProp.type as PropertyType,
          yearBuilt: Number(newProp.yearBuilt),
          area: Number(newProp.area),
          heatingType: newProp.heatingType as HeatingType,
          floors: Number(newProp.floors),
          purchaseDate: new Date().toISOString()
        };
        await addProperty(p);
        setIsAddModalOpen(false);
        setNewProp({ 
          name: '', 
          address: '', 
          type: PropertyType.SingleFamily, 
          yearBuilt: 2000, 
          area: 120,
          heatingType: HeatingType.District,
          floors: 1 
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    const filteredProperties = properties.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{t('nav.properties')}</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('dash.add_property')}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={t('prop.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(prop => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
          {filteredProperties.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              {properties.length === 0 
                ? t('prop.no_props')
                : t('prop.no_match')}
            </div>
          )}
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">{t('dash.add_property')}</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.prop_name')}</label>
                   <input type="text" required className="w-full border p-2 rounded-lg" placeholder="e.g. My Beach House"
                     value={newProp.name} onChange={e => setNewProp({...newProp, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.address')}</label>
                   <input type="text" required className="w-full border p-2 rounded-lg" 
                     value={newProp.address} onChange={e => setNewProp({...newProp, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.type')}</label>
                    <select className="w-full border p-2 rounded-lg bg-white"
                      value={newProp.type} onChange={e => setNewProp({...newProp, type: e.target.value as PropertyType})}>
                      {Object.values(PropertyType).map(v => <option key={v} value={v}>{t(v)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.year')}</label>
                    <input type="number" className="w-full border p-2 rounded-lg"
                      value={newProp.yearBuilt} onChange={e => setNewProp({...newProp, yearBuilt: Number(e.target.value)})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.size')}</label>
                    <input type="number" className="w-full border p-2 rounded-lg"
                      value={newProp.area} onChange={e => setNewProp({...newProp, area: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.floors')}</label>
                    <input type="number" min="1" className="w-full border p-2 rounded-lg"
                      value={newProp.floors} onChange={e => setNewProp({...newProp, floors: Number(e.target.value)})} />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.heating')}</label>
                   <select className="w-full border p-2 rounded-lg bg-white"
                      value={newProp.heatingType} onChange={e => setNewProp({...newProp, heatingType: e.target.value as HeatingType})}>
                      {Object.values(HeatingType).map(v => <option key={v} value={v}>{t(v)}</option>)}
                   </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">{t('form.cancel')}</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? t('form.loading') : t('form.add')}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Logs List View
  const LogsList: React.FC = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">{t('nav.logs')}</h2>
            <button
                onClick={exportCSV}
                disabled={logs.length === 0}
                className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="w-4 h-4 mr-2" />
                {t('logs.export_csv')}
            </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">{t('form.date')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600">{t('files.col.prop')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600">{t('form.title')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600">{t('form.cost')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600">{t('form.category')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => {
                const propName = properties.find(p => p.id === log.propertyId)?.name || 'Unknown Property';
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-900">{log.date}</td>
                    <td className="p-4 text-sm text-slate-600">{propName}</td>
                    <td className="p-4 text-sm text-slate-900 font-medium">{log.title}</td>
                    <td className="p-4 text-sm text-slate-900">${log.cost.toLocaleString()}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {t(log.category)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">{t('detail.no_logs')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterPage onLogin={setUser} />
        } />
        
        {/* Protected Routes Wrapper */}
        <Route path="*" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {isDataLoading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <p className="text-sm text-blue-800">Loading your data...</p>
                </div>
              )}

              <Routes>
                <Route path="/dashboard" element={<Dashboard properties={properties} logs={logs} plannedTasks={plannedTasks} />} />
                <Route path="/properties" element={<PropertiesList />} />
                <Route path="/properties/:id" element={
                  <PropertyDetails 
                    properties={properties} 
                    logs={logs} 
                    documents={documents} 
                    plannedTasks={plannedTasks}
                    onAddLog={addLog} 
                    onUpdateLog={updateLog} 
                    onAddDocument={addDocument}
                    onAddPlannedTask={addPlannedTask}
                    onDeletePlannedTask={deletePlannedTask}
                    onCompletePlannedTask={completePlannedTask}
                  />
                } />
                <Route path="/logs" element={<LogsList />} />
                <Route path="/files" element={<FilesView documents={documents} properties={properties} logs={logs} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
};

export default App;