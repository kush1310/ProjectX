import { z } from 'zod';

// --- Validation Schemas ---

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .refine((val) => val.endsWith('@charusat.edu.in'), {
      message: 'Only @charusat.edu.in university emails are allowed'
    }),
  password: z.string().min(1, 'Password is required')
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .refine((val) => val.endsWith('@charusat.edu.in'), {
      message: 'Only @charusat.edu.in university emails are allowed for security'
    }),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (@$!%*?&)"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the Terms & Privacy")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// --- Types ---

export type LoginFormData = z.infer<typeof loginSchema> & { rememberMe: boolean };
export type SignupFormData = z.infer<typeof signupSchema>;
export interface FormErrors { [key: string]: string | undefined }
