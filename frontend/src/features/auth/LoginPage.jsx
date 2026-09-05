import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  PieChart as PieChartIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Role } from '../../utils/constants';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@payflux.com', name: 'Tony Stark' },
  { role: 'HR Manager', email: 'hr.manager@payflux.com', name: 'Sarah Connor' },
  { role: 'Payroll Manager', email: 'payroll.manager@payflux.com', name: 'Dwight Schrute' },
  { role: 'Payroll Specialist', email: 'payroll.user@payflux.com', name: 'Michael Scott' },
  { role: 'Employee', email: 'employee@payflux.com', name: 'Jim Halpert' },
];

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
    setValue,
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

  const handleQuickFill = (email) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080720] relative overflow-hidden font-sans select-none">
      {/* ========================================================= */}
      {/* LEFT SHOWCASE PANEL (Branded Visuals & 3D Desktop Mockup) */}
      {/* ========================================================= */}
      <div className="lg:w-[58%] xl:w-[60%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 overflow-hidden bg-gradient-to-br from-[#07061d] via-[#0e0a38] to-[#1a0c4f]">
        {/* Background Ambient Glow & Dot Matrix */}
        <div className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-80px] w-[450px] h-[450px] bg-pink-600/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Subtle Background Geometric Grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* 1. Header / Brand Logo */}
        <div className="flex items-center gap-3 relative z-10 animate-fadeInUp">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FF3366] via-[#D83A92] to-[#7928CA] flex items-center justify-center shadow-lg shadow-pink-500/25 p-0.5">
            <div className="w-full h-full bg-[#0d0a28]/60 rounded-[10px] backdrop-blur-xs flex items-center justify-center">
              <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-pink-400 via-rose-300 to-white">
                P
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-white">Pay</span>
              <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Flux
              </span>
            </div>
            <p className="text-[11px] font-medium text-purple-200/70 tracking-wide uppercase">
              HR &amp; Payroll Simplified
            </p>
          </div>
        </div>

        {/* 2. Hero Headline & Description */}
        <div className="my-8 lg:my-auto max-w-xl relative z-10 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] font-extrabold tracking-tight leading-[1.12] text-white">
            Smarter HR. <br />
            Seamless Payroll. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B72] via-[#E040FB] to-[#7C4DFF]">
              Stronger Teams.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-purple-100/75 leading-relaxed max-w-lg font-normal">
            Manage your workforce, attendance, leaves, payroll and insights — all in one powerful platform.
          </p>

          {/* 3. 3D Stylized Interactive Desktop Screen Mockup */}
          <div className="mt-8 relative max-w-lg lg:max-w-xl group">
            {/* Monitor Outer Casing */}
            <div className="bg-[#1c1840]/90 p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-purple-500/30 backdrop-blur-md relative overflow-hidden transition-transform duration-500 hover:scale-[1.01]">
              {/* Screen Top Bar */}
              <div className="bg-[#0e0c24] rounded-xl overflow-hidden border border-white/5">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#171436] border-b border-white/5 text-[10px] text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-gray-300 ml-2">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 px-2 py-0.5 rounded-md text-[9px] text-gray-400">Search...</div>
                    <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center text-[9px]">🔔</div>
                    <div className="w-4 h-4 rounded-full bg-pink-500 text-[8px] font-bold flex items-center justify-center text-white">TS</div>
                  </div>
                </div>

                {/* Inside Screen Dashboard Layout */}
                <div className="flex bg-[#0b0920] p-2.5 gap-2.5">
                  {/* Mini Sidebar */}
                  <div className="w-8 bg-[#18153b] rounded-lg flex flex-col items-center py-2 gap-2 shrink-0 border border-white/5">
                    <div className="w-5 h-5 rounded-md bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ⚡
                    </div>
                    <div className="w-4 h-4 rounded text-gray-400 flex items-center justify-center text-[9px] hover:text-white">👤</div>
                    <div className="w-4 h-4 rounded text-gray-400 flex items-center justify-center text-[9px] hover:text-white">📅</div>
                    <div className="w-4 h-4 rounded text-gray-400 flex items-center justify-center text-[9px] hover:text-white">💳</div>
                    <div className="w-4 h-4 rounded text-gray-400 flex items-center justify-center text-[9px] hover:text-white">📊</div>
                    <div className="w-4 h-4 rounded text-gray-400 flex items-center justify-center text-[9px] hover:text-white mt-auto">⚙️</div>
                  </div>

                  {/* Dashboard Content Grid */}
                  <div className="flex-1 space-y-2">
                    {/* Top Row Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#19153c] p-2 rounded-lg border border-white/5 shadow-xs flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 leading-none">Employees</p>
                          <p className="text-xs font-bold text-white mt-0.5 leading-none">245</p>
                          <p className="text-[8px] text-emerald-400 mt-0.5 leading-none">Active Staff</p>
                        </div>
                      </div>

                      <div className="bg-[#19153c] p-2 rounded-lg border border-white/5 shadow-xs flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 leading-none">On Leave</p>
                          <p className="text-xs font-bold text-white mt-0.5 leading-none">18</p>
                          <p className="text-[8px] text-amber-400 mt-0.5 leading-none">This Month</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#19153c] p-2 rounded-lg border border-white/5 shadow-xs flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 leading-none">Total Payroll</p>
                          <p className="text-xs font-bold text-white mt-0.5 leading-none">₹ 24,80,000</p>
                          <p className="text-[8px] text-pink-400 mt-0.5 leading-none">This Month</p>
                        </div>
                      </div>

                      {/* Payroll Trend Sparkline */}
                      <div className="bg-[#19153c] p-2 rounded-lg border border-white/5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-gray-400">Payroll Trend</p>
                          <TrendingUp className="w-2.5 h-2.5 text-pink-400" />
                        </div>
                        <div className="mt-1 h-5 flex items-end justify-between gap-1 px-1">
                          <span className="w-1.5 h-2 bg-pink-500/40 rounded-t-xs" />
                          <span className="w-1.5 h-3 bg-pink-500/60 rounded-t-xs" />
                          <span className="w-1.5 h-2.5 bg-pink-500/50 rounded-t-xs" />
                          <span className="w-1.5 h-4 bg-pink-500/80 rounded-t-xs" />
                          <span className="w-1.5 h-5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-t-xs shadow-xs shadow-pink-500/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitor Stand */}
            <div className="w-14 h-4 bg-gradient-to-b from-[#1c1840] to-[#120f2e] mx-auto -mt-0.5 shadow-md" />
            <div className="w-28 h-2 bg-gradient-to-r from-transparent via-[#2a245a] to-transparent mx-auto rounded-full shadow-lg" />
          </div>
        </div>

        {/* 4. Bottom 3 Feature Badges */}
        <div className="pt-6 border-t border-purple-500/20 grid grid-cols-3 gap-4 relative z-10 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {/* Secure */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-purple-400/40 bg-purple-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Secure</p>
              <p className="text-[11px] text-purple-200/65 leading-tight mt-0.5">Your data is safe with us</p>
            </div>
          </div>

          {/* Efficient */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-pink-400/40 bg-pink-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Efficient</p>
              <p className="text-[11px] text-purple-200/65 leading-tight mt-0.5">Automate HR &amp; Payroll tasks</p>
            </div>
          </div>

          {/* Insightful */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-indigo-400/40 bg-indigo-500/10 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Insightful</p>
              <p className="text-[11px] text-purple-200/65 leading-tight mt-0.5">Data-driven decisions</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT LOGIN FORM PANEL (Clean, Floating White Card)       */}
      {/* ========================================================= */}
      <div className="lg:w-[42%] xl:w-[40%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-[#f8f9fe] relative z-10">
        {/* Background Subtle Dot Pattern */}
        <div
          className="absolute bottom-6 right-6 w-32 h-32 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #7c4dff 1px, transparent 0)`,
            backgroundSize: '12px 12px',
          }}
        />

        {/* Ambient Top Light */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200/30 rounded-full blur-[90px] pointer-events-none" />

        {/* The White Login Card */}
        <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-100 relative z-10 animate-fadeInUp">
          {/* Card Top P Emblem */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF3366] via-[#D83A92] to-[#7928CA] flex items-center justify-center shadow-lg shadow-pink-500/20 p-0.5">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-[#FF3366] to-[#7928CA]">
                  P
                </span>
              </div>
            </div>
          </div>

          {/* Welcome back! Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Welcome back!</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Sign in to access your PayFlux account
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`w-full bg-white border ${
                    errors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500/20'
                  } rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all shadow-2xs focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full bg-white border ${
                    errors.password ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500/20'
                  } rounded-xl py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all shadow-2xs focus:outline-none focus:ring-2`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setErrorMessage('Please contact your HR administrator to reset your password.')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Gradient Button */}
            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #FF3366 0%, #D83A92 50%, #7928CA 100%)',
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2.5">
              1-Click Demo Login Roles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-200 rounded-lg transition-all shadow-2xs"
                  title={`Click to fill credentials for ${acc.name} (${acc.email})`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-xs text-gray-400 font-medium text-center">
          © {new Date().getFullYear()} PayFlux Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
