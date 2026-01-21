export const validatePasswordStrict = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;

  if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && hasMinLength) {
    return undefined;
  }

  return 'Please follow the password rules strictly';
};

export const validateMobileStrict = (mobile: string): string | undefined => {
    if (!mobile || mobile.length < 8) return undefined;
    if (mobile.length !== 10) return 'Mobile number must have 10 digits';
    
    // Check for repetitive/continuous sequences
    if (/^(\d)\1+$/.test(mobile)) return 'Invalid mobile number'; // All same digits
    if ('01234567890123456789'.includes(mobile)) return 'Invalid mobile number'; // 123456...
    if ('98765432109876543210'.includes(mobile)) return 'Invalid mobile number'; // 987654...
    
    return undefined;
};

export const validateEmailStrict = (email: string): string | undefined => {
    if (!email || !email.includes('@')) return undefined;
    if (!email.toLowerCase().endsWith('@charusat.edu.in')) {
      return 'Use @charusat.edu.in domain';
    }
    return undefined;
};
