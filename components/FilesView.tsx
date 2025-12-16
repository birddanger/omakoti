import React, { useState, useMemo } from 'react';
import { AppDocument, Property, MaintenanceLog } from '../types';
import { FileText, Image as ImageIcon, Download, Search, File, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FilesViewProps {
  documents: AppDocument[];
  properties: Property[];
  logs: MaintenanceLog[];
}

interface FileViewModel extends AppDocument {
  propertyName: string;
  taskTitle: string;
}

const FilesView: React.FC<FilesViewProps> = ({ documents, properties, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileViewModel; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const { t } = useLanguage();

  // 1. Map documents to include derived data for sorting/display
  const mappedDocs: FileViewModel[] = useMemo(() => {
    return documents.map(doc => {
      const property = properties.find(p => p.id === doc.propertyId);
      const log = logs.find(l => l.id === doc.logId);
      return {
        ...doc,
        propertyName: property ? property.name : 'Unknown Property',
        taskTitle: log ? log.title : 'General / Unlinked'
      };
    });
  }, [documents, properties, logs]);

  // 2. Filter data
  const filteredDocs = useMemo(() => {
    return mappedDocs.filter(doc => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProperty = filterPropertyId === 'all' || doc.propertyId === filterPropertyId;
      return matchesSearch && matchesProperty;
    });
  }, [mappedDocs, searchTerm, filterPropertyId]);

  // 3. Sort data
  const sortedDocs = useMemo(() => {
    const sorted = [...filteredDocs];
    sorted.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Handle nulls if necessary (though our mapped data is safe strings mostly)
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDocs, sortConfig]);

  const handleSort = (key: keyof FileViewModel) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof FileViewModel) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('files.title')}</h2>
          <p className="text-slate-500">{t('files.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={t('files.search')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPropertyId}
          onChange={(e) => setFilterPropertyId(e.target.value)}
        >
          <option value="all">{t('files.all_props')}</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    {t('files.col.name')}
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('propertyName')}
                >
                  <div className="flex items-center">
                    {t('files.col.prop')}
                    {getSortIcon('propertyName')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('taskTitle')}
                >
                  <div className="flex items-center">
                    {t('files.col.task')}
                    {getSortIcon('taskTitle')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    {t('files.col.date')}
                    {getSortIcon('date')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center">
                    {t('files.col.size')}
                    {getSortIcon('size')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('files.col.action')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <File className="w-10 h-10 text-slate-300 mb-2" />
                      <p>{t('files.no_files')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
                          {doc.type.startsWith('image/') ? (
                             <img src={doc.data} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                             getFileIcon(doc.type)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]" title={doc.name}>
                            {doc.name}
                          </div>
                          <div className="text-xs text-slate-500">{doc.type.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{doc.propertyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.taskTitle === 'General / Unlinked' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {doc.taskTitle}
                        </span>
                      ) : (
                        <span className="text-sm text-blue-600 font-medium">
                          {doc.taskTitle}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {new Date(doc.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={doc.data} 
                        download={doc.name}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="Download File"
                      >
                        <Download className="w-4 h-4" />
                        <span className="ml-1 sr-only">Download</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FilesView;