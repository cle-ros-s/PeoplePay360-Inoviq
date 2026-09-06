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

// PayFlux Brand Logo with adaptive icon for light & dark backgrounds
function PayFluxLogo({ className = 'w-9 h-9', showText = true, isLight = true }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={isLight ? '/payflux-icon-white.png' : '/payflux-icon.png'}
          alt="PayFlux Logo"
          className="w-full h-full object-contain filter drop-shadow-md"
          draggable={false}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center leading-none">
            <span className={`text-2xl font-black tracking-tight ${isLight ? 'text-white' : 'text-[#0d2b6e]'}`}>
              Pay
            </span>
            <span className={`text-2xl font-black tracking-tight ${isLight ? 'text-[#00d4ff]' : 'text-[#00aadd]'}`}>
              Flux
            </span>
          </div>
          <span className={`text-[11px] font-bold tracking-wider uppercase mt-1 ${isLight ? 'text-blue-200' : 'text-blue-700'}`}>
            HR &amp; Payroll Simplified
          </span>
        </div>
      )}
    </div>
  );
}

// Realistic Dashboard Monitor Illustration with 3D aesthetic & high contrast text
function DashboardMonitorIllustration() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      {/* Background ambient glowing gradient aura */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-[#7B2FF7]/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-10 w-72 h-72 bg-[#FF4F81]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative concentric background arcs */}
      <svg
        className="absolute -top-16 -right-16 w-64 h-64 text-white/10 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" />
      </svg>

      {/* Decorative dot matrix grid */}
      <div className="absolute -top-6 right-10 grid grid-cols-5 gap-2.5 opacity-30 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>

      {/* Desktop Monitor Screen Frame */}
      <div className="relative z-10 bg-[#140E36] p-2.5 sm:p-3 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-white/15 backdrop-blur-md">
        {/* Inner Monitor Display */}
        <div className="bg-[#F8F9FE] rounded-xl overflow-hidden shadow-inner text-slate-800 flex h-[280px]">
          {/* Mini Left Sidebar */}
          <div className="w-12 bg-[#1A1245] flex flex-col items-center py-4 gap-3.5 shrink-0 border-r border-white/10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF4F81] to-[#7B2FF7] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center text-purple-200 hover:bg-white/25 transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-purple-200/80 hover:bg-white/20 transition-colors">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-purple-200/80 hover:bg-white/20 transition-colors">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Main Dashboard Preview Content */}
          <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
            {/* Top mini header bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">Dashboard</span>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-medium text-slate-500 shadow-2xs">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span>Search...</span>
                </div>
                <div className="relative">
                  <Bell className="w-3.5 h-3.5 text-slate-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF4F81] rounded-full ring-2 ring-white" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border border-white flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
                  A
                </div>
              </div>
            </div>

            {/* 4 Realistic Stat Cards in 2x2 Grid with high contrast typography */}
            <div className="grid grid-cols-2 gap-2.5 my-auto">
              {/* Card 1: Employees */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide leading-tight">Employees</div>
                  <div className="text-sm font-black text-slate-900 leading-tight mt-0.5">245</div>
                  <div className="text-[9px] text-emerald-700 font-bold leading-none mt-1">Active Employees</div>
                </div>
              </div>

              {/* Card 2: On Leave */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide leading-tight">On Leave</div>
                  <div className="text-sm font-black text-slate-900 leading-tight mt-0.5">18</div>
                  <div className="text-[9px] text-amber-700 font-bold leading-none mt-1">This Month</div>
                </div>
              </div>

              {/* Card 3: Total Payroll */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  ₹
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide leading-tight">Total Payroll</div>
                  <div className="text-sm font-black text-slate-900 leading-tight mt-0.5">₹ 24,80,000</div>
                  <div className="text-[9px] text-pink-700 font-bold leading-none mt-1">This Month</div>
                </div>
              </div>

              {/* Card 4: Payroll Trend Chart */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  <span>Payroll Trend</span>
                  <TrendingUp className="w-3 h-3 text-purple-700" />
                </div>
                <div className="h-7 w-full mt-1">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4F81" stopOpacity="0.45" />
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
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="30" cy="20" r="2.5" fill="#7B2FF7" />
                    <circle cx="60" cy="10" r="2.5" fill="#FF4F81" />
                    <circle cx="100" cy="4" r="3" fill="#FF4F81" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitor Stand & Base */}
      <div className="relative z-0 flex flex-col items-center -mt-1">
        <div className="w-16 h-8 bg-gradient-to-b from-[#1C1448] to-[#120B33] shadow-md border-x border-white/10" />
        <div className="w-36 h-3 bg-gradient-to-r from-[#170E3B] via-[#2D1B69] to-[#170E3B] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-white/15" />
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
    <div className="min-h-screen w-full flex flex-col md:flex-row md:h-screen md:overflow-hidden bg-[#0A0524] font-sans antialiased text-slate-900">
      {/* ========================================================================= */}
      {/* LEFT SECTION - Dark Navy/Purple Marketing & Dashboard Preview Panel      */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 min-h-screen md:min-h-0 bg-gradient-to-br from-[#09041E]/95 via-[#120738]/90 to-[#250C5E]/95 text-white p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Rich Background Image Texture Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: "url('/payflux_hero_bg.jpg')" }}
        />

        {/* Ambient Gradient Lighting */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7B2FF7]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FF4F81]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <PayFluxLogo className="w-10 h-10" showText={true} isLight={true} />
        </div>

        {/* Center Content: Headline, Subtitle & Monitor Illustration */}
        <div className="relative z-10 my-auto py-4 sm:py-6 space-y-5 sm:space-y-6 max-w-xl">
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-[40px] xl:text-[46px] font-black tracking-tight leading-[1.15] text-white drop-shadow-md">
              Smarter HR.<br />
              Seamless Payroll.<br />
              <span className="bg-gradient-to-r from-[#FF4F81] via-[#F43F5E] to-[#9D54FF] bg-clip-text text-transparent">
                Stronger Teams.
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal max-w-lg">
              Manage your workforce, attendance, leaves, payroll and insights — all in one powerful platform.
            </p>
          </div>

          {/* Desktop Monitor Dashboard Illustration */}
          <div className="pt-1">
            <DashboardMonitorIllustration />
          </div>
        </div>

        {/* Bottom 3 Compact Feature Highlights */}
        <div className="relative z-10 pt-3.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-purple-200 shrink-0 shadow-inner backdrop-blur-xs">
              <Shield className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Secure</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">Your data is safe with us</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#FF4F81] shrink-0 shadow-inner backdrop-blur-xs">
              <Zap className="w-4 h-4 text-[#FF4F81]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Efficient</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">Automate HR &amp; Payroll tasks</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner backdrop-blur-xs">
              <PieChart className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Insightful</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">Data-driven decisions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION - Modern SaaS Soft Lavender/White Textured Canvas          */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 min-h-screen md:min-h-0 bg-[#F4F5FD] p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 flex items-center justify-center relative overflow-hidden">
        {/* Soft Fluid SaaS Artwork Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: "url('/payflux_light_bg.jpg')" }}
        />

        {/* Ambient Gradient Glows */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-300/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-300/25 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative Dot Matrix in Bottom Right */}
        <div className="absolute bottom-6 right-8 grid grid-cols-6 gap-3 opacity-40 pointer-events-none hidden sm:grid z-0">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-600" />
          ))}
        </div>

        {/* Centered White Login Card with Glassmorphic Shadow & Background Logo Shade */}
        <div className="relative z-10 w-full max-w-[560px] bg-white/95 backdrop-blur-xl rounded-[26px] sm:rounded-[32px] p-8 sm:p-12 lg:p-14 shadow-[0_25px_70px_rgba(20,10,70,0.14)] border border-white/80 ring-1 ring-purple-100 overflow-hidden">
          {/* Subtle PayFlux Logo Watermark Shades in Background Whitespace */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 opacity-[0.08] pointer-events-none select-none overflow-hidden rotate-[-12deg] z-0">
            <img
              src="/payflux-icon.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -left-20 -top-10 w-72 h-72 opacity-[0.06] pointer-events-none select-none overflow-hidden rotate-[15deg] z-0">
            <img
              src="/payflux-icon.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          {/* Card Top Branding Header */}
          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <div className="relative mb-4 group">
              {/* Ambient gradient shade / glow behind logo */}
              <div className="absolute -inset-3 bg-gradient-to-r from-[#0d2b6e]/20 via-[#00aadd]/30 to-blue-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Shaded Logo Badge Box */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-3.5 rounded-2xl bg-gradient-to-b from-blue-50/60 via-slate-50/80 to-cyan-50/50 shadow-[0_10px_25px_-5px_rgba(13,43,110,0.12),0_4px_10px_-2px_rgba(0,0,0,0.04)] border border-blue-100/60 flex items-center justify-center backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/payflux-icon.png"
                  alt="PayFlux Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(13,43,110,0.2)]"
                  draggable={false}
                />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 tracking-tight">
              Welcome back!
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1.5">
              Sign in to access your PayFlux account
            </p>
          </div>

          {/* Authentication Error Feedback Banner */}
          {errorMessage && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-rose-800 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-3.5 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/90 focus:bg-white border rounded-xl sm:rounded-2xl transition-all outline-none shadow-2xs ${
                    errors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-[#7B2FF7] focus:ring-4 focus:ring-purple-500/15'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-rose-600 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-3.5 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/90 focus:bg-white border rounded-xl sm:rounded-2xl transition-all outline-none shadow-2xs ${
                    errors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-[#7B2FF7] focus:ring-4 focus:ring-purple-500/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-800 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-rose-600 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Right-Aligned Link */}
            <div className="flex items-center justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs sm:text-sm font-bold text-[#7B2FF7] hover:text-[#5B10D9] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Full-width Gradient Sign In Button */}
            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-purple-500/30 transition-all duration-200 disabled:opacity-60 cursor-pointer select-none mt-3"
              style={{
                background: 'linear-gradient(90deg, #FF4F81 0%, #A232CA 50%, #7B2FF7 100%)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(123, 47, 247, 0.35)';
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
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5" />
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
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7B2FF7] flex items-center justify-center mx-auto mb-3 border border-purple-100">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Enter your work email address to receive password recovery instructions.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password reset link sent to your email address.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-purple-500 outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
