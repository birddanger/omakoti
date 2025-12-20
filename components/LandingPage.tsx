import React from 'react';
import { Link } from 'react-router-dom';
import { Hammer, CheckCircle, TrendingDown, FileText, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Hammer className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">PropMaint</span>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSelector />
            <div className="space-x-4">
              <Link to="/login" className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium">
                {t('auth.signin')}
              </Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            {t('landing.title')}<br />
            <span className="text-blue-600">{t('landing.subtitle')}</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg">
              {t('landing.get_started')}
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg">
              {t('landing.sign_in')}
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4">
              <Hammer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('landing.feature_track')}</h3>
            <p className="text-slate-600">
              {t('landing.feature_track_desc')}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600 mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('landing.feature_plan')}</h3>
            <p className="text-slate-600">
              {t('landing.feature_plan_desc')}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('landing.feature_organize')}</h3>
            <p className="text-slate-600">
              {t('landing.feature_organize_desc')}
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 text-orange-600 mb-4">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('landing.feature_insights')}</h3>
            <p className="text-slate-600">
              {t('landing.feature_insights_desc')}
            </p>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Choose PropMaint?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Easy to Use</h4>
                <p className="text-slate-600">Intuitive interface designed for property owners. No technical skills required.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Increase Property Value</h4>
                <p className="text-slate-600">Well-documented maintenance increases property value and buyer confidence.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Always Available</h4>
                <p className="text-slate-600">Access your property records anytime, anywhere from any device.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Plan Ahead</h4>
                <p className="text-slate-600">AI-powered suggestions help you plan maintenance before problems occur.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Smart Analytics</h4>
                <p className="text-slate-600">Understand spending patterns and identify areas for improvement.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Secure & Private</h4>
                <p className="text-slate-600">Your property data is encrypted and secured. Only you can access it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join property owners who are managing their properties more efficiently.
          </p>
          <Link to="/register" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg shadow-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 PropMaint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
