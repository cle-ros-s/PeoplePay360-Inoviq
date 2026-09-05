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
  PieChart,
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Bell,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { Role } from '../../utils/constants';

// Zod Schema with clear validation rules
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Modern P-shaped PayFlux Brand Logo Vector
function PayFluxLogo({ className = 'w-9 h-9', showText = true, isLight = true }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="pGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4F81" />
              <stop offset="100%" stopColor="#7B2FF7" />
            </linearGradient>
            <linearGradient id="pGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7B2FF7" />
              <stop offset="100%" stopColor="#FF4F81" />
            </linearGradient>
          </defs>
          {/* Stylized Modern P Ribbon Folds */}
          <path
            d="M8 8C8 5.79086 9.79086 4 12 4H26C33.732 4 40 10.268 40 18C40 25.732 33.732 32 26 32H16V38C16 40.2091 14.2091 42 12 42C9.79086 42 8 40.2091 8 38V8Z"
            fill="url(#pGrad1)"
          />
          <path
            d="M16 12H25C28.3137 12 31 14.6863 31 18C31 21.3137 28.3137 24 25 24H16V12Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          <path
            d="M8 20L20 32H12C9.79086 32 8 30.2091 8 28V20Z"
            fill="url(#pGrad2)"
            fillOpacity="0.8"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className={`text-2xl font-black tracking-tight ${isLight ? 'text-white' : 'text-[#110C35]'}`}>
              Pay
            </span>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#FF4F81] to-[#7B2FF7] bg-clip-text text-transparent">
              Flux
            </span>
          </div>
          <span className={`text-[10px] font-semibold tracking-wider uppercase -mt-1 ${isLight ? 'text-purple-200/80' : 'text-purple-900/60'}`}>
            HR &amp; Payroll Simplified
          </span>
        </div>
      )}
    </div>
  );
}

