import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatHours } from '../../utils/formatters';
import { Clock, LogIn, LogOut } from 'lucide-react';

export default function AttendanceWidget({ employeeId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetEmpId = employeeId || user?.employeeId;

  // Fetch recent attendance for this employee
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-widget', targetEmpId],
    queryFn: () => attendanceApi.getAttendance({ employeeId: targetEmpId, pageSize: 5 }),
    enabled: !!targetEmpId,
  });

  const attendanceList = attendanceData?.data || (Array.isArray(attendanceData) ? attendanceData : []);
  // Find active check-in (without check-out) or latest today
  const activeCheckIn = attendanceList.find((a) => !a.checkOut);

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: () =>
      attendanceApi.checkIn({
        employeeId: targetEmpId,
        checkIn: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-widget', targetEmpId] });
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: () =>
      attendanceApi.checkOut(activeCheckIn.id, {
        checkOut: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-widget', targetEmpId] });
    },
  });

  if (!targetEmpId) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-base">Today's Work Shift</h3>
            {activeCheckIn ? (
              <StatusBadge status={activeCheckIn.status || 'PRESENT'} />
            ) : (
              <span className="text-xs text-gray-400 font-medium">Not checked in</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {activeCheckIn ? (
              <>
                Checked in at <span className="font-semibold text-gray-700">{formatDateTime(activeCheckIn.checkIn, 'HH:mm')}</span>
              </>
            ) : (
              'Record your daily presence by clicking Check In.'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeCheckIn ? (
          <button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out Now'}
          </button>
        ) : (
          <button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {checkInMutation.isPending ? 'Checking In...' : 'Check In Now'}
          </button>
        )}
      </div>
    </div>
  );
}
