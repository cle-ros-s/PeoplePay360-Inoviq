import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/common/FormField';
import { LogIn, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Role } from '../../utils/constants';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const user = await login(values.email, values.password);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === Role.EMPLOYEE) {
        navigate('/attendance', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      const apiMsg = error.response?.data?.error?.message;
      setErrorMessage(apiMsg || 'Invalid credentials. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold" style={{ color: '#212121' }}>Welcome back</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Sign in to your account to continue</p>
        </div>

        {errorMessage && (
          <div
            className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.20)',
              color: '#DC2626',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <FormField
          label="EMAIL ADDRESS"
          name="email"
          type="email"
          placeholder="admin@peoplepay360.dev"
          register={register}
          error={errors.email}
          required
        />

        <div className="relative">
          <FormField
            label="PASSWORD"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            register={register}
            error={errors.password}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors p-1"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          id="login-submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
            boxShadow: '0 6px 20px rgba(113,75,103,0.35)',
          }}
          onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.boxShadow = '0 8px 28px rgba(113,75,103,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,75,103,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
