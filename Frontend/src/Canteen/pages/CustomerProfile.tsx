import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, User, Phone, Mail, Users, X, LogOut, AlertCircle } from 'lucide-react';
import { getSession, logout } from '@/utils/authStore';
import { FileUpload } from '@/components/ui/file-upload';
import api from '@/utils/api';
import { toast } from '@/utils/toast';

interface ProfileData {
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  profileImage: string;
}

// Max file size: 4MB
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export default function CustomerProfile() {
  const navigate = useNavigate();
  const session = getSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDobWarning, setShowDobWarning] = useState(false);
  const [emailId, setEmailId] = useState(''); // The ID portion that cannot be removed
  const [originalDob, setOriginalDob] = useState(''); // Track original DOB to determine if locked
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    profileImage: ''
  });

  useEffect(() => {
    // Load profile data from session or API
    const loadProfile = async () => {
      if (session) {
        // Extract email ID (e.g., d25ce145 from d25ce145@charusat.edu.in)
        const email = session.email || '';
        const atIndex = email.indexOf('@');
        const id = atIndex > 0 ? email.substring(0, atIndex).toUpperCase() : '';
        setEmailId(id);
        
        // Start with session data
        setProfileData({
          fullName: session.fullName || id, // Default to email ID
          mobile: session.mobile || '',
          email: session.email || '',
          dateOfBirth: session.dateOfBirth || '',
          gender: session.gender || '',
          profileImage: session.profileImage || ''
        });
        
        // Try to fetch fresh profile from backend
        try {
          const response = await api.get('/users/profile');
          if (response.data.success && response.data.profile) {
            const profile = response.data.profile;
            setProfileData({
              fullName: profile.fullName || id,
              mobile: profile.mobile || '',
              email: profile.email || '',
              dateOfBirth: profile.dateOfBirth || '',
              gender: profile.gender || '',
              profileImage: profile.profileImage || ''
            });
            setOriginalDob(profile.dateOfBirth || ''); // Track if DOB was already set
          }
        } catch (error) {
          // Fallback to session data if API fails
          console.log('Using session data for profile');
        }
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, []);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Check file size before upload
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 4MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success && response.data.imageUrl) {
        setProfileData(prev => ({ ...prev, profileImage: response.data.imageUrl }));
        
        // Update local session
        const currentSession = getSession();
        if (currentSession) {
          localStorage.setItem('charusatneeds_session', JSON.stringify({
            ...currentSession,
            profileImage: response.data.imageUrl
          }));
        }
        
        toast.success('Profile image updated');
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    }
    setShowImageUpload(false);
  };

  const handleSubmit = async () => {
    // Validate name contains email ID
    if (!profileData.fullName.toUpperCase().includes(emailId)) {
      toast.error(`You cannot remove your ID (${emailId}) from your name`);
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        fullName: profileData.fullName,
        mobile: profileData.mobile,
        gender: profileData.gender,
        dateOfBirth: profileData.dateOfBirth // Will be accepted if not already set
      });
      
      if (response.data.success) {
        // Update local session
        const currentSession = getSession();
        if (currentSession) {
          localStorage.setItem('charusatneeds_session', JSON.stringify({
            ...currentSession,
            fullName: profileData.fullName,
            mobile: profileData.mobile,
            gender: profileData.gender
          }));
        }
        
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    navigate('/customer/dashboard', { replace: true });
  };

  // Build image URL (for DB-stored images)
  const getProfileImageUrl = () => {
    if (!profileData.profileImage) return '';
    // If it's an API URL, add the base URL
    if (profileData.profileImage.startsWith('/api/')) {
      return `http://localhost:8080${profileData.profileImage}`;
    }
    return profileData.profileImage;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#e23744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Your Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
              {getProfileImageUrl() ? (
                <img 
                  src={getProfileImageUrl()} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowImageUpload(true)}
              className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-[#e23744] transition-colors border border-gray-200"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Upload Modal */}
        <AnimatePresence>
          {showImageUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowImageUpload(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Upload Profile Photo</h3>
                  <button 
                    onClick={() => setShowImageUpload(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Size Warning */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Maximum file size: <strong>4MB</strong>. Supported formats: JPG, PNG, GIF.
                  </p>
                </div>
                
                <FileUpload 
                  onChange={handleImageUpload}
                  accept="image/*"
                  maxFiles={1}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <LogOut className="w-8 h-8 text-[#e23744]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                  <p className="text-gray-500 mb-6">Are you sure you want to logout from this device?</p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-3 px-4 bg-[#e23744] text-white font-bold rounded-xl hover:bg-[#d62f3f] transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name - Editable but must contain ID */}
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-medium text-gray-500">
              Name <span className="text-rose-500">(must contain {emailId})</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#e23744] transition-colors">
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="flex-1 outline-none text-gray-900 font-medium bg-transparent"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Mobile - Editable */}
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-medium text-gray-500">
              Mobile
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#e23744] transition-colors">
              <Phone className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="tel"
                value={profileData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                className="flex-1 outline-none text-gray-900 font-medium bg-transparent"
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          {/* Email - Read-only */}
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-medium text-gray-500">
              Email
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Mail className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="email"
                value={profileData.email}
                disabled
                className="flex-1 outline-none text-gray-500 font-medium bg-transparent cursor-not-allowed"
              />
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
          </div>

          {/* Date of Birth - Editable once, then locked */}
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-medium text-gray-500">
              Date of Birth {originalDob && <span className="text-amber-500">(locked)</span>}
            </label>
            <div className={`flex items-center border border-gray-200 rounded-xl px-4 py-3 ${originalDob ? 'bg-gray-50' : 'focus-within:border-[#e23744]'} transition-colors`}>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => {
                  if (originalDob) {
                    setShowDobWarning(true);
                    setTimeout(() => setShowDobWarning(false), 3000);
                  } else {
                    handleChange('dateOfBirth', e.target.value);
                  }
                }}
                disabled={!!originalDob}
                className={`flex-1 outline-none font-medium bg-transparent ${originalDob ? 'text-gray-500 cursor-not-allowed' : 'text-gray-900'}`}
              />
              {originalDob && (
                <span className="text-xs text-gray-400">Cannot change</span>
              )}
              {!originalDob && !profileData.dateOfBirth && (
                <span className="text-xs text-amber-500">Set once only</span>
              )}
            </div>
            {showDobWarning && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute mt-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                Date of birth cannot be changed once set
              </motion.div>
            )}
          </div>

          {/* Gender - Editable */}
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-medium text-gray-500">
              Gender
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#e23744] transition-colors">
              <Users className="w-4 h-4 text-gray-400 mr-3" />
              <select
                value={profileData.gender}
                onChange={(e) => handleChange('gender', e.target.value as ProfileData['gender'])}
                className="flex-1 outline-none text-gray-900 font-medium bg-transparent appearance-none cursor-pointer"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Update Button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-[#e23744] to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              'Update profile'
            )}
          </button>
        </div>

        {/* Logout Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm text-gray-500 hover:text-[#e23744] transition-colors"
          >
            Logout from this device
          </button>
        </div>
      </main>
    </div>
  );
}
