import React, { useMemo } from 'react';
import { Property, MaintenanceLog, PlannedTask } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building, DollarSign, AlertCircle, Plus, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnnualMaintenanceClock from './AnnualMaintenanceClock';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  properties: Property[];
  logs: MaintenanceLog[];
  plannedTasks: PlannedTask[];
}

const Dashboard: React.FC<DashboardProps> = ({ properties, logs, plannedTasks }) => {
  const { t } = useLanguage();
  const totalSpend = useMemo(() => logs.reduce((acc, log) => acc + log.cost, 0), [logs]);
  
  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [logs]);

  const upcomingTasks = useMemo(() => {
    return [...plannedTasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [plannedTasks]);

  const spendByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    logs.forEach(log => {
      data[log.category] = (data[log.category] || 0) + log.cost;
    });
    // Translate category names in the chart
    return Object.entries(data).map(([name, value]) => ({ name: t(name), value }));
  }, [logs, t]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('dash.title')}</h2>
          <p className="text-slate-500">{t('dash.subtitle')}</p>
        </div>
        <Link to="/properties" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          {t('dash.add_property')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dash.total_properties')}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{properties.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dash.total_spend')}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">${totalSpend.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dash.tasks')}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{logs.length}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Tasks Section (New) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dash.upcoming_tasks')}</h3>
          <div className="space-y-4 flex-1">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => {
                 const propName = properties.find(p => p.id === task.propertyId)?.name || 'Property';
                 return (
                  <div key={task.id} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{propName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                         {task.dueDate}
                       </span>
                    </div>
                  </div>
                 );
              })
            ) : (
              <div className="text-slate-400 text-sm flex flex-col items-center justify-center h-24">
                 <Calendar className="w-6 h-6 mb-2 opacity-50" />
                 {t('dash.no_upcoming')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dash.recent_activity')}</h3>
          <div className="space-y-4 flex-1">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.title}</p>
                    <p className="text-xs text-slate-500">{log.date} • ${log.cost.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">{t('dash.no_activity')}</div>
            )}
          </div>
          {logs.length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-100">
                <Link to="/logs" className="text-sm text-blue-600 font-medium hover:text-blue-700">{t('dash.view_history')} &rarr;</Link>
             </div>
          )}
        </div>

        {/* Annual Clock Visualization */}
        <div className="col-span-1 lg:col-span-1">
          <AnnualMaintenanceClock />
        </div>

        {/* Spend Chart */}
        <div className="col-span-1 lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dash.spend_category')}</h3>
          <div className="h-64">
            {spendByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {spendByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No spending data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;