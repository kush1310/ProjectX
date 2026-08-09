import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  GraduationCap,
  Briefcase,
  Check,
  ArrowLeft,
  Building2,
  X,
  Home,
  Navigation
} from "lucide-react";
import api from "@/utils/api";
import { toast } from "@/utils/toast";
import CharusatCampusMap, { CHARUSAT_LOCATIONS, CampusLocation } from "./CharusatCampusMap";

interface AddressData {
  userType: "STUDENT" | "TEACHER" | "";
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
const BOYS_HOSTELS = [
  "Shreedeep", "Nisarg", "Ohm", "Royal Care", "Sahajanand",
  "Prince", "Neelkanth", "Darshan", "Patel",
];
const GIRLS_HOSTELS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9"];
const BUILDINGS = [
  "CSPIT", "DEPSTAR", "RPCP", "CMPICA", "IIIM",
  "PDPIAS", "BDIPS", "MTIN", "ARIP",
];
const DEPARTMENTS = [
  "Computer Engineering", "Information Technology",
  "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering",
  "Pharmacy", "Management Studies", "Other",
];

const sanitizeRoomNumber = (value: string) =>
  value.replace(/[^a-zA-Z0-9-]/g, "");

export default function AddressModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddressModalProps) {
  const [data, setData] = useState<AddressData>({
    userType: "", hostelName: "", roomNumber: "",
    buildingNumber: "", department: "", staffRoomNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hostelType, setHostelType] = useState<"boys" | "girls">("boys");
  const [step, setStep] = useState(1); // 1=type, 2=details

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      if (initialData.hostelName && /^H\d+$/.test(initialData.hostelName)) setHostelType('girls');
      if (initialData.userType) setStep(2);
    }
  }, [initialData]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) { setStep(initialData?.userType ? 2 : 1); }
  }, [isOpen]);

  const handleSave = async () => {
    if (!data.userType) { toast.error("Please select Student or Teacher"); return; }
    if (data.userType === "STUDENT" && !data.hostelName) { toast.error("Please select your hostel"); return; }
    if (data.userType === "TEACHER" && !data.buildingNumber) { toast.error("Please select your building"); return; }

    setIsSaving(true);
    try {
      const response = await api.put("/users/profile/address", data);
      if (response.data.success) {
        toast.success("Location saved!");
        onSave(data);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    }
    setIsSaving(false);
  };

  const hostels = hostelType === "girls" ? GIRLS_HOSTELS : BOYS_HOSTELS;

  const selectType = (type: "STUDENT" | "TEACHER") => {
    setData(prev => ({ ...prev, userType: type }));
    setTimeout(() => setStep(2), 150);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#e23744] to-[#ff6b6b] px-6 py-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            <div className="relative z-10 flex items-center gap-3">
              {step === 2 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setStep(1)}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </motion.button>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <MapPin className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                    {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                  </span>
                </div>
                <h2 className="text-white font-extrabold text-lg">
                  {step === 1 ? 'Who are you?' : data.userType === 'STUDENT' ? 'Your Hostel' : 'Your Building'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="relative z-10 mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: User Type */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-neutral-500 mb-2">Select your role at CHARUSAT</p>
                  
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectType("STUDENT")}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      data.userType === "STUDENT"
                        ? "border-[#e23744] bg-rose-50 shadow-lg shadow-rose-100/40"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      data.userType === "STUDENT"
                        ? "bg-gradient-to-br from-[#e23744] to-[#ff6b6b]"
                        : "bg-neutral-100"
                    }`}>
                      <GraduationCap className={`w-6 h-6 ${data.userType === "STUDENT" ? "text-white" : "text-neutral-400"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-base ${data.userType === "STUDENT" ? "text-neutral-900" : "text-neutral-700"}`}>Student</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">I live in a hostel on campus</p>
                    </div>
                    {data.userType === "STUDENT" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-[#e23744] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectType("TEACHER")}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      data.userType === "TEACHER"
                        ? "border-[#e23744] bg-rose-50 shadow-lg shadow-rose-100/40"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      data.userType === "TEACHER"
                        ? "bg-gradient-to-br from-[#e23744] to-[#ff6b6b]"
                        : "bg-neutral-100"
                    }`}>
                      <Briefcase className={`w-6 h-6 ${data.userType === "TEACHER" ? "text-white" : "text-neutral-400"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-base ${data.userType === "TEACHER" ? "text-neutral-900" : "text-neutral-700"}`}>Faculty</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">I work in a department building</p>
                    </div>
                    {data.userType === "TEACHER" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-[#e23744] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 2 && data.userType === "STUDENT" && (
                <motion.div
                  key="step2-student"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* CHARUSAT Campus Map Drop-off Selector */}
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#e23744]" /> CHARUSAT Campus Interactive Map
                    </h4>
                    <CharusatCampusMap
                      mode="select"
                      height="h-56"
                      onSelectLocation={(loc) => {
                        if (loc.type === 'hostel') {
                          setData(prev => ({ ...prev, hostelName: loc.code }));
                          toast.success(`Selected ${loc.name}`);
                        } else if (loc.type === 'building') {
                          setData(prev => ({ ...prev, buildingNumber: loc.code }));
                          toast.success(`Selected ${loc.name}`);
                        }
                      }}
                    />
                  </div>
                  {/* Hostel Type Toggle */}
                  <div className="flex gap-2">
                    {(["boys", "girls"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => { setHostelType(type); setData(prev => ({ ...prev, hostelName: "" })); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                          hostelType === type
                            ? type === "boys"
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-200/40"
                              : "bg-pink-500 text-white shadow-lg shadow-pink-200/40"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                        }`}
                      >
                        <Home className="w-3.5 h-3.5" />
                        {type === "boys" ? "Boys" : "Girls"} Hostel
                      </button>
                    ))}
                  </div>

                  {/* Hostel Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Select Hostel</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {hostels.map((h, i) => (
                        <motion.button
                          key={h}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setData(prev => ({ ...prev, hostelName: h }))}
                          className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            data.hostelName === h
                              ? "bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white shadow-lg shadow-rose-200/40 scale-[1.02]"
                              : "bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-white"
                          }`}
                        >
                          {h}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Room Number */}
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                      Room Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., A-301"
                      value={data.roomNumber}
                      onChange={(e) => setData(prev => ({ ...prev, roomNumber: sanitizeRoomNumber(e.target.value) }))}
                      className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl font-medium focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all placeholder:text-neutral-400"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && data.userType === "TEACHER" && (
                <motion.div
                  key="step2-teacher"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Building Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Select Building</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {BUILDINGS.map((b, i) => (
                        <motion.button
                          key={b}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setData(prev => ({ ...prev, buildingNumber: b }))}
                          className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            data.buildingNumber === b
                              ? "bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white shadow-lg shadow-rose-200/40 scale-[1.02]"
                              : "bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-white"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {b}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Department</h4>
                    <div className="flex flex-wrap gap-2">
                      {DEPARTMENTS.map(d => (
                        <button
                          key={d}
                          onClick={() => setData(prev => ({ ...prev, department: d }))}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            data.department === d
                              ? "bg-neutral-900 text-white shadow-lg"
                              : "bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Staff Room */}
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                      Staff Room Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., A-301"
                      value={data.staffRoomNumber}
                      onChange={(e) => setData(prev => ({ ...prev, staffRoomNumber: sanitizeRoomNumber(e.target.value) }))}
                      className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl font-medium focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none transition-all placeholder:text-neutral-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Save Button (Step 2 only) */}
          {step === 2 && (
            <div className="p-5 border-t border-neutral-100 bg-white">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={isSaving || !data.userType}
                className="w-full py-3.5 bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white text-sm font-bold rounded-2xl shadow-xl shadow-rose-200/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
