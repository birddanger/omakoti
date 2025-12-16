import React from 'react';
import { Property, PropertyType } from '../types';
import { MapPin, Calendar, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="h-32 bg-slate-100 relative">
        <img 
          src={`https://picsum.photos/seed/${property.id}/600/300`} 
          alt={property.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700">
          {t(property.type)}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{property.name}</h3>
        <div className="flex items-center text-slate-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{property.address}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-slate-600">
             <Calendar className="w-4 h-4 mr-2 text-slate-400" />
             {t('prop.built')} {property.yearBuilt}
          </div>
          <div className="flex items-center text-slate-600">
             <Home className="w-4 h-4 mr-2 text-slate-400" />
             {property.area.toLocaleString()} m²
          </div>
        </div>

        <Link 
          to={`/properties/${property.id}`} 
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          {t('prop.view_details')}
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;