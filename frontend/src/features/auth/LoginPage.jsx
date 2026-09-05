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
        <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
          Sign In to Your Account
        </h2>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <FormField
          label="EMAIL ADDRESS"
          name="email"
          type="email"
          placeholder="admin@payflux.com"
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
          disabled={isSubmitting}
          className="w-full mt-6 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing In...
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
