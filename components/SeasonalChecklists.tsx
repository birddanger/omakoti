import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { SeasonalChecklist, ChecklistItem, PlannedTask } from '../types';
import { checklistsService } from '../services/checklistsService';
import { useLanguage } from '../contexts/LanguageContext';

interface SeasonalChecklistsProps {
  propertyId: string;
  onAddPlannedTask?: (task: Omit<PlannedTask, 'id'>) => Promise<void>;
}

export const SeasonalChecklists: React.FC<SeasonalChecklistsProps> = ({ propertyId, onAddPlannedTask }) => {
  const { t } = useLanguage();
  const [checklists, setChecklists] = useState<SeasonalChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Spring' | 'Summer' | 'Fall' | 'Winter'>('Spring');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [addingToPlanned, setAddingToPlanned] = useState<string | null>(null);

  useEffect(() => {
    loadChecklists();
  }, [propertyId]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistsService.getChecklists(propertyId);
      setChecklists(data);
      if (data.length === 0) {
        setInitialized(false);
      } else {
        setInitialized(true);
      }
    } catch (err) {
      console.error('Error loading checklists:', err);
      setError('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const initializeChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistsService.initializeChecklists(propertyId);
      setChecklists(data);
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing checklists:', err);
      setError('Failed to initialize checklists');
    } finally {
      setLoading(false);
    }
  };

  const activeChecklist = checklists.find(cl => cl.season === activeTab);

  const toggleItemCompletion = async (item: ChecklistItem) => {
    if (!activeChecklist) return;

    const updatedItems = activeChecklist.items.map(i =>
      i.id === item.id ? { ...i, completed: !i.completed } : i
    );

    try {
      await checklistsService.updateChecklist(activeChecklist.id, updatedItems);
      setChecklists(checklists.map(cl =>
        cl.id === activeChecklist.id ? { ...cl, items: updatedItems } : cl
      ));
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item');
    }
  };

  const addNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !activeChecklist) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newItemTitle,
      completed: false
    };

    const updatedItems = [...activeChecklist.items, newItem];

    try {
      await checklistsService.updateChecklist(activeChecklist.id, updatedItems);
      setChecklists(checklists.map(cl =>
        cl.id === activeChecklist.id ? { ...cl, items: updatedItems } : cl
      ));
      setNewItemTitle('');
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!activeChecklist) return;

    const updatedItems = activeChecklist.items.filter(i => i.id !== itemId);

    try {
      await checklistsService.updateChecklist(activeChecklist.id, updatedItems);
      setChecklists(checklists.map(cl =>
        cl.id === activeChecklist.id ? { ...cl, items: updatedItems } : cl
      ));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const getSeasonDueDate = (season: string): string => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let targetDate: Date;

    switch (season) {
      case 'Spring':
        // Set to March 1st of current or next year
        targetDate = new Date(currentYear, 2, 1); // March 1st
        if (targetDate < today) {
          targetDate = new Date(currentYear + 1, 2, 1);
        }
        break;
      case 'Summer':
        // Set to June 1st
        targetDate = new Date(currentYear, 5, 1); // June 1st
        if (targetDate < today) {
          targetDate = new Date(currentYear + 1, 5, 1);
        }
        break;
      case 'Fall':
        // Set to September 1st
        targetDate = new Date(currentYear, 8, 1); // September 1st
        if (targetDate < today) {
          targetDate = new Date(currentYear + 1, 8, 1);
        }
        break;
      case 'Winter':
        // Set to December 1st
        targetDate = new Date(currentYear, 11, 1); // December 1st
        if (targetDate < today) {
          targetDate = new Date(currentYear + 1, 11, 1);
        }
        break;
      default:
        targetDate = today;
    }

    return targetDate.toISOString().split('T')[0];
  };

  const addTaskToPlanned = async (item: ChecklistItem) => {
    if (!onAddPlannedTask || !activeChecklist) return;

    setAddingToPlanned(item.id);
    try {
      const plannedTask: Omit<PlannedTask, 'id'> = {
        propertyId,
        title: item.title,
        dueDate: getSeasonDueDate(activeChecklist.season),
        priority: 'Medium',
        estimatedCost: '',
        status: 'pending'
      };
      await onAddPlannedTask(plannedTask);
      setError(null);
    } catch (err) {
      console.error('Error adding to planned tasks:', err);
      setError('Failed to add task to planned list');
    } finally {
      setAddingToPlanned(null);
    }
  };

  const completedCount = activeChecklist?.items.filter(i => i.completed).length || 0;
  const totalCount = activeChecklist?.items.length || 0;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('checklist.title')}</h3>
        <p className="text-gray-600 mb-4">
          {t('checklist.subtitle')}
        </p>
        <button
          onClick={initializeChecklists}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('checklist.initialize')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checklist.title')}</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['Spring', 'Summer', 'Fall', 'Winter'] as const).map(season => (
          <button
            key={season}
            onClick={() => setActiveTab(season)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === season
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t(`checklist.${season}`)}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      {activeChecklist && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('checklist.progress')}</span>
            <span className="text-sm text-gray-600">
              {completedCount} {t('plan.of')} {totalCount} {t('checklist.completed')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{completionPercent}% complete</p>
        </div>
      )}

      {/* Checklist Items */}
      {activeChecklist && (
        <div className="space-y-2 mb-6">
          {activeChecklist.items.length > 0 ? (
            activeChecklist.items.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <button
                  onClick={() => toggleItemCompletion(item)}
                  className="flex-shrink-0 mt-1"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    item.completed ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {item.title}
                </span>
                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {onAddPlannedTask && (
                    <button
                      onClick={() => addTaskToPlanned(item)}
                      disabled={addingToPlanned === item.id}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-50"
                      title={t('checklist.add_to_planned')}
                    >
                      {addingToPlanned === item.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">{t('plan.no_tasks')}</p>
          )}
        </div>
      )}

      {/* Add New Item Form */}
      {activeChecklist && (
        <form onSubmit={addNewItem} className="flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder={t('checklist.add_task')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('checklist.add_button')}</span>
          </button>
        </form>
      )}

      {/* Season Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">{t('plan.ai.desc').split(' ')[0]}:</span> {t('checklist.tip')} {t(`checklist.${activeTab.toLowerCase()}`)} {t('checklist.tip_to')}
        </p>
      </div>
    </div>
  );
};

export default SeasonalChecklists;
