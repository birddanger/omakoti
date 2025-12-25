import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Clock, AlertCircle } from 'lucide-react';
import recurringTasksService, { RecurringTask } from '../services/recurringTasksService';
import { useLanguage } from '../contexts/LanguageContext';

interface RecurringTasksManagementProps {
  propertyId: string;
  onTaskCreated?: () => void;
}

const RecurringTasksManagement: React.FC<RecurringTasksManagementProps> = ({
  propertyId,
  onTaskCreated
}) => {
  const { translations } = useLanguage();
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'monthly',
    priority: 'Medium',
    estimatedCost: '',
    category: 'General'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [propertyId]);

  const loadTasks = async () => {
    try {
      const data = await recurringTasksService.getByProperty(propertyId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  };

  const handleAddTask = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      frequency: 'monthly',
      priority: 'Medium',
      estimatedCost: '',
      category: 'General'
    });
    setError('');
  };

  const handleEditTask = (task: RecurringTask) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      frequency: task.frequency,
      priority: task.priority,
      estimatedCost: task.estimatedCost || '',
      category: task.category
    });
    setShowForm(true);
    setError('');
  };

  const handleSaveTask = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.title) {
        setError(translations.titleRequired || 'Title is required');
        setLoading(false);
        return;
      }

      if (editingId) {
        // Update existing task
        const updated = await recurringTasksService.update(editingId, {
          propertyId,
          ...formData
        });
        setTasks(tasks.map(t => t.id === editingId ? updated : t));
      } else {
        // Create new task
        const { recurringTask } = await recurringTasksService.create({
          propertyId,
          ...formData
        });
        setTasks([...tasks, recurringTask]);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        frequency: 'monthly',
        priority: 'Medium',
        estimatedCost: '',
        category: 'General'
      });

      onTaskCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      await recurringTasksService.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (frequency: string): string => {
    const labels: { [key: string]: string } = {
      weekly: translations.weekly || 'Weekly',
      biweekly: translations.biweekly || 'Bi-weekly',
      monthly: translations.monthly || 'Monthly',
      quarterly: translations.quarterly || 'Quarterly',
      biannual: translations.biannual || 'Bi-annual',
      annual: translations.annual || 'Annual'
    };
    return labels[frequency] || frequency;
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (dueDate: string): boolean => {
    return getDaysUntilDue(dueDate) < 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {translations.recurringMaintenance || 'Recurring Maintenance'}
        </h3>
        {!showForm && (
          <button
            onClick={handleAddTask}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            {translations.addRecurringTask || 'Add Task'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
          <h4 className="font-medium text-gray-900">
            {editingId ? (translations.editTask || 'Edit Task') : (translations.createTask || 'Create Task')}
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.title || 'Title'} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={translations.taskTitle || 'Task title'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.description || 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder={translations.taskDescription || 'Task description'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.frequency || 'Frequency'} *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="weekly">{translations.weekly || 'Weekly'}</option>
                <option value="biweekly">{translations.biweekly || 'Bi-weekly'}</option>
                <option value="monthly">{translations.monthly || 'Monthly'}</option>
                <option value="quarterly">{translations.quarterly || 'Quarterly'}</option>
                <option value="biannual">{translations.biannual || 'Bi-annual'}</option>
                <option value="annual">{translations.annual || 'Annual'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.priority || 'Priority'}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Low">{translations.low || 'Low'}</option>
                <option value="Medium">{translations.medium || 'Medium'}</option>
                <option value="High">{translations.high || 'High'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.estimatedCost || 'Estimated Cost'}
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.category || 'Category'}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="General">{translations.general || 'General'}</option>
                <option value="Plumbing">{translations.plumbing || 'Plumbing'}</option>
                <option value="Electrical">{translations.electrical || 'Electrical'}</option>
                <option value="HVAC">{translations.hvac || 'HVAC'}</option>
                <option value="Roofing">{translations.roofing || 'Roofing'}</option>
                <option value="Landscaping">{translations.landscaping || 'Landscaping'}</option>
                <option value="Appliance">{translations.appliance || 'Appliance'}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveTask}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? (translations.saving || 'Saving...') : (translations.save || 'Save')}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              {translations.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-600 text-center py-4">
            {translations.noRecurringTasks || 'No recurring tasks'}
          </p>
        ) : (
          tasks.map(task => {
            const daysUntil = getDaysUntilDue(task.nextDueDate);
            const overdue = isOverdue(task.nextDueDate);

            return (
              <div
                key={task.id}
                className={`border rounded-lg p-3 ${
                  overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        {getFrequencyLabel(task.frequency)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-gray-600">{task.category}</span>
                    </div>
                    <div className={`flex items-center mt-2 text-sm ${overdue ? 'text-red-700' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {overdue ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {translations.overdue || 'Overdue'}: {new Date(task.nextDueDate).toLocaleDateString()}
                        </>
                      ) : (
                        `${translations.nextDue || 'Next due'}: ${new Date(task.nextDueDate).toLocaleDateString()} (${daysUntil} ${translations.days || 'days'})`
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title={translations.edit || 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title={translations.delete || 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecurringTasksManagement;
