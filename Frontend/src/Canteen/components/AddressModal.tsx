import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, GraduationCap, Briefcase, Check, ChevronDown } from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/utils/toast';

interface AddressData {
  userType: 'STUDENT' | 'TEACHER' | '';
  hostelName: string;
  roomNumber: string;
  buildingNumber: string;
  department: string;
  staffRoomNumber: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressData) => void;
  initialData?: AddressData;
}

// Options
const BOYS_HOSTELS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'];
const GIRLS_HOSTELS = ['GH1', 'GH2', 'GH3', 'GH4', 'GH5', 'GH6', 'GH7', 'GH8', 'GH9', 'GH10'];
const BUILDINGS = ['1', '2', '3', '4', '5', '6', '7'];
const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Pharmacy',
  'Management Studies',
  'Other'
];

export default function AddressModal({ isOpen, onClose, onSave, initialData }: AddressModalProps) {
  const [data, setData] = useState<AddressData>({
    userType: '',
    hostelName: '',
    roomNumber: '',
    buildingNumber: '',
    department: '',
    staffRoomNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hostelType, setHostelType] = useState<'boys' | 'girls'>('boys');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      if (initialData.hostelName?.startsWith('GH')) setHostelType('girls');
    }
  }, [initialData]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeDropdown]);

  const handleSave = async () => {
    if (!data.userType) {
      toast.error('Please select Student or Teacher');
      return;
    }
    if (data.userType === 'STUDENT' && !data.hostelName) {
      toast.error('Please select your hostel');
      return;
    }
    if (data.userType === 'TEACHER' && !data.buildingNumber) {
      toast.error('Please select your building');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/users/profile/address', data);
      if (response.data.success) {
        toast.success('Location saved!');
        onSave(data);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
    setIsSaving(false);
  };

  const hostels = hostelType === 'girls' ? GIRLS_HOSTELS : BOYS_HOSTELS;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-[#e23744] to-rose-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">Set Location</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* User Type - Clickable Text Tabs */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setData(prev => ({ ...prev, userType: 'STUDENT' }))}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
                  data.userType === 'STUDENT' 
                    ? 'text-[#e23744] scale-105' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
                {data.userType === 'STUDENT' && (
                  <motion.span layoutId="check" className="ml-0.5">
                    <Check className="w-3 h-3" />
                  </motion.span>
                )}
              </button>
              
              <div className="w-px h-4 bg-gray-200" />
              
              <button
                onClick={() => setData(prev => ({ ...prev, userType: 'TEACHER' }))}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
                  data.userType === 'TEACHER' 
                    ? 'text-[#e23744] scale-105' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Teacher</span>
                {data.userType === 'TEACHER' && (
                  <motion.span layoutId="check" className="ml-0.5">
                    <Check className="w-3 h-3" />
                  </motion.span>
                )}
              </button>
            </div>

            {/* Student Form */}
            <AnimatePresence mode="wait">
              {data.userType === 'STUDENT' && (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {/* Hostel Type Toggle */}
                  <div className="flex gap-2 text-xs">
                    {['boys', 'girls'].map(type => (
                      <button
                        key={type}
                        onClick={() => { setHostelType(type as any); setData(prev => ({ ...prev, hostelName: '' })); }}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                          hostelType === type
                            ? type === 'boys' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {type === 'boys' ? 'Boys' : 'Girls'} Hostel
                      </button>
                    ))}
                  </div>

                  {/* Hostel Dropdown */}
                  <DropdownSelect
                    label="Hostel"
                    value={data.hostelName}
                    options={hostels}
                    onChange={(v) => setData(prev => ({ ...prev, hostelName: v }))}
                    isOpen={activeDropdown === 'hostel'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'hostel' ? null : 'hostel')}
                  />

                  {/* Room Number */}
                  <input
                    type="text"
                    placeholder="Room number (e.g., 301)"
                    value={data.roomNumber}
                    onChange={(e) => setData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-[#e23744] focus:ring-1 focus:ring-rose-100 outline-none transition-all"
                  />
                </motion.div>
              )}

              {/* Teacher Form */}
              {data.userType === 'TEACHER' && (
                <motion.div
                  key="teacher"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <DropdownSelect
                    label="Building"
                    value={data.buildingNumber ? `Building ${data.buildingNumber}` : ''}
                    options={BUILDINGS.map(b => `Building ${b}`)}
                    onChange={(v) => setData(prev => ({ ...prev, buildingNumber: v.replace('Building ', '') }))}
                    isOpen={activeDropdown === 'building'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'building' ? null : 'building')}
                  />

                  <DropdownSelect
                    label="Department"
                    value={data.department}
                    options={DEPARTMENTS}
                    onChange={(v) => setData(prev => ({ ...prev, department: v }))}
                    isOpen={activeDropdown === 'department'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'department' ? null : 'department')}
                  />

                  <input
                    type="text"
                    placeholder="Staff room number"
                    value={data.staffRoomNumber}
                    onChange={(e) => setData(prev => ({ ...prev, staffRoomNumber: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-[#e23744] focus:ring-1 focus:ring-rose-100 outline-none transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button - Compact */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || !data.userType}
              className="w-full py-2.5 bg-gradient-to-r from-[#e23744] to-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-200/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Location
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact Dropdown Component
function DropdownSelect({ 
  label, 
  value, 
  options, 
  onChange, 
  isOpen, 
  onToggle 
}: { 
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || `Select ${label.toLowerCase()}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-auto"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(opt); onToggle(); }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-rose-50 transition-colors ${
                  value === opt ? 'bg-rose-50 text-[#e23744] font-medium' : 'text-gray-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
