import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Loader, AlertCircle } from 'lucide-react';
import { SeasonalChecklist, ChecklistItem } from '../types';
import { checklistsService } from '../services/checklistsService';

interface SeasonalChecklistsProps {
  propertyId: string;
}

export const SeasonalChecklists: React.FC<SeasonalChecklistsProps> = ({ propertyId }) => {
  const [checklists, setChecklists] = useState<SeasonalChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Spring' | 'Summer' | 'Fall' | 'Winter'>('Spring');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [initialized, setInitialized] = useState(false);

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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Seasonal Maintenance Checklists</h3>
        <p className="text-gray-600 mb-4">
          Get started with seasonal maintenance checklists to keep your property in great condition throughout the year.
        </p>
        <button
          onClick={initializeChecklists}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Initialize Checklists
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Maintenance Checklists</h3>

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
            {season}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      {activeChecklist && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {completedCount} of {totalCount} completed
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
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No items in this checklist</p>
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
            placeholder="Add a new maintenance task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>
      )}

      {/* Season Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Tip:</span> Complete these tasks during {activeTab.toLowerCase()} to keep your property
          well-maintained throughout the year.
        </p>
      </div>
    </div>
  );
};

export default SeasonalChecklists;
