import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, User, Phone, Mail, X, LogOut, AlertCircle, CircleDot, Trash2, Lock, KeyRound, ShieldCheck, Eye, EyeOff, Check } from 'lucide-react';
import { getSession, logout } from '@/utils/authStore';
import { FileUpload } from '@/components/ui/file-upload';
import api, { BACKEND_URL } from '@/utils/api';
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

// Validation helpers
const validateName = (name: string): string | null => {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be less than 50 characters';
  if (!/^[a-zA-Z\s.]+$/.test(name.trim())) return 'Name can only contain letters, spaces, and dots';
  return null;
};

const validateMobile = (mobile: string): string | null => {
  if (!mobile) return null; // Optional
  if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter a valid 10-digit mobile number';
  return null;
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const session = getSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDobWarning, setShowDobWarning] = useState(false);
  const [originalDob, setOriginalDob] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Change Password Modal & Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // DP upload session controls
  // dpChangesThisSession: counts uploads this page-session; resets on navigation (per-session limit)
  // dpCooldownRemaining: seconds left in the 15-second cooldown between uploads
  const [dpChangesThisSession, setDpChangesThisSession] = useState(0);
  const [dpCooldownRemaining, setDpCooldownRemaining] = useState(0);
  const DP_MAX_CHANGES_PER_SESSION = 3;
  const DP_COOLDOWN_SECONDS = 15;
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    profileImage: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (session) {
        setProfileData({
          fullName: session.fullName || '',
          mobile: session.mobile || '',
          email: session.email || '',
          dateOfBirth: session.dateOfBirth || '',
          gender: session.gender || '',
          profileImage: session.profileImage || ''
        });
        
        try {
          const response = await api.get('/users/profile');
          if (response.data.success && response.data.profile) {
            const profile = response.data.profile;
            setProfileData({
              fullName: profile.fullName || '',
              mobile: profile.mobile || '',
              email: profile.email || '',
              dateOfBirth: profile.dateOfBirth || '',
              gender: profile.gender || '',
              profileImage: profile.profileImage || ''
            });
            setOriginalDob(profile.dateOfBirth || '');
          }
        } catch {
          // fallback to session data for profile
        }
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, []);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear errors on change
    if (field === 'fullName') setNameError(null);
    if (field === 'mobile') setMobileError(null);
  };

  /**
   * handleImageUpload
   *
   * Uploads the selected profile image to /users/profile/image via multipart/form-data.
   * Enforces two session-level constraints before sending:
   *   1. Maximum 3 profile picture changes per session (resets on page navigation).
   *   2. A 15-second cooldown between consecutive uploads.
   * On success, updates local state and the session storage entry with the new image URL.
   *
   * @param files {File[]} Array of files from the FileUpload component; only index 0 is used.
   * @validates  File size <= 4 MB, session change count < 3, cooldown elapsed.
   * @edge-cases Empty array is a no-op. Exceeding limits shows a descriptive toast and aborts.
   */
  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Session limit guard
    if (dpChangesThisSession >= DP_MAX_CHANGES_PER_SESSION) {
      toast.error(`You can only change your profile photo ${DP_MAX_CHANGES_PER_SESSION} times per session. Please log out and back in to change it again.`);
      setShowImageUpload(false);
      return;
    }

    // Cooldown guard
    if (dpCooldownRemaining > 0) {
      toast.error(`Please wait ${dpCooldownRemaining} second${dpCooldownRemaining !== 1 ? 's' : ''} before changing your photo again.`);
      setShowImageUpload(false);
      return;
    }

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 4MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/users/profile/image', formData);
      // Note: Do NOT manually set Content-Type — Axios auto-sets multipart/form-data with the correct boundary

      if (response.data.success && response.data.imageUrl) {
        setProfileData(prev => ({ ...prev, profileImage: response.data.imageUrl }));

        const currentSession = getSession();
        if (currentSession) {
          localStorage.setItem('charusatneeds_session', JSON.stringify({
            ...currentSession,
            profileImage: response.data.imageUrl
          }));
        }

        // Increment session change counter
        const newCount = dpChangesThisSession + 1;
        setDpChangesThisSession(newCount);

        // Start 15-second cooldown timer
        setDpCooldownRemaining(DP_COOLDOWN_SECONDS);
        const timerInterval = setInterval(() => {
          setDpCooldownRemaining(prev => {
            if (prev <= 1) { clearInterval(timerInterval); return 0; }
            return prev - 1;
          });
        }, 1000);

        const changesLeft = DP_MAX_CHANGES_PER_SESSION - newCount;
        toast.success(
          changesLeft > 0
            ? `Profile photo updated. ${changesLeft} change${changesLeft !== 1 ? 's' : ''} remaining this session.`
            : 'Profile photo updated. You have used all changes for this session.'
        );
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    }
    setShowImageUpload(false);
  };

  const handleSubmit = async () => {
    // Client-side validation
    const nameErr = validateName(profileData.fullName);
    const mobileErr = validateMobile(profileData.mobile);
    
    if (nameErr) { setNameError(nameErr); return; }
    if (mobileErr) { setMobileError(mobileErr); return; }
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        fullName: profileData.fullName.trim(),
        mobile: profileData.mobile,
        gender: profileData.gender,
        dateOfBirth: profileData.dateOfBirth
      });
      
      if (response.data.success) {
        const currentSession = getSession();
        if (currentSession) {
          localStorage.setItem('charusatneeds_session', JSON.stringify({
            ...currentSession,
            fullName: profileData.fullName.trim(),
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data?.success || response.status === 200) {
        toast.success('Password updated successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const msg = response.data?.message || response.data?.error || 'Failed to change password';
        setPasswordError(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to change password. Please check your current password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    navigate('/customer/dashboard', { replace: true });
  };

  const getProfileImageUrl = () => {
    if (!profileData.profileImage) return '';
    if (profileData.profileImage.startsWith('/api/')) {
      return `${BACKEND_URL}${profileData.profileImage}`;
    }
    return profileData.profileImage;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e23744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="ag-container pt-6 pb-2">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <h1 className="text-xl font-extrabold text-neutral-900">Your Profile</h1>
        </div>
      </div>

      <main className="ag-container max-w-xl mx-auto">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-rose-100 to-rose-50 border-4 border-white shadow-xl ring-2 ring-rose-100">
              {getProfileImageUrl() ? (
                <img
                  src={getProfileImageUrl()}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-rose-300">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            {/* Camera button — disabled during cooldown or when session limit reached */}
            <button
              onClick={() => {
                if (dpChangesThisSession >= DP_MAX_CHANGES_PER_SESSION) {
                  toast.error(`Photo change limit reached (${DP_MAX_CHANGES_PER_SESSION}/session). Log out to reset.`);
                  return;
                }
                if (dpCooldownRemaining > 0) {
                  toast.error(`Wait ${dpCooldownRemaining}s before changing again.`);
                  return;
                }
                setShowImageUpload(true);
              }}
              className={`absolute bottom-0 right-0 w-9 h-9 rounded-full shadow-lg flex items-center justify-center text-white border-2 border-white transition-all ${
                dpChangesThisSession >= DP_MAX_CHANGES_PER_SESSION || dpCooldownRemaining > 0
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-[#e23744] hover:bg-[#d62f3f] hover:scale-110'
              }`}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          {/* Cooldown / limit indicators */}
          {dpCooldownRemaining > 0 && (
            <p className="mt-2 text-[11px] text-amber-600 font-medium">
              Next change available in {dpCooldownRemaining}s
            </p>
          )}
          {dpChangesThisSession > 0 && dpCooldownRemaining === 0 && (
            <p className="mt-1 text-[11px] text-neutral-400">
              {DP_MAX_CHANGES_PER_SESSION - dpChangesThisSession} photo change{DP_MAX_CHANGES_PER_SESSION - dpChangesThisSession !== 1 ? 's' : ''} remaining this session
            </p>
          )}
          {!profileData.fullName && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-rose-500 font-medium flex items-center gap-1"
            >
              <CircleDot className="w-3.5 h-3.5" />
              Complete your profile below
            </motion.p>
          )}
        </div>

        {/* Image Upload Modal */}
        <AnimatePresence>
          {showImageUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowImageUpload(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
        <div className="space-y-5">
          {/* Full Name - Free entry with validation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className={`flex items-center border ${nameError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200 focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100'} rounded-xl px-4 py-3.5 transition-all bg-white`}>
              <User className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="flex-1 outline-none text-gray-900 font-medium bg-transparent placeholder:text-gray-400"
                placeholder="Enter your full name"
                maxLength={50}
              />
              {profileData.fullName && !nameError && (
                <span className="text-xs text-green-500 font-medium ml-2 flex-shrink-0">{profileData.fullName.trim().length}/50</span>
              )}
            </div>
            {nameError && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 mt-1.5 ml-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {nameError}
              </motion.p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Mobile Number
            </label>
            <div className={`flex items-center border ${mobileError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200 focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100'} rounded-xl px-4 py-3.5 transition-all bg-white`}>
              <Phone className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <span className="text-gray-400 font-medium mr-1 text-sm">+91</span>
              <input
                type="tel"
                value={profileData.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange('mobile', val);
                }}
                className="flex-1 outline-none text-gray-900 font-medium bg-transparent placeholder:text-gray-400"
                placeholder="Enter mobile number"
                maxLength={10}
              />
            </div>
            {mobileError && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 mt-1.5 ml-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {mobileError}
              </motion.p>
            )}
          </div>

          {/* Email - Read-only */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Email
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50">
              <Mail className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="email"
                value={profileData.email}
                disabled
                className="flex-1 outline-none text-gray-500 font-medium bg-transparent cursor-not-allowed"
              />
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">Verified</span>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Date of Birth {originalDob && <span className="text-amber-500 normal-case">(locked)</span>}
            </label>
            <div className={`flex items-center border border-gray-200 rounded-xl px-4 py-3.5 ${originalDob ? 'bg-gray-50' : 'bg-white focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100'} transition-all`}>
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
                <span className="text-xs text-gray-400 flex-shrink-0">Cannot change</span>
              )}
              {!originalDob && !profileData.dateOfBirth && (
                <span className="text-xs text-amber-500 font-medium flex-shrink-0">Set once only</span>
              )}
            </div>
            {showDobWarning && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-amber-600 mt-1.5 ml-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                Date of birth cannot be changed once set
              </motion.p>
            )}
          </div>

          {/* Gender - Stylish Radio Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
              Gender
            </label>
            <div className="flex gap-3">
              {(['Male', 'Female', 'Other'] as const).map((option) => {
                const isSelected = profileData.gender === option;
                const colors = {
                  Male: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
                  Female: { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-700', ring: 'ring-pink-200', dot: 'bg-pink-500' },
                  Other: { bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-700', ring: 'ring-violet-200', dot: 'bg-violet-500' },
                };
                const c = colors[option];
                
                return (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => handleChange('gender', option)}
                    whileTap={{ scale: 0.96 }}
                    className={`flex-1 relative flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                      isSelected 
                        ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring} shadow-sm`
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Custom Radio Indicator */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? c.border : 'border-gray-300'
                    }`}>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`w-2 h-2 rounded-full ${c.dot}`}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Update Button */}
        <div className="mt-8">
          <motion.button
            onClick={handleSubmit}
            disabled={isSaving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-[#e23744] to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200/60 hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </motion.button>
        </div>

        {/* Security & Change Password Section */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-slate-50 to-neutral-50 border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100/70 text-[#e23744] rounded-xl flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Security & Password</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Update your account password to keep your profile secure.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setShowPasswordModal(true);
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:border-rose-300 text-gray-800 hover:text-[#e23744] text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#e23744]" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => { if (!isChangingPassword) setShowPasswordModal(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-rose-50 text-[#e23744] rounded-xl flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900">Change Password</h3>
                      <p className="text-xs text-gray-500">Ensure your new password is at least 6 characters</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={isChangingPassword}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-gray-200 focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100 rounded-xl px-3.5 py-3 transition-all bg-white">
                      <Lock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="flex-1 outline-none text-sm text-gray-900 font-medium bg-transparent placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-gray-200 focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100 rounded-xl px-3.5 py-3 transition-all bg-white">
                      <KeyRound className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        required
                        minLength={6}
                        className="flex-1 outline-none text-sm text-gray-900 font-medium bg-transparent placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-gray-200 focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-rose-100 rounded-xl px-3.5 py-3 transition-all bg-white">
                      <ShieldCheck className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="flex-1 outline-none text-sm text-gray-900 font-medium bg-transparent placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword && confirmPassword === newPassword && (
                      <p className="text-xs text-green-600 font-medium mt-1 ml-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-green-500" /> Passwords match
                      </p>
                    )}
                  </div>

                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      disabled={isChangingPassword}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="flex-1 py-3 bg-[#e23744] hover:bg-[#d62f3f] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm text-gray-400 hover:text-[#e23744] transition-colors font-medium"
          >
            Logout from this device
          </button>
        </div>

        {/* Delete Account Section */}
        <div className="mt-6 pt-6 border-t border-gray-100 pb-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-800">Delete Account</h4>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">This action is permanent and cannot be undone. All your data, order history, and preferences will be removed.</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors"
                >
                  I want to delete my account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => { if (!isDeleting) setShowDeleteModal(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Your Account</h3>
                  <p className="text-gray-500 text-sm mb-5">Enter your password to confirm. This cannot be undone.</p>
                  
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all mb-4"
                    disabled={isDeleting}
                  />
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!deletePassword.trim()) {
                          toast.error('Please enter your password');
                          return;
                        }
                        setIsDeleting(true);
                        try {
                          const response = await api.delete('/auth/delete-account', {
                            data: { password: deletePassword }
                          });
                          if (response.data.success) {
                            toast.success('Account deletion scheduled. You have 5 days to log in and cancel.');
                            logout();
                            navigate('/login', { replace: true });
                          } else {
                            toast.error(response.data.message || 'Failed to delete account');
                          }
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to delete account');
                        }
                        setIsDeleting(false);
                        setDeletePassword('');
                      }}
                      disabled={isDeleting || !deletePassword.trim()}
                      className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
