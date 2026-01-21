/**
 * Password Strength Indicator Component
 * 
 * Features:
 * - Progress bar only (no individual checkmarks visible)
 * - Static rules text displayed
 * - 8-15 character validation
 * - Uppercase, lowercase, number, special required
 */

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export default function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  
  // Calculate password strength (internal - user doesn't see individual checks)
  const analysis = useMemo(() => {
    // Check all requirements
    const checks = {
      minLength: password.length >= 8,
      maxLength: password.length <= 15,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    // Count met requirements (excluding maxLength as it's a limit not requirement)
    const metCount = [
      checks.minLength,
      checks.hasUppercase,
      checks.hasLowercase,
      checks.hasNumber,
      checks.hasSpecial,
    ].filter(Boolean).length;
    
    // Length check
    const lengthValid = password.length >= 8 && password.length <= 15;
    
    // Calculate strength percentage (0-100)
    let percentage = 0;
    let strengthLabel = '';
    let barColor = 'bg-gray-200';
    
    if (password.length === 0) {
      percentage = 0;
      strengthLabel = '';
    } else if (!lengthValid && password.length > 15) {
      percentage = 25;
      strengthLabel = 'Too Long';
      barColor = 'bg-red-500';
    } else if (metCount <= 1) {
      percentage = 20;
      strengthLabel = 'Weak';
      barColor = 'bg-red-500';
    } else if (metCount === 2) {
      percentage = 40;
      strengthLabel = 'Fair';
      barColor = 'bg-orange-500';
    } else if (metCount === 3) {
      percentage = 60;
      strengthLabel = 'Good';
      barColor = 'bg-yellow-500';
    } else if (metCount === 4) {
      percentage = 80;
      strengthLabel = 'Strong';
      barColor = 'bg-green-400';
    } else if (metCount === 5) {
      percentage = 100;
      strengthLabel = 'Excellent';
      barColor = 'bg-green-500';
    }

    return { percentage, strengthLabel, barColor, checks };
  }, [password]);

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-2"
    >
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-500 font-medium">Password Strength</span>
          {analysis.strengthLabel && (
            <span className={`font-semibold ${
              analysis.strengthLabel === 'Weak' || analysis.strengthLabel === 'Too Long' ? 'text-red-500' :
              analysis.strengthLabel === 'Fair' ? 'text-orange-500' :
              analysis.strengthLabel === 'Good' ? 'text-yellow-600' :
              'text-green-500'
            }`}>
              {analysis.strengthLabel}
            </span>
          )}
        </div>
        
        {/* Smooth Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${analysis.barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${analysis.percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Static Rules Text (only text, no checkmarks) */}
      {showRequirements && (
        <p className="text-[11px] text-dark-400 leading-relaxed">
          Use 8-15 characters with uppercase, lowercase, number, and special character.
        </p>
      )}
    </motion.div>
  );
}
