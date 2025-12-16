import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { CloudSnow, Sun, CloudRain, Leaf, Info, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

const AnnualMaintenanceClock: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t, language } = useLanguage();

  const seasonsData = useMemo(() => {
    // English tasks
    const enTasks = {
      spring: ['Inspect Roof & Gutters', 'Service A/C System', 'Check Drainage', 'Fertilize Lawn', 'Inspect Windows/Screens'],
      summer: ['Landscaping & Pruning', 'Exterior Paint Touch-up', 'Deck/Patio Maintenance', 'Pest Control Check', 'Flush Water Heater'],
      autumn: ['Service Heating System', 'Clear Gutters & Downspouts', 'Rake Leaves', 'Winterize Outdoor Spigots', 'Check Weatherstripping'],
      winter: ['Check Insulation', 'Protect Pipes from Freezing', 'Test Smoke/CO Detectors', 'Deep Clean Interior', 'Inspect Basement for Leaks']
    };

    // Finnish tasks
    const fiTasks = {
      spring: ['Tarkista katto ja rännit', 'Huolla ilmastointi', 'Tarkista salaojat', 'Lannoita nurmikko', 'Tarkista ikkunat ja hyttysverkot'],
      summer: ['Pihan hoito ja leikkaus', 'Ulkomaalauksen paikkus', 'Terassin huolto', 'Tuholaistorjunta', 'Lämminvesivaraajan huuhtelu'],
      autumn: ['Huolla lämmitysjärjestelmä', 'Puhdista rännit', 'Haravoi lehdet', 'Tyhjennä ulkohanat', 'Tarkista tiivisteet'],
      winter: ['Tarkista eristykset', 'Suojaa putket jäätymiseltä', 'Testaa palovaroittimet', 'Sisätilojen suursiivous', 'Tarkista kellari vuodoilta']
    };

    const tasks = language === 'fi' ? fiTasks : enTasks;

    return [
      { 
        name: t('season.Spring'), 
        months: 'Mar - May', 
        color: '#4ade80', 
        icon: <Leaf className="w-6 h-6 text-green-600" />,
        tasks: tasks.spring,
        value: 1
      },
      { 
        name: t('season.Summer'), 
        months: 'Jun - Aug', 
        color: '#facc15', 
        icon: <Sun className="w-6 h-6 text-yellow-600" />,
        tasks: tasks.summer,
        value: 1
      },
      { 
        name: t('season.Autumn'), 
        months: 'Sep - Nov', 
        color: '#fb923c', 
        icon: <CloudRain className="w-6 h-6 text-orange-600" />,
        tasks: tasks.autumn,
        value: 1
      },
      { 
        name: t('season.Winter'), 
        months: 'Dec - Feb', 
        color: '#60a5fa', 
        icon: <CloudSnow className="w-6 h-6 text-blue-600" />,
        tasks: tasks.winter,
        value: 1
      },
    ];
  }, [language, t]);

  useEffect(() => {
    const month = new Date().getMonth(); // 0-11
    
    if (month >= 2 && month <= 4) setActiveIndex(0);
    else if (month >= 5 && month <= 7) setActiveIndex(1);
    else if (month >= 8 && month <= 10) setActiveIndex(2);
    else setActiveIndex(3);
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const activeSeason = seasonsData[activeIndex];

  // Cast Pie to any to bypass TypeScript error regarding missing activeIndex in some Recharts type definitions
  const PieComponent = Pie as any;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{t('clock.title')}</h3>
          <p className="text-sm text-slate-500">{t('clock.subtitle')}</p>
        </div>
        <div className="p-2 bg-slate-100 rounded-lg">
          <Calendar className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
        {/* Chart */}
        <div className="w-full md:w-1/2 h-64 relative">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <PieComponent
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={seasonsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                onMouseEnter={onPieEnter}
                paddingAngle={2}
              >
                {seasonsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </PieComponent>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="transform transition-all duration-300">
              {activeSeason.icon}
            </div>
            <p className="text-sm font-bold text-slate-700 mt-1">{activeSeason.name}</p>
          </div>
        </div>

        {/* Details List */}
        <div className="w-full md:w-1/2 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-lg flex items-center">
                 <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: activeSeason.color }}></span>
                 {activeSeason.name}
              </h4>
              <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                {activeSeason.months}
              </span>
            </div>
          </div>
          <ul className="space-y-2">
            {activeSeason.tasks.map((task, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                <Info className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0 mt-0.5" />
                {task}
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <p className="text-xs text-slate-400 italic">{t('clock.hover')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualMaintenanceClock;