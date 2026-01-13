/**
 * Password Strength Indicator Component
 * 
 * Features:
 * - Real-time strength calculation
 * - Animated strength bars
 * - Requirement checklist with icons
 * - LightswindUI inspired design
 */

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
  regex: RegExp;
}

export default function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  
  // Calculate password strength and requirements
  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { label: 'At least 8 characters', met: password.length >= 8, regex: /.{8,}/ },
      { label: 'One uppercase letter', met: /[A-Z]/.test(password), regex: /[A-Z]/ },
      { label: 'One lowercase letter', met: /[a-z]/.test(password), regex: /[a-z]/ },
      { label: 'One number', met: /[0-9]/.test(password), regex: /[0-9]/ },
      { label: 'One special character', met: /[^A-Za-z0-9]/.test(password), regex: /[^A-Za-z0-9]/ },
    ];

    const metCount = requirements.filter(r => r.met).length;
    
    let strength: 'none' | 'weak' | 'fair' | 'good' | 'strong' = 'none';
    let strengthLabel = '';
    let strengthColor = 'bg-dark-200';
    let textColor = 'text-dark-400';
    let barsActive = 0;

    if (password.length === 0) {
      strength = 'none';
      strengthLabel = '';
      barsActive = 0;
    } else if (metCount <= 1) {
      strength = 'weak';
      strengthLabel = 'Weak';
      strengthColor = 'bg-red-500';
      textColor = 'text-red-500';
      barsActive = 1;
    } else if (metCount <= 2) {
      strength = 'fair';
      strengthLabel = 'Fair';
      strengthColor = 'bg-orange-500';
      textColor = 'text-orange-500';
      barsActive = 2;
    } else if (metCount <= 4) {
      strength = 'good';
      strengthLabel = 'Good';
      strengthColor = 'bg-yellow-500';
      textColor = 'text-yellow-500';
      barsActive = 3;
    } else {
      strength = 'strong';
      strengthLabel = 'Strong';
      strengthColor = 'bg-green-500';
      textColor = 'text-green-500';
      barsActive = 4;
    }

    return { requirements, strength, strengthLabel, strengthColor, textColor, barsActive };
  }, [password]);

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-2"
    >
      {/* Strength Bars */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map((bar) => (
            <motion.div
              key={bar}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                bar <= analysis.barsActive ? analysis.strengthColor : 'bg-dark-100'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: bar * 0.1, duration: 0.2 }}
            />
          ))}
        </div>
        {analysis.strengthLabel && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xs font-semibold ${analysis.textColor}`}
          >
            {analysis.strengthLabel}
          </motion.span>
        )}
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-cream-50 rounded-xl p-3 border border-dark-100"
        >
          <p className="text-[10px] uppercase tracking-wider text-dark-400 font-semibold mb-2">
            Password Requirements
          </p>
          <div className="grid grid-cols-1 gap-1">
            {analysis.requirements.map((req, index) => (
              <motion.div
                key={req.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 text-xs ${
                  req.met ? 'text-green-600' : 'text-dark-400'
                }`}
              >
                {req.met ? (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
                <span className={req.met ? 'line-through opacity-60' : ''}>{req.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
