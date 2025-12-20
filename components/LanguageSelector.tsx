import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'fi')}
        className="bg-white border border-slate-300 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value="en">English</option>
        <option value="fi">Suomi</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
