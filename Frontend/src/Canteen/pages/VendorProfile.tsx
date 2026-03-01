import { useState, useEffect } from 'react';
import { Save, Building, FileText, CreditCard, Clock, Loader2 } from 'lucide-react';

import { Canteen, fetchCanteens, updateCanteenDetails } from '@/Canteen/utils/canteenStore';
import { toast } from '@/utils/toast';

export default function VendorProfile() {
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'bank' | 'compliance'>('basic');

  useEffect(() => {
    loadCanteen();
  }, []);

  const loadCanteen = async () => {
    try {
      const canteens = await fetchCanteens();
      if (canteens.length > 0) {
        setCanteen(canteens[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canteen) return;
    const { name, value } = e.target;
    setCanteen({ ...canteen, [name]: value });
  };

  const handleSave = async () => {
    if (!canteen) return;
    setSaving(true);
    try {
      const updated = await updateCanteenDetails(canteen.id, canteen);
      if (updated) {
        setCanteen(updated);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-[#e23744] animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-3xl font-display font-bold text-gray-900">Restaurant Settings</h1>
             <p className="text-gray-500 mt-1">Manage your business profile and compliance details.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#e23744] hover:bg-[#d62f3f] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
           {/* Sidebar Tabs */}
           <div className="w-full md:w-64 bg-slate-50/50 border-r border-gray-100 p-6 space-y-2">
              <button 
                onClick={() => setActiveTab('basic')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'basic' ? 'bg-rose-50 text-[#e23744]' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                  <Building className="w-5 h-5" /> Basic Info
              </button>
              <button 
                onClick={() => setActiveTab('bank')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'bank' ? 'bg-rose-50 text-[#e23744]' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                  <CreditCard className="w-5 h-5" /> Bank Details
              </button>
               <button 
                onClick={() => setActiveTab('compliance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'compliance' ? 'bg-rose-50 text-[#e23744]' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                  <FileText className="w-5 h-5" /> Compliance
              </button>
           </div>

           {/* Content */}
           <div className="flex-1 p-8">
              {activeTab === 'basic' && (
                  <div className="space-y-6 animate-fadeIn">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                           <Clock className="w-5 h-5 text-[#e23744]" /> Operating Hours
                       </h2>
                       
                       <div className="grid md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">Opening Time</label>
                               <input 
                                   type="time" 
                                   name="openingTime"
                                   value={canteen?.openingTime || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">Closing Time</label>
                               <input 
                                   type="time" 
                                   name="closingTime"
                                   value={canteen?.closingTime || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                               />
                           </div>
                       </div>

                       <div className="pt-6 border-t border-gray-100">
                           <label className="block text-sm font-bold text-gray-700 mb-2">Restaurant Name</label>
                           <input 
                               type="text" 
                               name="name"
                               value={canteen?.name || ''}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                           <input 
                               type="text" 
                               name="location"
                               value={canteen?.location || ''}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                           />
                       </div>
                  </div>
              )}

              {activeTab === 'bank' && (
                  <div className="space-y-6 animate-fadeIn">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Account Details</h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                           <div className="md:col-span-2">
                               <label className="block text-sm font-bold text-gray-700 mb-2">Account Holder Name</label>
                               <input 
                                   type="text" 
                                   name="accountHolderName"
                                   value={canteen?.accountHolderName || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
                                   placeholder="As per bank records"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
                               <input 
                                   type="text" 
                                   name="bankName"
                                   value={canteen?.bankName || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
                                   placeholder="e.g. HDFC Bank"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">IFSC Code</label>
                               <input 
                                   type="text" 
                                   name="ifscCode"
                                   value={canteen?.ifscCode || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none uppercase"
                                   placeholder="HDFC0001234"
                               />
                           </div>
                           <div className="md:col-span-2">
                               <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                               <input 
                                   type="password" 
                                   name="accountNumber"
                                   value={canteen?.accountNumber || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
                               />
                           </div>
                      </div>
                  </div>
              )}

              {activeTab === 'compliance' && (
                  <div className="space-y-6 animate-fadeIn">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Legal & Documents</h2>

                      <div className="grid md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">FSSAI License Number</label>
                               <input 
                                   type="text" 
                                   name="fssaiNumber"
                                   value={canteen?.fssaiNumber || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
                                   placeholder="14-digit license number"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-2">GSTIN (Optional)</label>
                               <input 
                                   type="text" 
                                   name="gstNo"
                                   value={canteen?.gstNo || ''}
                                   onChange={handleInputChange}
                                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none uppercase"
                               />
                           </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 mb-2">KYC Document URL</label>
                          <div className="flex gap-2">
                             <input 
                                 type="text" 
                                 name="kycDocumentUrl"
                                 value={canteen?.kycDocumentUrl || ''}
                                 onChange={handleInputChange}
                                 className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
                                 placeholder="https://..."
                             />
                             <button className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                 Check
                             </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Upload your document to a cloud storage and paste the link here.</p>
                      </div>
                  </div>
              )}
           </div>
        </div>
      </div>
    </>
  );
}
