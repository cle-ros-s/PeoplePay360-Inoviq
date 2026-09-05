import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import { AttendanceStatus } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';

const attendanceSchema = z.object({
  checkIn: z.string().min(1, 'Check in time is required'),
  checkOut: z.string().optional().nullable(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional().nullable(),
});

export default function AttendanceFormPage({ isOpen, onClose, attendanceRecord }) {
  const queryClient = useQueryClient();

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
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      onClose();
    },
  });

  const onSubmit = (values) => {
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
      description={`Correcting shift entry for ${attendanceRecord?.employee?.name || 'Employee'}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Check In Time" name="checkIn" type="datetime-local" register={register} error={errors.checkIn} required />
        <FormField label="Check Out Time" name="checkOut" type="datetime-local" register={register} error={errors.checkOut} />
        <SelectField label="Attendance Status" name="status" options={statusOptions} register={register} error={errors.status} required />
        <FormField label="Correction Reason / Notes" name="notes" register={register} error={errors.notes} placeholder="e.g. Employee forgot to check out" />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
