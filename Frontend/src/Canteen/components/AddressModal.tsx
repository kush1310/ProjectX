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
  User,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import api from "@/utils/api";
import { toast } from "@/utils/toast";
import CharusatCampusMap, { CampusLocation } from "./CharusatCampusMap";

export interface AddressData {
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

// 9 Boys Hostels per 2026 Reference Specification
const BOYS_HOSTELS = [
  "Shreedeep", "Nisarg", "Ohm",
  "Royal Care", "Sahajanand", "Prince",
  "Neelkanth", "Darshan", "Patel",
];

// Girls Hostels
const GIRLS_HOSTELS = [
  "H1", "H2", "H3",
  "H4", "H5", "H6",
  "H7", "H8", "H9",
];

// 3x3 Building Grid per Reference Screen 4
const BUILDINGS = [
  "CSPIT", "DEPSTAR", "RPCP",
  "CMPICA", "IIM", "PDPIAS",
  "BDIPS", "MTIN", "ARIP",
];

// Department Chips per Reference Screen 4
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
    userType: "",
    hostelName: "",
    roomNumber: "",
    buildingNumber: "",
    department: "",
    staffRoomNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hostelType, setHostelType] = useState<"boys" | "girls">("boys");
  const [step, setStep] = useState(1); // 1 = Who are you?, 2 = Details

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      if (initialData.hostelName && /^H\d+$/.test(initialData.hostelName)) {
        setHostelType("girls");
      }
      if (initialData.userType) {
        setStep(2);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setStep(initialData?.userType ? 2 : 1);
    }
  }, [isOpen, initialData]);

  const handleSelectRole = (type: "STUDENT" | "TEACHER") => {
    setData((prev) => ({ ...prev, userType: type }));
  };

  const handleContinueStep1 = () => {
    if (!data.userType) {
      toast.error("Please select whether you are a Student or Faculty");
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!data.userType) {
      toast.error("Please select Student or Faculty");
      return;
    }
    if (data.userType === "STUDENT" && !data.hostelName) {
      toast.error("Please select your hostel");
      return;
    }
    if (data.userType === "TEACHER" && !data.buildingNumber) {
      toast.error("Please select your building");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put("/users/profile/address", data);
      if (response.data.success) {
        toast.success("Location saved successfully");
        onSave(data);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  const hostels = hostelType === "girls" ? GIRLS_HOSTELS : BOYS_HOSTELS;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-neutral-100"
        >
          {/* Top Progress & Navigation Header */}
          <div className="pt-4 px-6 pb-2 bg-white relative">
            <div className="flex items-center justify-between mb-3">
              {step === 2 ? (
                <button
                  onClick={() => setStep(1)}
                  className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-600"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}

              <div className="text-center">
                <span className="text-[11px] font-black text-[#E23744] uppercase tracking-widest block">
                  {step === 1 ? "STEP 1 OF 2" : "STEP 2 OF 2"}
                </span>
                <div className="w-24 h-1 bg-neutral-100 rounded-full mt-1.5 overflow-hidden mx-auto">
                  <motion.div
                    className="h-full bg-[#E23744] rounded-full"
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <AnimatePresence mode="wait">
              {/* ────────────────────────────────────────────────────────
                  STEP 1: ROLE SELECTION ("Who are you?")
                  ──────────────────────────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1C1C1C] tracking-tight">
                      Who are you?
                    </h2>
                    <p className="text-sm text-neutral-500 font-medium mt-1">
                      Select your role at CHARUSAT
                    </p>
                  </div>

                  {/* Student Role Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole("STUDENT")}
                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      data.userType === "STUDENT"
                        ? "border-[#E23744] bg-[#FFF5F5] shadow-md shadow-rose-100/40"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        data.userType === "STUDENT"
                          ? "bg-[#FFE5E7] text-[#E23744]"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[#1C1C1C]">Student</h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        I live in a hostel on campus
                      </p>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        data.userType === "STUDENT"
                          ? "bg-[#E23744] text-white"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Faculty Role Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole("TEACHER")}
                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      data.userType === "TEACHER"
                        ? "border-[#E23744] bg-[#FFF5F5] shadow-md shadow-rose-100/40"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        data.userType === "TEACHER"
                          ? "bg-[#FFE5E7] text-[#E23744]"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[#1C1C1C]">Faculty</h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        I work in a department building
                      </p>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        data.userType === "TEACHER"
                          ? "bg-[#E23744] text-white"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* CHARUSAT Campus Monument & Entrance Illustration */}
                  <div className="pt-2">
                    <div className="rounded-2xl overflow-hidden border border-neutral-100 bg-gradient-to-b from-sky-50/50 to-emerald-50/50 p-4 text-center relative shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-neutral-600 tracking-wide">
                          CHARUSAT University Campus, Changa
                        </span>
                      </div>

                      {/* Stylized Campus Gate Graphic */}
                      <svg
                        viewBox="0 0 340 120"
                        className="w-full h-24 mx-auto"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Background sky & trees */}
                        <circle cx="60" cy="50" r="30" fill="#BBF7D0" opacity="0.6" />
                        <circle cx="280" cy="50" r="32" fill="#BBF7D0" opacity="0.6" />
                        <rect x="40" y="30" width="120" height="60" rx="6" fill="#F1F5F9" />
                        <rect x="180" y="30" width="120" height="60" rx="6" fill="#F1F5F9" />
                        {/* Windows */}
                        <rect x="52" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        <rect x="74" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        <rect x="96" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        <rect x="194" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        <rect x="216" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        <rect x="238" y="40" width="12" height="14" rx="2" fill="#CBD5E1" />
                        {/* Gate Pillars & Entrance */}
                        <rect x="120" y="20" width="14" height="80" rx="3" fill="#E2E8F0" />
                        <rect x="206" y="20" width="14" height="80" rx="3" fill="#E2E8F0" />
                        <rect x="120" y="18" width="100" height="8" rx="2" fill="#E23744" />
                        {/* Central Monument Plaque */}
                        <rect x="135" y="65" width="70" height="26" rx="4" fill="#1C1C1C" />
                        <text
                          x="170"
                          y="82"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          letterSpacing="1"
                        >
                          CHARUSAT
                        </text>
                        {/* Road / Ground line */}
                        <path d="M0 100 H340" stroke="#CBD5E1" strokeWidth="3" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ────────────────────────────────────────────────────────
                  STEP 2: STUDENT HOSTEL SELECTION ("Your Hostel")
                  ──────────────────────────────────────────────────────── */}
              {step === 2 && data.userType === "STUDENT" && (
                <motion.div
                  key="step2-student"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-2xl font-black text-[#1C1C1C] tracking-tight">
                      Your Hostel
                    </h2>
                    <p className="text-sm text-neutral-500 font-medium mt-0.5">
                      Select your hostel at CHARUSAT
                    </p>
                  </div>

                  {/* Interactive Map Container */}
                  <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
                    <div className="bg-neutral-50 px-3.5 py-2 border-b border-neutral-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#E23744] flex-shrink-0" />
                        <span className="text-[11px] font-bold text-neutral-700 truncate">
                          CHARUSAT CAMPUS INTERACTIVE MAP
                        </span>
                      </div>
                    </div>
                    <CharusatCampusMap
                      mode="select"
                      height="h-44"
                      onSelectLocation={(loc: CampusLocation) => {
                        if (loc.type === "hostel") {
                          setData((prev) => ({ ...prev, hostelName: loc.name }));
                          toast.success(`Selected ${loc.name}`);
                        } else if (loc.type === "building") {
                          setData((prev) => ({ ...prev, buildingNumber: loc.code }));
                          toast.success(`Selected ${loc.name}`);
                        }
                      }}
                    />
                  </div>

                  {/* Boys Hostel / Girls Hostel Segmented Toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHostelType("boys");
                        setData((prev) => ({ ...prev, hostelName: "" }));
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        hostelType === "boys"
                          ? "bg-[#E23744] text-white shadow-md shadow-rose-200"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Boys Hostel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHostelType("girls");
                        setData((prev) => ({ ...prev, hostelName: "" }));
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        hostelType === "girls"
                          ? "bg-[#E23744] text-white shadow-md shadow-rose-200"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Girls Hostel
                    </button>
                  </div>

                  {/* Select Hostel 3x3 Chip Grid */}
                  <div>
                    <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2.5">
                      SELECT HOSTEL
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {hostels.map((h) => {
                        const isSelected = data.hostelName === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setData((prev) => ({ ...prev, hostelName: h }))}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all truncate ${
                              isSelected
                                ? "border-2 border-[#E23744] bg-[#FFF5F5] text-[#E23744] shadow-sm"
                                : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                            }`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Number Input */}
                  <div>
                    <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">
                      ROOM NUMBER
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., A-301"
                      value={data.roomNumber}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          roomNumber: sanitizeRoomNumber(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl font-medium focus:border-[#E23744] focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none transition-all placeholder:text-neutral-400"
                    />
                  </div>
                </motion.div>
              )}

              {/* ────────────────────────────────────────────────────────
                  STEP 2: FACULTY BUILDING SELECTION ("Your Building")
                  ──────────────────────────────────────────────────────── */}
              {step === 2 && data.userType === "TEACHER" && (
                <motion.div
                  key="step2-faculty"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-2xl font-black text-[#1C1C1C] tracking-tight">
                      Your Building
                    </h2>
                    <p className="text-sm text-neutral-500 font-medium mt-0.5">
                      Select your building and department
                    </p>
                  </div>

                  {/* 3x3 Building Grid */}
                  <div>
                    <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2.5">
                      SELECT BUILDING
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {BUILDINGS.map((b) => {
                        const isSelected = data.buildingNumber === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setData((prev) => ({ ...prev, buildingNumber: b }))}
                            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                              isSelected
                                ? "border-2 border-[#E23744] bg-[#FFF5F5] text-[#E23744] shadow-sm"
                                : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                            }`}
                          >
                            <Building2 className={`w-4 h-4 ${isSelected ? "text-[#E23744]" : "text-neutral-400"}`} />
                            <span>{b}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Department Chips */}
                  <div>
                    <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2.5">
                      DEPARTMENT
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {DEPARTMENTS.map((dept) => {
                        const isSelected = data.department === dept;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => setData((prev) => ({ ...prev, department: dept }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "border-2 border-[#E23744] bg-[#FFF5F5] text-[#E23744]"
                                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                            }`}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff Room Number */}
                  <div>
                    <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">
                      STAFF ROOM NUMBER
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., A-301"
                      value={data.staffRoomNumber}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          staffRoomNumber: sanitizeRoomNumber(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl font-medium focus:border-[#E23744] focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none transition-all placeholder:text-neutral-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Bottom Actions Container */}
          <div className="p-4 sm:p-5 border-t border-neutral-100 bg-white">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleContinueStep1}
                disabled={!data.userType}
                className="w-full py-3.5 px-6 rounded-full bg-[#E23744] hover:bg-[#D82F3C] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !data.userType}
                className="w-full py-3.5 px-6 rounded-full bg-[#E23744] hover:bg-[#D82F3C] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Location...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Location</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