// Realistic Dashboard Monitor Illustration with 3D aesthetic
function DashboardMonitorIllustration() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      {/* Background ambient glowing gradient aura */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-[#7B2FF7]/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-10 w-72 h-72 bg-[#FF4F81]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative concentric background arcs */}
      <svg
        className="absolute -top-16 -right-16 w-64 h-64 text-white/5 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
      </svg>

      {/* Decorative dot matrix grid */}
      <div className="absolute -top-6 right-10 grid grid-cols-5 gap-2.5 opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>

      {/* Desktop Monitor Screen Frame */}
      <div className="relative z-10 bg-[#140E36] p-2.5 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-white/10 backdrop-blur-md">
        {/* Inner Monitor Display */}
        <div className="bg-[#F8F9FD] rounded-xl overflow-hidden shadow-inner text-gray-800 flex h-[270px]">
          {/* Mini Left Sidebar */}
          <div className="w-12 bg-[#1A1245] flex flex-col items-center py-3.5 gap-3 shrink-0 border-r border-white/5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF4F81] to-[#7B2FF7] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-purple-300">
              <Users className="w-3 h-3" />
            </div>
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-purple-300/60">
              <Calendar className="w-3 h-3" />
            </div>
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-purple-300/60">
              <DollarSign className="w-3 h-3" />
            </div>
          </div>

          {/* Main Dashboard Preview Content */}
          <div className="flex-1 p-3.5 flex flex-col justify-between overflow-hidden">
            {/* Top mini header bar */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
              <span className="text-xs font-bold text-gray-900 tracking-tight">Dashboard</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 text-[9px] text-gray-400">
                  <Search className="w-2.5 h-2.5" />
                  <span>Search...</span>
                </div>
                <div className="relative">
                  <Bell className="w-3 h-3 text-gray-500" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#FF4F81] rounded-full" />
                </div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 border border-white flex items-center justify-center text-[9px] text-white font-bold">
                  S
                </div>
              </div>
            </div>

            {/* 4 Realistic Stat Cards in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 my-auto">
              {/* Card 1: Employees */}
              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-medium text-gray-400 leading-tight">Employees</div>
                  <div className="text-xs font-extrabold text-gray-900 leading-tight">245</div>
                  <div className="text-[8px] text-emerald-600 font-semibold leading-none mt-0.5">Active Employees</div>
                </div>
              </div>

              {/* Card 2: On Leave */}
              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-medium text-gray-400 leading-tight">On Leave</div>
                  <div className="text-xs font-extrabold text-gray-900 leading-tight">18</div>
                  <div className="text-[8px] text-amber-600 font-semibold leading-none mt-0.5">This Month</div>
                </div>
              </div>

              {/* Card 3: Total Payroll */}
              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">₹</span>
                </div>
                <div>
                  <div className="text-[9px] font-medium text-gray-400 leading-tight">Total Payroll</div>
                  <div className="text-xs font-extrabold text-gray-900 leading-tight">₹ 24,80,000</div>
                  <div className="text-[8px] text-pink-600 font-semibold leading-none mt-0.5">This Month</div>
                </div>
              </div>

              {/* Card 4: Payroll Trend Chart */}
              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-medium">
                  <span>Payroll Trend</span>
                  <TrendingUp className="w-2.5 h-2.5 text-purple-600" />
                </div>
                <div className="h-6 w-full mt-1">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4F81" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#7B2FF7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 25 Q 15 18, 30 20 T 60 10 T 85 14 T 100 4 L 100 30 L 0 30 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M0 25 Q 15 18, 30 20 T 60 10 T 85 14 T 100 4"
                      fill="none"
                      stroke="#FF4F81"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="30" cy="20" r="2" fill="#7B2FF7" />
                    <circle cx="60" cy="10" r="2" fill="#FF4F81" />
                    <circle cx="100" cy="4" r="2.5" fill="#FF4F81" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitor Stand & Base */}
      <div className="relative z-0 flex flex-col items-center -mt-1">
        <div className="w-16 h-8 bg-gradient-to-b from-[#1C1448] to-[#120B33] shadow-md border-x border-white/5" />
        <div className="w-36 h-3 bg-gradient-to-r from-[#170E3B] via-[#2D1B69] to-[#170E3B] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-white/10" />
      </div>

      {/* Potted Plant Accessory (Left) */}
      <div className="absolute -bottom-2 -left-6 z-20 flex flex-col items-center">
        <div className="flex gap-1 -mb-1">
          <div className="w-3 h-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full rotate-[-25deg] transform origin-bottom" />
          <div className="w-3.5 h-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transform origin-bottom -translate-y-1" />
          <div className="w-3 h-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full rotate-[25deg] transform origin-bottom" />
        </div>
        <div className="w-8 h-8 bg-gradient-to-b from-white to-gray-200 rounded-b-xl rounded-t-sm shadow-md border border-white/40" />
      </div>

      {/* Pink Coffee Mug (Right) */}
      <div className="absolute -bottom-1 -right-4 z-20 flex items-center">
        <div className="w-7 h-8 bg-gradient-to-b from-[#FF4F81] to-[#E03A6C] rounded-b-lg rounded-t-sm shadow-md relative">
          {/* Mug Handle */}
          <div className="absolute top-1.5 -right-2.5 w-3 h-4 border-2 border-[#FF4F81] rounded-r-md" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

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
      setErrorMessage(apiMsg || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-[#0D0728] font-sans antialiased text-gray-900">
      {/* ========================================================================= */}
      {/* LEFT SECTION - Dark Navy/Purple Marketing & Dashboard Preview Panel      */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen lg:min-h-0 bg-gradient-to-br from-[#09041E] via-[#120738] to-[#250C5E] text-white p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Subtle Decorative Background Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7B2FF7]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FF4F81]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <PayFluxLogo className="w-10 h-10" showText={true} isLight={true} />
        </div>

        {/* Center Content: Headline, Subtitle & Monitor Illustration */}
        <div className="relative z-10 my-auto py-6 space-y-6 max-w-xl">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-5xl font-black tracking-tight leading-[1.15]">
              Smarter HR.<br />
              Seamless Payroll.<br />
              <span className="bg-gradient-to-r from-[#FF4F81] via-[#D83B9B] to-[#7B2FF7] bg-clip-text text-transparent">
                Stronger Teams.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-purple-200/75 leading-relaxed font-normal max-w-lg">
              Manage your workforce, attendance, leaves, payroll and insights — all in one powerful platform.
            </p>
          </div>

          {/* Desktop Monitor Dashboard Illustration */}
          <div className="pt-2">
            <DashboardMonitorIllustration />
          </div>
        </div>

        {/* Bottom 3 Compact Feature Highlights */}
        <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-purple-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Secure</div>
              <div className="text-[11px] text-purple-200/60 leading-tight mt-0.5">Your data is safe with us</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-[#FF4F81] shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Efficient</div>
              <div className="text-[11px] text-purple-200/60 leading-tight mt-0.5">Automate HR &amp; Payroll tasks</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Insightful</div>
              <div className="text-[11px] text-purple-200/60 leading-tight mt-0.5">Data-driven decisions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION - Soft Lavender Canvas with Centered Premium White Login Card */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen lg:min-h-0 bg-[#F7F8FE] p-6 sm:p-10 lg:p-12 xl:p-16 flex items-center justify-center relative overflow-hidden">
        {/* Subtle Decorative Dot Matrix in Bottom Right */}
        <div className="absolute bottom-6 right-8 grid grid-cols-6 gap-3 opacity-30 pointer-events-none hidden sm:grid">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          ))}
        </div>

        {/* Decorative Light Glow Behind Card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Centered White Login Card */}
        <div className="relative z-10 w-full max-w-[540px] bg-white rounded-[24px] sm:rounded-[28px] p-8 sm:p-11 lg:p-12 shadow-[0_20px_60px_rgba(23,15,68,0.06)] border border-purple-100/60 backdrop-blur-sm">
          {/* Card Top Branding Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-50 to-pink-50 border border-purple-100/80 flex items-center justify-center shadow-xs mb-4">
              <PayFluxLogo className="w-9 h-9" showText={false} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#110C35] tracking-tight">
              Welcome back!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1.5">
              Sign in to access your PayFlux account
            </p>
          </div>

          {/* Authentication Error Feedback Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`w-full pl-10 pr-3.5 py-3 text-sm bg-gray-50/70 focus:bg-white border rounded-xl transition-all outline-none ${
                    errors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-3 focus:ring-purple-500/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-600 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-3 text-sm bg-gray-50/70 focus:bg-white border rounded-xl transition-all outline-none ${
                    errors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-3 focus:ring-purple-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-600 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Right-Aligned Link */}
            <div className="flex items-center justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-semibold text-[#7B2FF7] hover:text-[#9333EA] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Full-width Gradient Sign In Button */}
            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 transition-all duration-200 disabled:opacity-60 cursor-pointer select-none mt-2"
              style={{
                background: 'linear-gradient(90deg, #FF4F81 0%, #B034B7 50%, #7B2FF7 100%)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(123, 47, 247, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(123, 47, 247, 0.25)';
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Forgot Password Modal Assistance                                         */}
      {/* ========================================================================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7B2FF7] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your work email address to receive password recovery instructions.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password reset link sent to your email address.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF4F81] to-[#7B2FF7] rounded-lg shadow-sm hover:opacity-95 transition-opacity"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
