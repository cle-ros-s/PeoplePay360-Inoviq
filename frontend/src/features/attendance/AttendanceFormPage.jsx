import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import StatusBadge from '../../components/common/StatusBadge';
import { AttendanceStatus } from '../../utils/constants';
import { formatEnumLabel, formatDateTime, formatHours } from '../../utils/formatters';
import { Clock, User, AlertCircle, Save, X } from 'lucide-react';

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
    'Employee';
  const empJob = attendanceRecord?.employee?.jobPosition || 'Staff Member';

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
      status: AttendanceStatus.MANUALLY_EDITED,
      notes: '',
    },
  });

  useEffect(() => {
    setErrorMessage('');
    if (attendanceRecord) {
      reset({
        checkIn: attendanceRecord.checkIn ? new Date(attendanceRecord.checkIn).toISOString().slice(0, 16) : '',
        checkOut: attendanceRecord.checkOut ? new Date(attendanceRecord.checkOut).toISOString().slice(0, 16) : '',
        status: attendanceRecord.status || AttendanceStatus.MANUALLY_EDITED,
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
      maxWidth="max-w-2xl"
    >
      {/* Context summary card */}
      <div className="bg-gradient-to-r from-purple-50/60 to-teal-50/40 p-4 rounded-xl border border-purple-100/80 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200 shadow-sm shrink-0">
            {empName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {empName}
              <StatusBadge status={attendanceRecord?.status || 'PRESENT'} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{empJob}</p>
          </div>
        </div>

        {attendanceRecord && (
          <div className="text-right">
            <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Recorded Hours</span>
            <span className="text-sm font-bold text-gray-800">{formatHours(attendanceRecord.workedHours)}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Check In Time"
            name="checkIn"
            type="datetime-local"
            register={register}
            error={errors.checkIn}
            required
          />
          <FormField
            label="Check Out Time"
            name="checkOut"
            type="datetime-local"
            register={register}
            error={errors.checkOut}
          />
        </div>

        <SelectField
          label="Attendance Status"
          name="status"
          options={statusOptions}
          register={register}
          error={errors.status}
          required
        />

        <div>
          <label htmlFor="notes" className="form-label">
            Correction Reason / Audit Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="e.g. Employee forgot to check out at shift end due to emergency."
            {...register('notes')}
            className={`input-field resize-y min-h-[76px] py-2.5 ${errors.notes ? 'error' : ''}`}
          />
          {errors.notes && (
            <p className="text-xs mt-1 font-medium text-red-500">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-gray-400" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Updating Record...' : 'Save Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

