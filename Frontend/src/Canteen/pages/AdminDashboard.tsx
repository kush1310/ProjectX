/**
 * Admin Dashboard - Blank Dashboard for ADMIN role
 * 
 * Features:
 * - User management overview
 * - System analytics (placeholder)
 * - Quick actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logout, getSession } from '@/utils/authStore';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { Icons } from '@/components/Icons';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading] = useState(false);
  const user = getSession();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminCards = [
    { title: 'Total Users', value: '—', icon: '👥', color: 'from-blue-500 to-blue-600' },
    { title: 'Active Canteens', value: '—', icon: '🏪', color: 'from-emerald-500 to-emerald-600' },
    { title: 'Total Orders', value: '—', icon: '📦', color: 'from-orange-500 to-orange-600' },
    { title: 'Revenue Today', value: '—', icon: '💰', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">System Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {user?.fullName || 'Admin'}
            </span>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              {loading ? (
                <>
                  <Skeleton width={40} height={40} className="rounded-xl mb-3" />
                  <Skeleton width={80} />
                  <Skeleton width={60} height={28} />
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                    {card.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">User Management</h2>
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                👥
              </div>
              <p className="text-gray-500 font-medium">User management coming soon</p>
              <p className="text-xs text-gray-400 mt-1">Manage users, roles, and permissions</p>
            </div>
          </div>

          {/* System Analytics */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Analytics</h2>
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📊
              </div>
              <p className="text-gray-500 font-medium">Analytics coming soon</p>
              <p className="text-xs text-gray-400 mt-1">View system-wide statistics</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Add User', icon: '➕', disabled: true },
              { label: 'Add Canteen', icon: '🏪', disabled: true },
              { label: 'View Reports', icon: '📈', disabled: true },
              { label: 'Settings', icon: '⚙️', disabled: true },
            ].map((action) => (
              <button
                key={action.label}
                disabled={action.disabled}
                className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl block mb-2">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <LogoutConfirmModal 
        isOpen={showLogoutModal} 
        onConfirm={handleLogout} 
        onCancel={() => setShowLogoutModal(false)} 
      />
    </div>
  );
}
