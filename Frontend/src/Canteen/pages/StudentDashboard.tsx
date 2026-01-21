
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import { fetchCanteens, Canteen } from '../utils/canteenStore';
import { logout, getSession } from '@/utils/authStore';
import { Icons } from '@/components/Icons';
import LogoutConfirmModal from '../components/LogoutConfirmModal';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const user = getSession();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCanteens();
      setCanteens(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Charusat<span className="text-emerald-600">Needs</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              Welcome, {user?.fullName || 'Student'}
            </span>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Canteen</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <Skeleton height={160} className="rounded-xl mb-4" />
                <Skeleton count={2} />
              </div>
            ))}
          </div>
        ) : canteens.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No canteens available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canteens.map(canteen => (
              <motion.div
                key={canteen.id}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/canteen/${canteen.id}/menu`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="h-40 bg-gray-100 relative">
                  {canteen.imageUrl ? (
                    <img src={canteen.imageUrl} alt={canteen.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 9h6v6H9z" /></svg>
                    </div>
                  )}
                  {canteen.isOpen && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm border border-emerald-100">
                      OPEN
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                    {canteen.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {canteen.location}
                  </p>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                    <span>{canteen.openingTime} - {canteen.closingTime}</span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <Icons.Star className="w-3 h-3 fill-current" /> 4.5
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <LogoutConfirmModal 
        isOpen={showLogoutModal} 
        onConfirm={handleLogout} 
        onCancel={() => setShowLogoutModal(false)} 
      />
    </div>
  );
}
