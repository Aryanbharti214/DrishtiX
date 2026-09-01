import React, { useState, useRef, useEffect } from 'react';
import { Search, X, AlertCircle, CheckCircle2, Navigation, Image } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../services/translations';

export default function SearchBar({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);
  const { isDarkMode, language } = useSettings();

  const t = (keyPath) => getTranslation(language, keyPath);

  
  const searchableItems = [
    { id: 1, title: t('nav.dashboard'), page: 'dashboard', category: 'Navigation', icon: 'gauge' },
    { id: 2, title: t('nav.map'), page: 'map', category: 'Navigation', icon: 'map' },
    { id: 3, title: t('nav.findings'), page: 'findings', category: 'Navigation', icon: 'alert' },
    { id: 4, title: t('nav.imagery'), page: 'imagery', category: 'Media', icon: 'image' },
    { id: 8, title: 'Damaged Structures', page: 'dashboard', category: 'Statistics', highlight: 'damagedBuildings' },
    { id: 9, title: 'Blocked Supply Routes', page: 'dashboard', category: 'Statistics', highlight: 'blockedRoutes' },
    { id: 10, title: 'Pending Verification', page: 'dashboard', category: 'Statistics', highlight: 'pendingVerification' },
    { id: 11, title: 'Drone Images', page: 'dashboard', category: 'Statistics', highlight: 'totalImages' },
  ];

  
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = searchableItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered.slice(0, 8));
  }, [query]);

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleSelect = (item) => {
    onNavigate(item.page);
    setQuery('');
    setIsOpen(false);
  };

  const getResultIcon = (item) => {
    switch (item.category) {
      case 'Navigation':
        return <Navigation className="w-4 h-4" />;
      case 'Reports':
        return <AlertCircle className="w-4 h-4" />;
      case 'Data':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Media':
        return <Image className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-slate-400" : "text-slate-700"}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('header.searchPlaceholder')}
          className={`w-full rounded-lg border py-2 pl-10 pr-10 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-600 ${isDarkMode ? "border-slate-700/60 bg-slate-800/50 text-slate-100 placeholder-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder-slate-500 hover:bg-slate-50"}`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-900"}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      
      {isOpen && query && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg z-[9999] overflow-hidden border ${isDarkMode ? "bg-slate-900 border-slate-700 shadow-xl" : "bg-white border-slate-200 shadow-lg shadow-slate-200/70"}`}>
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              
              {['Navigation', 'Statistics', 'Reports', 'Data', 'Media'].map((category) => {
                const categoryItems = results.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? "text-slate-400 bg-slate-800 border-slate-700" : "text-slate-600 bg-slate-50 border-slate-200"}`}>
                      {t(`search.${category.toLowerCase()}`)}
                    </div>
                    {categoryItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-b last:border-b-0 ${isDarkMode ? "text-slate-100 hover:bg-orange-600/10 border-slate-700" : "text-slate-900 hover:bg-orange-50 border-slate-200"}`}
                      >
                        <div className="text-orange-500 flex-shrink-0">
                          {getResultIcon(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                            {item.title}
                          </div>
                          <div className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                            {item.category} • {item.page}
                          </div>
                        </div>
                        <div className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
                          →
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Search className={`w-8 h-8 mx-auto mb-2 opacity-50 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`} />
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                {t('search.noResults')} <span className="text-orange-400 font-semibold">"{query}"</span>
              </p>
              <p className="text-xs mt-1 text-slate-500">
                {t('search.trySearching')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
