import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import Modal from '../../components/common/Modal';
import { AttendanceStatus } from '../../utils/constants';
import { formatEnumLabel, formatHours } from '../../utils/formatters';
import { AlertCircle, Save, X } from 'lucide-react';

const attendanceSchema = z.object({
  checkIn: z.string().min(1, 'Check in time is required'),
  checkOut: z.string().optional().nullable(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional().nullable(),
});

export default function AttendanceFormPage({ isOpen, onClose, attendanceRecord }) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');

  const empName =
    attendanceRecord?.employee?.name ||
    (attendanceRecord?.employee
      ? `${attendanceRecord.employee.firstName || ''} ${attendanceRecord.employee.lastName || ''}`.trim()
      : '') ||
    'Ethan Hunt';
  const empJob = attendanceRecord?.employee?.jobPosition || 'Senior Software Engineer';
  const empInitials = empName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      checkIn: '',
      checkOut: '',
      status: AttendanceStatus.LATE,
      notes: '',
    },
  });

  useEffect(() => {
    setErrorMessage('');
    if (attendanceRecord) {
      reset({
        checkIn: attendanceRecord.checkIn ? new Date(attendanceRecord.checkIn).toISOString().slice(0, 16) : '',
        checkOut: attendanceRecord.checkOut ? new Date(attendanceRecord.checkOut).toISOString().slice(0, 16) : '',
        status: attendanceRecord.status || AttendanceStatus.LATE,
        notes: attendanceRecord.notes || '',
      });
    }
  }, [attendanceRecord, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) =>
      attendanceApi.updateAttendance(attendanceRecord.id, {
        checkIn: new Date(data.checkIn).toISOString(),
        checkOut: data.checkOut ? new Date(data.checkOut).toISOString() : null,
        status: data.status,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-widget'] });
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update attendance record';
      setErrorMessage(msg);
    },
  });

  const onSubmit = (values) => {
    setErrorMessage('');
    updateMutation.mutate(values);
  };

  const statusOptions = Object.values(AttendanceStatus).map((s) => ({
    value: s,
    label: formatEnumLabel(s),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Correction"
      description="Update shift timing, presence status, and log manual adjustment notes."
      maxWidth="max-w-xl"
    >
      {/* Employee context box matching screenshot */}
      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#F3E8FF] text-[#7E22CE] font-bold flex items-center justify-center text-sm border border-purple-100 shrink-0">
            {empInitials}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>{empName}</span>
              <span className="text-[11px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-amber-200/60">
                {formatEnumLabel(attendanceRecord?.status || 'LATE')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{empJob}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">RECORDED HOURS</span>
          <span className="text-sm font-bold text-gray-900 mt-0.5 block">{formatHours(attendanceRecord?.workedHours || 0.01)}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Check in / Check out 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
              CHECK IN TIME <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('checkIn')}
              className={`w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
                errors.checkIn ? 'border-red-500' : ''
              }`}
            />
            {errors.checkIn && (
              <p className="text-xs mt-1 font-medium text-red-500">{errors.checkIn.message}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
              CHECK OUT TIME
            </label>
            <input
              type="datetime-local"
              {...register('checkOut')}
              className={`w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
                errors.checkOut ? 'border-red-500' : ''
              }`}
            />
            {errors.checkOut && (
              <p className="text-xs mt-1 font-medium text-red-500">{errors.checkOut.message}</p>
            )}
          </div>
        </div>

        {/* Attendance Status */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
            ATTENDANCE STATUS <span className="text-red-500">*</span>
          </label>
          <select
            {...register('status')}
            className={`w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
              errors.status ? 'border-red-500' : ''
            }`}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs mt-1 font-medium text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Correction Reason / Audit Notes */}
        <div className="mb-6">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
            CORRECTION REASON / AUDIT NOTES
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Employee forgot to check out at shift end due to emergency."
            {...register('notes')}
            className={`w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-normal text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y min-h-[96px] transition-all ${
              errors.notes ? 'border-red-500' : ''
            }`}
          />
          {errors.notes && (
            <p className="text-xs mt-1 font-medium text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {/* Footer buttons matching screenshot */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-gray-500" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#7E22CE] hover:bg-[#6B21A8] rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 border border-purple-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}


