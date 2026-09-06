import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AttendanceWidget({ employeeId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetEmpId = employeeId || user?.employeeId;
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch recent attendance for this employee
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-widget', targetEmpId],
    queryFn: () => attendanceApi.getAttendance({ employeeId: targetEmpId, pageSize: 5 }),
    enabled: !!targetEmpId,
    staleTime: 10000,
  });

  const attendanceList = attendanceData?.data || (Array.isArray(attendanceData) ? attendanceData : []);
  // Find active check-in (without check-out)
  const activeCheckIn = attendanceList.find((a) => !a.checkOut);

  // Optimistic Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: () =>
      attendanceApi.checkIn({
        employeeId: targetEmpId,
        checkIn: new Date().toISOString(),
      }),
    onMutate: async () => {
      setActionMessage({ type: 'success', text: 'Checked in successfully!' });
      setTimeout(() => setActionMessage(null), 3000);

      await queryClient.cancelQueries({ queryKey: ['attendance-widget', targetEmpId] });
      await queryClient.cancelQueries({ queryKey: ['attendance'] });

      const previousWidgetData = queryClient.getQueryData(['attendance-widget', targetEmpId]);
      const previousListData = queryClient.getQueriesData({ queryKey: ['attendance'] });

      const nowIso = new Date().toISOString();
      const optimisticRecord = {
        id: `temp-${Date.now()}`,
        employeeId: targetEmpId,
        checkIn: nowIso,
        checkOut: null,
        workedHours: null,
        status: 'PRESENT',
        isManualEdit: false,
        employee: user
          ? {
              id: targetEmpId,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
              email: user.email || '',
            }
          : null,
      };

      // Optimistically insert into widget query cache
      queryClient.setQueryData(['attendance-widget', targetEmpId], (old) => {
        if (!old) return { data: [optimisticRecord], total: 1 };
        if (Array.isArray(old)) return [optimisticRecord, ...old];
        const oldList = old.data || [];
        return {
          ...old,
          data: [optimisticRecord, ...oldList],
          total: (old.total || oldList.length) + 1,
        };
      });

      // Optimistically insert into attendance list query caches
      queryClient.setQueriesData({ queryKey: ['attendance'] }, (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return [optimisticRecord, ...old];
        const oldList = old.data || [];
        return {
          ...old,
          data: [optimisticRecord, ...oldList],
          total: (old.total || oldList.length) + 1,
        };
      });

      return { previousWidgetData, previousListData };
    },
    onError: (err, _variables, context) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || 'Check in failed.' });
      setTimeout(() => setActionMessage(null), 4000);

      if (context?.previousWidgetData) {
        queryClient.setQueryData(['attendance-widget', targetEmpId], context.previousWidgetData);
      }
      if (context?.previousListData) {
        context.previousListData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-widget', targetEmpId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  // Optimistic Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: () =>
      attendanceApi.checkOut(activeCheckIn.id, {
        checkOut: new Date().toISOString(),
      }),
    onMutate: async () => {
      setActionMessage({ type: 'success', text: 'Checked out successfully!' });
      setTimeout(() => setActionMessage(null), 3000);

      await queryClient.cancelQueries({ queryKey: ['attendance-widget', targetEmpId] });
      await queryClient.cancelQueries({ queryKey: ['attendance'] });

      const previousWidgetData = queryClient.getQueryData(['attendance-widget', targetEmpId]);
      const previousListData = queryClient.getQueriesData({ queryKey: ['attendance'] });

      const nowIso = new Date().toISOString();
      const inTime = activeCheckIn?.checkIn ? new Date(activeCheckIn.checkIn).getTime() : Date.now();
      const outTime = new Date(nowIso).getTime();
      const diffHours = Math.max(0, Math.round(((outTime - inTime) / (1000 * 60 * 60)) * 100) / 100);

      const updateRecord = (record) => {
        if (!record) return record;
        if (record.id === activeCheckIn?.id || (!record.checkOut && record.employeeId === targetEmpId)) {
          return {
            ...record,
            checkOut: nowIso,
            workedHours: diffHours,
            status: record.status === 'MISSING_CHECKOUT' ? 'PRESENT' : record.status || 'PRESENT',
          };
        }
        return record;
      };

      // Optimistically update widget query cache
      queryClient.setQueryData(['attendance-widget', targetEmpId], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(updateRecord);
        return {
          ...old,
          data: (old.data || []).map(updateRecord),
        };
      });

      // Optimistically update list query caches
      queryClient.setQueriesData({ queryKey: ['attendance'] }, (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(updateRecord);
        return {
          ...old,
          data: (old.data || []).map(updateRecord),
        };
      });

      return { previousWidgetData, previousListData };
    },
    onError: (err, _variables, context) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || 'Check out failed.' });
      setTimeout(() => setActionMessage(null), 4000);

      if (context?.previousWidgetData) {
        queryClient.setQueryData(['attendance-widget', targetEmpId], context.previousWidgetData);
      }
      if (context?.previousListData) {
        context.previousListData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-widget', targetEmpId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  if (!targetEmpId) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base">Today's Work Shift</h3>
            {activeCheckIn ? (
              <StatusBadge status={activeCheckIn.status || 'PRESENT'} />
            ) : (
              <span className="text-xs text-gray-400 font-medium">Not checked in</span>
            )}
            {actionMessage && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium transition-all ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {actionMessage.text}
              </span>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out Now'}
          </button>
        ) : (
          <button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {checkInMutation.isPending ? 'Checking In...' : 'Check In Now'}
          </button>
        )}
      </div>
    </div>
  );
}
