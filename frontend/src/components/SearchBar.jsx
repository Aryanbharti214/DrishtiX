import React, { useState, useRef, useEffect } from 'react';
import { Search, X, AlertCircle, CheckCircle2, Navigation, Image } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../services/translations';

export default function SearchBar({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);
  const { language } = useSettings();

  const t = (keyPath) => getTranslation(language, keyPath);

  // Mock search data - expand as needed
  const searchableItems = [
    { id: 1, title: 'Dashboard Overview', page: 'dashboard', category: 'Navigation', icon: 'gauge' },
    { id: 2, title: 'Disaster Map', page: 'map', category: 'Navigation', icon: 'map' },
    { id: 3, title: 'Priority Queue', page: 'priorities', category: 'Navigation', icon: 'alert' },
    { id: 4, title: 'Verification Tasks', page: 'verify', category: 'Navigation', icon: 'check' },
    { id: 5, title: 'Findings Report', page: 'findings', category: 'Reports', icon: 'report' },
    { id: 6, title: 'Evidence Database', page: 'evidence', category: 'Data', icon: 'database' },
    { id: 7, title: 'Imagery Archive', page: 'imagery', category: 'Media', icon: 'image' },
    { id: 8, title: 'Damaged Structures', page: 'dashboard', category: 'Statistics', highlight: 'damagedBuildings' },
    { id: 9, title: 'Blocked Supply Routes', page: 'dashboard', category: 'Statistics', highlight: 'blockedRoutes' },
    { id: 10, title: 'Pending Verification', page: 'dashboard', category: 'Statistics', highlight: 'pendingVerification' },
    { id: 11, title: 'Drone Images', page: 'dashboard', category: 'Statistics', highlight: 'totalImages' },
  ];

  // Filter results based on query
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = searchableItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered.slice(0, 8)); // Limit to 8 results
  }, [query]);

  // Close dropdown when clicking outside or pressing Escape
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
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('header.searchPlaceholder')}
          className="w-full pl-10 pr-10 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-100 light:bg-white light:border-slate-200/60 light:text-slate-900 light:placeholder-slate-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Fully Opaque */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-xl z-[9999] overflow-hidden bg-slate-900 border border-slate-700 dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-slate-200">
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Group results by category */}
              {['Navigation', 'Statistics', 'Reports', 'Data', 'Media'].map((category) => {
                const categoryItems = results.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800 border-b border-slate-700 dark:bg-slate-800 dark:border-slate-700 light:bg-slate-50 light:text-slate-600 light:border-slate-200">
                      {t(`search.${category.toLowerCase()}`)}
                    </div>
                    {categoryItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-orange-600/10 transition-colors border-b border-slate-700 last:border-b-0 dark:text-slate-100 dark:hover:bg-orange-600/10 dark:border-slate-700 light:text-slate-900 light:hover:bg-orange-50 light:border-slate-200"
                      >
                        <div className="text-orange-500 flex-shrink-0">
                          {getResultIcon(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate dark:text-slate-100 light:text-slate-900">
                            {item.title}
                          </div>
                          <div className="text-xs mt-0.5 dark:text-slate-400 light:text-slate-600">
                            {item.category} • {item.page}
                          </div>
                        </div>
                        <div className="dark:text-slate-500 light:text-slate-400">
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
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50 dark:text-slate-600 light:text-slate-400" />
              <p className="text-sm dark:text-slate-400 light:text-slate-600">
                {t('search.noResults')} <span className="text-orange-400 font-semibold">"{query}"</span>
              </p>
              <p className="text-xs mt-1 dark:text-slate-500 light:text-slate-500">
                {t('search.trySearching')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
