import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import FuzzySearch from 'fuzzy-search';
import { fetchCanteens, Canteen } from '../utils/canteenStore';
import { logout, getSession } from '@/utils/authStore';
import { Icons } from '@/components/Icons';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import AddressModal from '../components/AddressModal';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [userAddress, setUserAddress] = useState<any>(null);
  const user = getSession();

  // Quick Filters - No veg filter (campus is 100% veg)
  const filters = [
    { id: 'All', label: 'All', icon: <Icons.Settings className="w-4 h-4" /> },
    { id: 'Near', label: 'Nearest', icon: <Icons.MapPin className="w-4 h-4" /> },
    { id: 'Offers', label: 'Great Offers', icon: <Icons.Tag className="w-4 h-4" /> },
    { id: 'Rating', label: 'Rating 4.0+', icon: <Icons.Star className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const startTime = Date.now();
      const data = await fetchCanteens();
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 800 - elapsed);
      
      setTimeout(() => {
        setCanteens(data);
        setLoading(false);
      }, remaining);
    };
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Fuzzy search implementation - real-time as user types
  const filteredCanteens = useMemo(() => {
    let results = canteens;
    
    if (searchQuery.trim()) {
      const searcher = new FuzzySearch(canteens, ['name', 'location'], {
        caseSensitive: false,
        sort: true
      });
      results = searcher.search(searchQuery);
    }

    // Apply filter
    if (activeFilter !== 'All') {
      results = results.filter(canteen => {
        switch (activeFilter) {
          case 'Near': return true; // Would need location data
          case 'Offers': return canteen.hasOffer || Math.random() > 0.5; // Mock
          case 'Rating': return true; // All have constant 4.4 rating
          default: return true;
        }
      });
    }

    return results;
  }, [canteens, searchQuery, activeFilter]);

  const showResults = searchQuery.trim().length > 0 || activeFilter !== 'All';

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-6xl kiosk:max-w-7xl tv:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <button 
              onClick={() => setShowAddressModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#e23744] uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
               <Icons.MapPin className="w-3 h-3" />
               <span>{userAddress?.hostelName || userAddress?.buildingNumber ? 
                 (userAddress.userType === 'STUDENT' ? `${userAddress.hostelName} - ${userAddress.roomNumber || 'Room'}` : `Building ${userAddress.buildingNumber}`) 
                 : 'CHARUSAT Campus'}</span>
               <Icons.ChevronRight className="w-3 h-3 opacity-50" />
            </button>
            <h1 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 truncate max-w-[200px] sm:max-w-none">
              {user?.fullName || 'Student Needs'}
            </h1>
          </div>
          <button 
             onClick={() => navigate('/customer/profile')}
             className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
             <span className="font-bold text-xs">{user?.fullName?.charAt(0) || 'U'}</span>
          </button>
        </div>
        
        {/* Search Bar - Real-time Fuzzy Search */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 max-w-6xl kiosk:max-w-7xl tv:max-w-[1800px] mx-auto">
          <div className={`relative flex items-center bg-gray-100 rounded-xl transition-all ${isSearchFocused ? 'ring-2 ring-[#e23744]/20 bg-white border border-[#e23744]' : ''}`}>
            <Icons.Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search canteens, items..."
              className="flex-1 py-3 px-3 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl kiosk:max-w-7xl tv:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          
          {/* Quick Filters */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-2">
            {filters.map(filter => (
               <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                     activeFilter === filter.id 
                       ? 'bg-gray-900 text-white border-gray-900' 
                       : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
               >
                  {filter.icon}
                  {filter.label}
               </button>
            ))}
          </div>

          {/* Search Results */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <Skeleton height={160} />
                    <div className="p-4">
                      <Skeleton width="60%" height={20} className="mb-2" />
                      <Skeleton width="40%" height={16} />
                      <div className="flex gap-4 mt-3">
                        <Skeleton width={60} height={16} />
                        <Skeleton width={80} height={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredCanteens.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? `No canteens matching "${searchQuery}"` : 'No canteens match the selected filter'}
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                  className="mt-4 text-[#e23744] font-semibold text-sm hover:underline"
                >
                  Clear filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 kiosk:grid-cols-4 tv:grid-cols-5 gap-4 sm:gap-6"
              >
                {/* Results Header */}
                {showResults && (
                  <div className="col-span-full flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {filteredCanteens.length} {filteredCanteens.length === 1 ? 'result' : 'results'}
                      {searchQuery && ` for "${searchQuery}"`}
                    </span>
                  </div>
                )}

                {!showResults && (
                  <>
                    {/* Featured Section */}
                    <div className="col-span-full mb-6">
                      <h2 className="font-black text-gray-800 tracking-tight text-lg mb-4">Explore</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 kiosk:grid-cols-5 tv:grid-cols-6 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden h-32 flex flex-col justify-between group cursor-pointer">
                          <span className="font-bold text-indigo-900 z-10">Best Offers</span>
                          <span className="text-xs text-indigo-600 font-medium z-10">Up to 60% OFF</span>
                          <div className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform">
                            <Icons.Tag className="w-24 h-24" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-2xl border border-amber-100 relative overflow-hidden h-32 flex flex-col justify-between group cursor-pointer">
                          <span className="font-bold text-amber-900 z-10">Campus Special</span>
                          <span className="text-xs text-amber-600 font-medium z-10">New items daily</span>
                          <div className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform">
                            <Icons.Star className="w-24 h-24" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h2 className="col-span-full font-black text-gray-800 tracking-tight text-lg">All Canteens</h2>
                  </>
                )}

                {/* Canteen Cards */}
                {filteredCanteens.map((canteen, index) => (
                  <motion.div
                    key={canteen.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/canteen/${canteen.id}/menu`)}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {canteen.imageUrl ? (
                        <img 
                          src={canteen.imageUrl} 
                          alt={canteen.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icons.Store className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${
                        canteen.isOpen ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'
                      }`}>
                        {canteen.isOpen ? 'OPEN' : 'CLOSED'}
                      </div>

                      {/* Offer Badge */}
                      {canteen.hasOffer && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-[#e23744] text-white rounded-lg text-xs font-bold">
                          50% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#e23744] transition-colors">
                          {canteen.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                          <span>4.4</span>
                          <Icons.Star className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm mb-3">{canteen.location || 'CHARUSAT Campus'}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icons.Clock className="w-3.5 h-3.5" />
                          25-35 min
                        </span>
                        <span>•</span>
                        <span>₹100 for two</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
      </main>

      <LogoutConfirmModal 
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={(addr) => setUserAddress(addr)}
        initialData={userAddress}
      />
    </div>
  );
}
