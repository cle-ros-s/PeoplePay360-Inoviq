import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceAlertsApi } from '../../api/attendanceAlerts.api';
import { usePermissions } from '../../hooks/usePermissions';
import { Clock, Calendar, AlertCircle, ArrowRight, MessageSquare, ShieldAlert } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function EmployeeAttendanceAlertBanner() {
  const navigate = useNavigate();
  const { isEmployee } = usePermissions();

  const { data: alertResponse } = useQuery({
    queryKey: ['myAttendanceAlert'],
    queryFn: async () => {
      try {
        const res = await attendanceAlertsApi.getMyAlert();
        return res?.data || null;
      } catch (err) {
        return null;
      }
    },
    enabled: !!isEmployee,
    staleTime: 60000,
  });

  const alert = alertResponse?.alert || (alertResponse?.hasAlert ? alertResponse : null);

  if (!alert || alert.status === 'RESOLVED' || alert.status === 'DISMISSED') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/60 rounded-2xl p-5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl flex-shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Attendance Check-in Reminder
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                {alert.missingDays || 7} scheduled days unrecorded
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              No attendance recorded since {formatDate(alert.absenceStartDate)}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We noticed you haven't punched in or submitted an approved time-off request for recent scheduled shifts. If you worked during this period or took leave, please submit your attendance regularizations or leave request.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => navigate('/attendance')}
            className="px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            View My Attendance
          </button>

          <button
            onClick={() => navigate('/time-off/requests')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            Request Time Off
          </button>
        </div>
      </div>
    </div>
  );
}
