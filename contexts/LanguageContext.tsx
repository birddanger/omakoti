import React, { createContext, useState, useContext, useEffect } from 'react';

type Language = 'en' | 'fi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & General
  'nav.dashboard': { en: 'Dashboard', fi: 'Kojelauta' },
  'nav.properties': { en: 'Properties', fi: 'Kiinteistöt' },
  'nav.logs': { en: 'Maintenance Logs', fi: 'Huoltokirja' },
  'nav.files': { en: 'Files', fi: 'Tiedostot' },
  'nav.logout': { en: 'Log Out', fi: 'Kirjaudu ulos' },
  'app.welcome': { en: 'Welcome Back', fi: 'Tervetuloa takaisin' },
  'app.create_account': { en: 'Create Account', fi: 'Luo tili' },
  'app.signin_desc': { en: 'Sign in to manage your properties', fi: 'Kirjaudu hallinnoidaksesi kiinteistöjä' },
  'app.register_desc': { en: 'Start tracking your property maintenance today', fi: 'Aloita kiinteistöhuollon seuranta tänään' },

  // Auth
  'auth.email': { en: 'Email Address', fi: 'Sähköpostiosoite' },
  'auth.password': { en: 'Password', fi: 'Salasana' },
  'auth.fullname': { en: 'Full Name', fi: 'Koko nimi' },
  'auth.signin': { en: 'Sign In', fi: 'Kirjaudu sisään' },
  'auth.register': { en: 'Create Account', fi: 'Rekisteröidy' },
  'auth.have_account': { en: 'Already have an account?', fi: 'Onko sinulla jo tili?' },
  'auth.no_account': { en: "Don't have an account?", fi: 'Eikö sinulla ole tiliä?' },

  // Dashboard
  'dash.title': { en: 'Dashboard', fi: 'Yhteenveto' },
  'dash.subtitle': { en: 'Overview of your properties and maintenance status.', fi: 'Katsaus kiinteistöihisi ja huoltotilanteeseen.' },
  'dash.total_properties': { en: 'Total Properties', fi: 'Kiinteistöjä yhteensä' },
  'dash.total_spend': { en: 'Total Maintenance Spend', fi: 'Huoltokustannukset yht.' },
  'dash.tasks': { en: 'Maintenance Tasks', fi: 'Huoltotoimenpiteet' },
  'dash.recent_activity': { en: 'Recent Activity', fi: 'Viimeisimmät tapahtumat' },
  'dash.upcoming_tasks': { en: 'Upcoming Tasks', fi: 'Tulevat tehtävät' },
  'dash.spend_category': { en: 'Spend by Category', fi: 'Kulut kategorioittain' },
  'dash.no_activity': { en: 'No recent activity found.', fi: 'Ei viimeaikaista toimintaa.' },
  'dash.no_upcoming': { en: 'No upcoming tasks planned.', fi: 'Ei tulevia tehtäviä suunniteltu.' },
  'dash.view_history': { en: 'View all history', fi: 'Katso koko historia' },
  'dash.add_property': { en: 'Add Property', fi: 'Lisää kiinteistö' },

  // Properties
  'prop.built': { en: 'Built', fi: 'Rakennusvuosi' },
  'prop.view_details': { en: 'View Details', fi: 'Katso tiedot' },
  'prop.search_placeholder': { en: 'Search properties...', fi: 'Hae kiinteistöjä...' },
  'prop.no_match': { en: 'No properties found matching your search.', fi: 'Haku ei tuottanut tuloksia.' },
  'prop.no_props': { en: "You haven't added any properties yet.", fi: 'Et ole vielä lisännyt kiinteistöjä.' },
  
  // Property Details
  'detail.tabs.history': { en: 'Maintenance History', fi: 'Huoltohistoria' },
  'detail.tabs.planning': { en: 'Planning', fi: 'Suunnittelu' },
  'detail.recorded_maint': { en: 'Recorded Maintenance', fi: 'Kirjatut huollot' },
  'detail.log_activity': { en: 'Log Activity', fi: 'Lisää merkintä' },
  'detail.no_logs': { en: 'No maintenance records found for this property.', fi: 'Ei huoltomerkintöjä tälle kiinteistölle.' },
  
  // Planning / AI
  'plan.current_tasks': { en: 'Planned Tasks', fi: 'Suunnitellut tehtävät' },
  'plan.add_custom': { en: 'Add Custom Task', fi: 'Lisää oma tehtävä' },
  'plan.no_tasks': { en: 'No tasks planned yet.', fi: 'Ei suunniteltuja tehtäviä.' },
  'plan.of': { en: 'of', fi: 'kpl' },
  'plan.ai.title': { en: 'Predictive Maintenance Suggestions', fi: 'Ennakoivat huoltoehdotukset' },
  'plan.ai.desc': { en: 'Let AI analyze your property details and history to suggest upcoming essential maintenance tasks.', fi: 'Anna tekoälyn analysoida kiinteistösi tiedot ja historia ehdottaakseen tulevia huoltotoimenpiteitä.' },
  'plan.ai.generate': { en: 'Generate Suggestions', fi: 'Luo ehdotukset' },
  'plan.ai.regenerate': { en: 'Refresh Suggestions', fi: 'Päivitä ehdotukset' },
  'plan.ai.analyzing': { en: 'Analyzing property data...', fi: 'Analysoidaan tietoja...' },
  'plan.ai.recommended': { en: 'Suggested Actions', fi: 'Ehdotetut toimenpiteet' },
  'plan.ai.accept': { en: 'Add to Plan', fi: 'Lisää suunnitelmaan' },
  'plan.due_date': { en: 'Due Date', fi: 'Eräpäivä' },
  'plan.priority': { en: 'Priority', fi: 'Prioriteetti' },

  // Logs
  'logs.export_csv': { en: 'Export CSV', fi: 'Vie CSV' },

  // Forms (Add/Edit)
  'form.prop_name': { en: 'Property Name', fi: 'Kiinteistön nimi' },
  'form.address': { en: 'Address', fi: 'Osoite' },
  'form.type': { en: 'Type', fi: 'Tyyppi' },
  'form.year': { en: 'Year Built', fi: 'Rakennusvuosi' },
  'form.size': { en: 'Size (m²)', fi: 'Pinta-ala (m²)' },
  'form.floors': { en: 'Floors', fi: 'Kerrokset' },
  'form.heating': { en: 'Heating Type', fi: 'Lämmitysmuoto' },
  'form.cancel': { en: 'Cancel', fi: 'Peruuta' },
  'form.add': { en: 'Add', fi: 'Lisää' },
  'form.save': { en: 'Save Record', fi: 'Tallenna' },
  'form.update': { en: 'Update Record', fi: 'Päivitä' },
  'form.title': { en: 'Title', fi: 'Otsikko' },
  'form.date': { en: 'Date', fi: 'Päivämäärä' },
  'form.cost': { en: 'Cost ($)', fi: 'Hinta (€)' }, 
  'form.estimated_cost': { en: 'Est. Cost', fi: 'Arvioitu hinta' },
  'form.category': { en: 'Category', fi: 'Kategoria' },
  'form.provider': { en: 'Provider (Optional)', fi: 'Palveluntarjoaja (Valinnainen)' },
  'form.notes': { en: 'Notes', fi: 'Muistiinpanot' },
  'form.attachments': { en: 'Attachments (Receipts, Photos)', fi: 'Liitteet (Kuitit, Kuvat)' },
  'form.upload_text': { en: 'Click to upload new files', fi: 'Klikkaa ladataksesi tiedostoja' },
  'form.current_attachments': { en: 'Current Attachments:', fi: 'Nykyiset liitteet:' },

  // Files
  'files.title': { en: 'Documents & Files', fi: 'Asiakirjat ja tiedostot' },
  'files.subtitle': { en: 'Manage receipts, manuals, and photos.', fi: 'Hallitse kuitteja, ohjekirjoja ja kuvia.' },
  'files.search': { en: 'Search by filename or task...', fi: 'Hae tiedoston tai tehtävän nimellä...' },
  'files.all_props': { en: 'All Properties', fi: 'Kaikki kiinteistöt' },
  'files.col.name': { en: 'File Name', fi: 'Tiedostonimi' },
  'files.col.prop': { en: 'Property', fi: 'Kiinteistö' },
  'files.col.task': { en: 'Related Task', fi: 'Liittyvä tehtävä' },
  'files.col.date': { en: 'Date', fi: 'Pvm' },
  'files.col.size': { en: 'Size', fi: 'Koko' },
  'files.col.action': { en: 'Action', fi: 'Toiminto' },
  'files.no_files': { en: 'No files found matching your criteria.', fi: 'Hakuehtoja vastaavia tiedostoja ei löytynyt.' },

  // Annual Clock
  'clock.title': { en: 'Annual Cycle', fi: 'Vuosikello' },
  'clock.subtitle': { en: 'Seasonal maintenance guide', fi: 'Kausittainen huolto-opas' },
  'clock.hover': { en: 'Hover over the chart to view other seasons.', fi: 'Vie hiiri kaavion päälle nähdäksesi muut vuodenajat.' },
  
  // Seasons
  'season.Spring': { en: 'Spring', fi: 'Kevät' },
  'season.Summer': { en: 'Summer', fi: 'Kesä' },
  'season.Autumn': { en: 'Autumn', fi: 'Syksy' },
  'season.Winter': { en: 'Winter', fi: 'Talvi' },

  // Property Types (Enums)
  'Single Family Home': { en: 'Single Family Home', fi: 'Omakotitalo' },
  'Condo': { en: 'Condo', fi: 'Kerrostaloasunto' },
  'Townhouse': { en: 'Townhouse', fi: 'Rivitalo' },
  'Multi-Family': { en: 'Multi-Family', fi: 'Paritalo/Pienkerrostalo' },
  'Commercial': { en: 'Commercial', fi: 'Liiketila' },

  // Heating Types
  'District Heating': { en: 'District Heating', fi: 'Kaukolämpö' },
  'Electric': { en: 'Electric', fi: 'Sähkölämmitys' },
  'Heat Pump': { en: 'Heat Pump', fi: 'Lämpöpumppu' },
  'Oil': { en: 'Oil', fi: 'Öljylämmitys' },
  'Gas': { en: 'Gas', fi: 'Kaasu' },
  'Wood': { en: 'Wood', fi: 'Puu' },
  'Solar': { en: 'Solar', fi: 'Aurinkoenergia' },
  'None': { en: 'None', fi: 'Ei lämmitystä' },

  // Categories
  'Plumbing': { en: 'Plumbing', fi: 'Putkityöt' },
  'Electrical': { en: 'Electrical', fi: 'Sähkötyöt' },
  'HVAC': { en: 'HVAC', fi: 'LVI' },
  'Roofing': { en: 'Roofing', fi: 'Katto' },
  'Landscaping': { en: 'Landscaping', fi: 'Piha' },
  'General': { en: 'General', fi: 'Yleinen' },
  'Appliance': { en: 'Appliance', fi: 'Kodinkoneet' },

  // Appliances
  'appliances.title': { en: 'Home Appliances', fi: 'Kodinkoneet' },
  'appliances.add': { en: 'Add Appliance', fi: 'Lisää koneisto' },
  'appliances.type': { en: 'Type', fi: 'Tyyppi' },
  'appliances.model': { en: 'Model Number', fi: 'Mallinumero' },
  'appliances.year': { en: 'Year Installed', fi: 'Asennusvuosi' },
  'appliances.month': { en: 'Month', fi: 'Kuukausi' },
  'appliances.no_appliances': { en: 'No appliances registered yet.', fi: 'Ei rekisteröityjä koneistoja.' },
  'appliances.form_title': { en: 'Add New Appliance', fi: 'Lisää uusi koneisto' },
  'appliances.delete_confirm': { en: 'Delete this appliance?', fi: 'Poista tämä koneisto?' },

  // Seasonal Checklists
  'checklist.title': { en: 'Seasonal Maintenance Checklists', fi: 'Kausittaiset huoltolistat' },
  'checklist.subtitle': { en: 'Get started with seasonal maintenance checklists to keep your property in great condition throughout the year.', fi: 'Aloita kausittaisilla huoltolistoilla pitääksesi kiinteistösi hyvässä kunnossa ympäri vuoden.' },
  'checklist.initialize': { en: 'Initialize Checklists', fi: 'Alusta listat' },
  'checklist.progress': { en: 'Progress', fi: 'Edistyminen' },
  'checklist.completed': { en: 'completed', fi: 'valmis' },
  'checklist.add_task': { en: 'Add a new maintenance task...', fi: 'Lisää uusi huoltotehtävä...' },
  'checklist.add_button': { en: 'Add', fi: 'Lisää' },
  'checklist.add_to_planned': { en: 'Add to planned tasks', fi: 'Lisää suunniteltuihin tehtäviin' },
  'checklist.tip': { en: 'Tip: Complete these tasks during', fi: 'Vihje: Suorita nämä tehtävät' },
  'checklist.tip_to': { en: 'to keep your property well-maintained throughout the year.', fi: 'pitääksesi kiinteistösi hyvin ylläpidettynä ympäri vuoden.' },
  'checklist.spring': { en: 'spring', fi: 'keväällä' },
  'checklist.summer': { en: 'summer', fi: 'kesällä' },
  'checklist.fall': { en: 'fall', fi: 'syksyllä' },
  'checklist.winter': { en: 'winter', fi: 'talvella' },
  'checklist.Spring': { en: 'Spring', fi: 'Kevät' },
  'checklist.Summer': { en: 'Summer', fi: 'Kesä' },
  'checklist.Fall': { en: 'Fall', fi: 'Syksy' },
  'checklist.Winter': { en: 'Winter', fi: 'Talvi' },

  // Months
  'month.January': { en: 'January', fi: 'Tammikuu' },
  'month.February': { en: 'February', fi: 'Helmikuu' },
  'month.March': { en: 'March', fi: 'Maaliskuu' },
  'month.April': { en: 'April', fi: 'Huhtikuu' },
  'month.May': { en: 'May', fi: 'Toukokuu' },
  'month.June': { en: 'June', fi: 'Kesäkuu' },
  'month.July': { en: 'July', fi: 'Heinäkuu' },
  'month.August': { en: 'August', fi: 'Elokuu' },
  'month.September': { en: 'September', fi: 'Syyskuu' },
  'month.October': { en: 'October', fi: 'Lokakuu' },
  'month.November': { en: 'November', fi: 'Marraskuu' },
  'month.December': { en: 'December', fi: 'Joulukuu' },

  // Priority
  'priority.High': { en: 'High', fi: 'Korkea' },
  'priority.Medium': { en: 'Medium', fi: 'Keskitaso' },
  'priority.Low': { en: 'Low', fi: 'Matala' },

  // Task Status
  'status.pending': { en: 'Pending', fi: 'Odottava' },
  'status.completed': { en: 'Completed', fi: 'Valmis' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pm_language');
    return (saved === 'en' || saved === 'fi') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('pm_language', language);
  }, [language]);

  const t = (key: string): string => {
    // If exact key exists
    if (translations[key]) {
      return translations[key][language];
    }
    // Fallback for dynamic keys (like Enums) if explicitly added to dictionary
    if (translations[key]) {
        return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
