import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Property, MaintenanceLog, MaintenancePrediction, AppDocument, PlannedTask } from '../types';
import { generateMaintenancePlan } from '../services/geminiService';
import { ArrowLeft, Sparkles, Calendar, Plus, PenTool, AlertTriangle, Paperclip, X, Image as ImageIcon, FileText, Loader2, Pencil, Ruler, Flame, Layers, CheckSquare, Trash2, ListChecks } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppliancesList from './AppliancesList';
import SeasonalChecklists from './SeasonalChecklists';

interface PropertyDetailsProps {
  properties: Property[];
  logs: MaintenanceLog[];
  documents: AppDocument[];
  plannedTasks: PlannedTask[];
  onAddLog: (log: Omit<MaintenanceLog, 'id'>) => Promise<void>;
  onUpdateLog: (log: MaintenanceLog) => Promise<void>;
  onAddDocument: (doc: Omit<AppDocument, 'id'>) => Promise<void>;
  onAddPlannedTask: (task: Omit<PlannedTask, 'id'>) => Promise<void>;
  onDeletePlannedTask: (id: string) => Promise<void>;
  onCompletePlannedTask: (task: PlannedTask) => Promise<void>;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ 
  properties, 
  logs, 
  documents, 
  plannedTasks,
  onAddLog, 
  onUpdateLog, 
  onAddDocument,
  onAddPlannedTask,
  onDeletePlannedTask,
  onCompletePlannedTask
}) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'history' | 'planning'>('history');
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const property = properties.find(p => p.id === id);
  const propertyLogs = logs.filter(l => l.propertyId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const propertyTasks = plannedTasks.filter(t => t.propertyId === id && t.status !== 'completed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Form State for new log
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Form State for new planned task
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<PlannedTask>>({
    title: '',
    dueDate: '',
    priority: 'Medium',
    estimatedCost: ''
  });

  const [newLogData, setNewLogData] = useState<Partial<MaintenanceLog>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    category: 'General',
    provider: '',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // Filter State
  const [logFilters, setLogFilters] = useState({
    category: 'All',
    dateRange: 'all',
    minCost: '',
    maxCost: '',
    searchTerm: ''
  });

  if (!property) return <div className="text-center py-10">Property not found</div>;

  const handleGeneratePlan = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      // Pass the current language to the service
      const plan = await generateMaintenancePlan(property, propertyLogs, language);
      setPredictions(plan);
    } catch (err) {
      setAiError("Failed to generate AI plan. Please check your API configuration and try again.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAcceptPrediction = async (prediction: MaintenancePrediction) => {
    // Convert prediction to task
    const newTask: Omit<PlannedTask, 'id'> = {
      propertyId: property.id,
      title: prediction.task,
      dueDate: mapFuzzyDateToIso(prediction.estimatedDate),
      priority: prediction.priority,
      estimatedCost: prediction.estimatedCost,
      status: 'pending'
    };
    await onAddPlannedTask(newTask);
    
    // Remove from predictions list to avoid duplicate adds
    setPredictions(prev => prev.filter(p => p.task !== prediction.task));
  };

  const mapFuzzyDateToIso = (fuzzy: string): string => {
    // Simple helper to guess a date if AI gives "Fall 2024". 
    // Default to one month from now if parsing fails for simplicity in this demo.
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().split('T')[0];
  };

  const getFilteredLogs = () => {
    let filtered = [...propertyLogs];

    // Filter by category
    if (logFilters.category !== 'All') {
      filtered = filtered.filter(log => log.category === logFilters.category);
    }

    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (logFilters.dateRange !== 'all') {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        const logDateNormalized = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
        const diffTime = today.getTime() - logDateNormalized.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (logFilters.dateRange) {
          case 'week': return diffDays <= 7;
          case 'month': return diffDays <= 30;
          case 'quarter': return diffDays <= 90;
          case 'year': return diffDays <= 365;
          default: return true;
        }
      });
    }

    // Filter by cost range
    if (logFilters.minCost) {
      const minCost = parseFloat(logFilters.minCost);
      filtered = filtered.filter(log => log.cost >= minCost);
    }
    if (logFilters.maxCost) {
      const maxCost = parseFloat(logFilters.maxCost);
      filtered = filtered.filter(log => log.cost <= maxCost);
    }

    // Filter by search term
    if (logFilters.searchTerm) {
      const term = logFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.title.toLowerCase().includes(term) ||
        log.notes.toLowerCase().includes(term) ||
        log.provider.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title || !newTaskData.dueDate) return;

    const task: Omit<PlannedTask, 'id'> = {
        propertyId: property.id,
        title: newTaskData.title!,
        dueDate: newTaskData.dueDate!,
        priority: (newTaskData.priority as any) || 'Medium',
        estimatedCost: newTaskData.estimatedCost || '',
        status: 'pending'
    };
    await onAddPlannedTask(task);
    setIsAddTaskOpen(false);
    setNewTaskData({ title: '', dueDate: '', priority: 'Medium', estimatedCost: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const openAddModal = () => {
    setEditingLogId(null);
    setNewLogData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      cost: 0,
      category: 'General',
      provider: '',
      notes: ''
    });
    setSelectedFiles([]);
    setIsAddLogOpen(true);
  };

  const openEditModal = (log: MaintenanceLog) => {
    setEditingLogId(log.id);
    setNewLogData({ ...log });
    setSelectedFiles([]);
    setIsAddLogOpen(true);
  };

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogData.title || !newLogData.date) return;
    
    setIsProcessingFiles(true);
    const logId = editingLogId || Date.now().toString();

    try {
      // Save Log first
      const logToSave: Omit<MaintenanceLog, 'id'> = {
        propertyId: property.id,
        title: newLogData.title!,
        date: newLogData.date!,
        cost: Number(newLogData.cost) || 0,
        category: (newLogData.category as any) || 'General',
        provider: newLogData.provider || '',
        notes: newLogData.notes || '',
      };

      if (editingLogId) {
        await onUpdateLog({ id: editingLogId, ...logToSave } as MaintenanceLog);
      } else {
        await onAddLog(logToSave);
      }

      // Process and upload files
      await Promise.all(selectedFiles.map(async (file) => {
        const base64Data = await convertFileToBase64(file);
        const doc: Omit<AppDocument, 'id'> = {
          propertyId: property.id,
          logId: logId,
          name: file.name,
          type: file.type,
          size: file.size,
          date: new Date().toISOString(),
          data: base64Data
        };
        await onAddDocument(doc);
      }));
      
      // Reset
      setIsAddLogOpen(false);
      setEditingLogId(null);
      setNewLogData({ title: '', date: new Date().toISOString().split('T')[0], cost: 0, category: 'General', provider: '', notes: '' });
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Failed to save log. Please try again.");
    } finally {
      setIsProcessingFiles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/properties" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{property.name}</h2>
          <p className="text-slate-500 text-sm">{property.address}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
             <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
               <Ruler className="w-4 h-4 mr-2 text-slate-400" /> 
               {property.area} m²
             </span>
             <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
               <Flame className="w-4 h-4 mr-2 text-slate-400" /> 
               {t(property.heatingType)}
             </span>
             <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
               <Layers className="w-4 h-4 mr-2 text-slate-400" /> 
               {property.floors} {t('form.floors')}
             </span>
          </div>
        </div>
      </div>

      {/* Planned Tasks Section - TOP */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="space-y-12">
            {/* Section 1: Active Plan */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <ListChecks className="w-5 h-5 mr-2 text-purple-600" />
                  {t('plan.current_tasks')}
                </h3>
                <button 
                  onClick={() => setIsAddTaskOpen(true)}
                  className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t('plan.add_custom')}
                </button>
              </div>

              {propertyTasks.length > 0 ? (
                <div className="space-y-3">
                  {propertyTasks.map(task => (
                    <div key={task.id} className="group flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all relative">
                      <input type="checkbox" className="flex-shrink-0 w-5 h-5 mt-0.5 text-purple-600 rounded" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{task.title}</div>
                        <div className="text-sm text-slate-600 mt-1">Due: {task.dueDate}</div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                          task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-2">{task.estimatedCost}</div>
                      </div>
                      <button 
                        onClick={() => onCompletePlannedTask(task)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-green-500 p-2 transition-all"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeletePlannedTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-2 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-slate-500">{t('plan.no_tasks')}</p>
                </div>
              )}
            </div>

            {/* Section 2: AI Suggestions */}
            <div className="pt-8 border-t border-slate-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-2 bg-purple-100 text-purple-600 rounded-full mb-3">
                   <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{t('plan.ai_suggestions')}</h3>
                <button 
                  onClick={handleGeneratePlan}
                  disabled={isLoadingAI}
                  className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50"
                >
                  {isLoadingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('plan.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('plan.gen_plan')}
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{aiError}</p>
                </div>
              )}

              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-lg font-bold text-slate-900 leading-tight">{item.task}</h5>
                        </div>
                        <span className={`inline-block mb-2 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                             item.priority === 'High' ? 'bg-red-100 text-red-700' : item.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {item.priority}
                        </span>
                        <p className="text-slate-600 text-sm">{item.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                          <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            Due: {item.estimatedDate}
                          </span>
                          <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            Cost: {item.estimatedCost}
                          </span>
                        </div>
                      </div>
                      <div className="pl-3 mt-auto">
                         <button 
                           onClick={() => handleAcceptPrediction(item)}
                           className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                         >
                           {t('plan.accept')}
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-slate-500">{t('plan.run_ai')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appliances Section */}
      {id && <AppliancesList propertyId={id} />}

      {/* Seasonal Checklists Section */}
      {id && <SeasonalChecklists propertyId={id} onAddPlannedTask={onAddPlannedTask} />}

      {/* Maintenance History Section - BOTTOM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">{t('detail.recorded_maint')}</h3>
                <button 
                  onClick={openAddModal}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('detail.log_activity')}
                </button>
              </div>

              {/* Filter Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-slate-700 text-sm">Filters</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                    <input 
                      type="text"
                      placeholder="Title, notes, provider..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={logFilters.searchTerm}
                      onChange={(e) => setLogFilters({...logFilters, searchTerm: e.target.value})}
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={logFilters.category}
                      onChange={(e) => setLogFilters({...logFilters, category: e.target.value})}
                    >
                      <option value="All">All Categories</option>
                      <option value="General">General</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Landscaping">Landscaping</option>
                      <option value="Appliance">Appliance</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date Range</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={logFilters.dateRange}
                      onChange={(e) => setLogFilters({...logFilters, dateRange: e.target.value})}
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="quarter">Last 90 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Min Cost Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Min Cost ($)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={logFilters.minCost}
                      onChange={(e) => setLogFilters({...logFilters, minCost: e.target.value})}
                    />
                  </div>

                  {/* Max Cost Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Max Cost ($)</label>
                    <input 
                      type="number"
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={logFilters.maxCost}
                      onChange={(e) => setLogFilters({...logFilters, maxCost: e.target.value})}
                    />
                  </div>
                </div>

                {/* Reset Filters Button */}
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setLogFilters({ category: 'All', dateRange: 'all', minCost: '', maxCost: '', searchTerm: '' })}
                    className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-300 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {propertyLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-slate-500">{t('detail.no_logs')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredLogs().length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-slate-500">No logs match your filters</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-600 mb-2">
                        Showing {getFilteredLogs().length} of {propertyLogs.length} entries
                      </div>
                      {getFilteredLogs().map(log => {
                        const attachments = documents.filter(d => d.logId === log.id);
                        return (
                          <div key={log.id} className="group flex flex-col gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors relative">
                            <button 
                              onClick={() => openEditModal(log)}
                              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit Log"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            
                            <div className="flex flex-col sm:flex-row gap-4 pr-10">
                              <div className="sm:w-32 flex-shrink-0">
                                <div className="text-sm font-semibold text-slate-900">{log.date}</div>
                                <div className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600 mt-1">
                                  {t(log.category)}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base font-medium text-slate-900">{log.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{log.notes}</p>
                                {log.provider && (
                                  <div className="mt-2 text-xs text-slate-500 flex items-center">
                                    <PenTool className="w-3 h-3 mr-1" />
                                    {log.provider}
                                  </div>
                                )}
                                
                                {/* Attachments Section */}
                                {attachments.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {attachments.map(doc => (
                                      <a 
                                        key={doc.id}
                                        href={doc.data}
                                        download={doc.name}
                                        className="inline-flex items-center px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                        title="Download Attachment"
                                      >
                                        {doc.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 mr-1" /> : <Paperclip className="w-3 h-3 mr-1" />}
                                        <span className="truncate max-w-[150px]">{doc.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="sm:text-right">
                                <span className="text-sm font-bold text-slate-900">${log.cost.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Log Modal (Add/Edit) */}
      {isAddLogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex-shrink-0">
              {editingLogId ? t('form.update') : t('detail.log_activity')}
            </h3>
            <form onSubmit={handleAddLogSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.title')}</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. Furnace Filter Replacement"
                  value={newLogData.title}
                  onChange={e => setNewLogData({...newLogData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.date')}</label>
                   <input 
                     type="date" 
                     required
                     className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={newLogData.date}
                     onChange={e => setNewLogData({...newLogData, date: e.target.value})}
                   />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.cost')}</label>
                   <input 
                     type="number" 
                     min="0"
                     className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={newLogData.cost}
                     onChange={e => setNewLogData({...newLogData, cost: Number(e.target.value)})}
                   />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.category')}</label>
                <select 
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={newLogData.category}
                  onChange={e => setNewLogData({...newLogData, category: e.target.value as any})}
                >
                  <option value="General">{t('General')}</option>
                  <option value="Plumbing">{t('Plumbing')}</option>
                  <option value="Electrical">{t('Electrical')}</option>
                  <option value="HVAC">{t('HVAC')}</option>
                  <option value="Roofing">{t('Roofing')}</option>
                  <option value="Landscaping">{t('Landscaping')}</option>
                  <option value="Appliance">{t('Appliance')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.provider')}</label>
                <input 
                  type="text"
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Acme Plumbing"
                  value={newLogData.provider}
                  onChange={e => setNewLogData({...newLogData, provider: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.notes')}</label>
                <textarea 
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={newLogData.notes}
                  onChange={e => setNewLogData({...newLogData, notes: e.target.value})}
                />
              </div>
              
              {/* File Upload Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('form.attachments')}</label>
                
                {/* Existing Attachments in Edit Mode */}
                {editingLogId && documents.filter(d => d.logId === editingLogId).length > 0 && (
                   <div className="mb-3 space-y-2">
                     <p className="text-xs text-slate-500 font-medium uppercase">{t('form.current_attachments')}</p>
                     {documents.filter(d => d.logId === editingLogId).map(doc => (
                        <div key={doc.id} className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                           {doc.type.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                           <span className="truncate">{doc.name}</span>
                        </div>
                     ))}
                   </div>
                )}

                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500">{t('form.upload_text')}</p>
                    </div>
                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
                
                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded border border-blue-100">
                        <span className="truncate max-w-[200px] text-blue-700">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSelectedFile(idx)}
                          className="text-blue-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsAddLogOpen(false)}
                  disabled={isProcessingFiles}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessingFiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  {isProcessingFiles && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingLogId ? t('form.update') : t('form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal (Add Custom) */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{t('plan.add_custom')}</h3>
            <form onSubmit={handleAddTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.title')}</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTaskData.title}
                  onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('plan.due_date')}</label>
                <input 
                  type="date" 
                  required
                  className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTaskData.dueDate}
                  onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('plan.priority')}</label>
                   <select 
                     className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                     value={newTaskData.priority}
                     onChange={e => setNewTaskData({...newTaskData, priority: e.target.value as any})}
                   >
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.estimated_cost')}</label>
                   <input 
                     type="text" 
                     className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     placeholder="$100"
                     value={newTaskData.estimatedCost}
                     onChange={e => setNewTaskData({...newTaskData, estimatedCost: e.target.value})}
                   />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {t('form.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;