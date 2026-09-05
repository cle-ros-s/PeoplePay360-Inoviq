import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../../api/schedules.api';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import { ScheduleType, DAYS_OF_WEEK } from '../../utils/constants';
import { formatEnumLabel, formatHours } from '../../utils/formatters';
import { ArrowLeft, Save, Clock, CheckCircle2, AlertCircle, List, PlusCircle } from 'lucide-react';

const scheduleLineSchema = z.object({
  dayOfWeek: z.number(),
  enabled: z.boolean().default(true),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakMinutes: z.preprocess((v) => (v === '' || v === null ? 0 : parseInt(v, 10)), z.number().min(0)),
});

const scheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  type: z.nativeEnum(ScheduleType),
  lines: z.array(scheduleLineSchema),
});

const defaultLines = DAYS_OF_WEEK.map((d) => ({
  dayOfWeek: d.value,
  enabled: d.value >= 1 && d.value <= 5, // Monday to Friday active by default
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60,
}));

export default function ScheduleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewMode = !id || id === 'new';

  const [serverTotalWeeklyHours, setServerTotalWeeklyHours] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch schedule details if editing
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', id],
    queryFn: () => schedulesApi.getScheduleById(id),
    enabled: !!id && id !== 'new',
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      type: ScheduleType.FULL_TIME,
      lines: defaultLines,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'lines',
  });

  useEffect(() => {
    if (scheduleData) {
      setServerTotalWeeklyHours(scheduleData.totalWeeklyHours);
      // Map lines to days of week
      const mappedLines = DAYS_OF_WEEK.map((d) => {
        const existingLine = scheduleData.lines?.find((l) => l.dayOfWeek === d.value);
        if (existingLine) {
          return {
            dayOfWeek: d.value,
            enabled: true,
            startTime: existingLine.startTime || '09:00',
            endTime: existingLine.endTime || '18:00',
            breakMinutes: existingLine.breakMinutes ?? 60,
          };
        } else {
          return {
            dayOfWeek: d.value,
            enabled: false,
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
          };
        }
      });

      reset({
        name: scheduleData.name || '',
        type: scheduleData.type || ScheduleType.FULL_TIME,
        lines: mappedLines,
      });
    }
  }, [scheduleData, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: schedulesApi.createSchedule,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-warnings'] });
      setServerTotalWeeklyHours(data.totalWeeklyHours);
      setSuccessMessage(`Schedule "${data.name}" created successfully with ${data.totalWeeklyHours} weekly hours!`);
      setErrorMessage('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create schedule';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => schedulesApi.updateSchedule(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-warnings'] });
      setServerTotalWeeklyHours(data.totalWeeklyHours);
      setSuccessMessage(`Schedule "${data.name}" updated successfully with ${data.totalWeeklyHours} weekly hours!`);
      setErrorMessage('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update schedule';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const onSubmit = (formData) => {
    setErrorMessage('');
    setSuccessMessage('');

    // Filter only enabled day lines to send to backend
    const activeLines = formData.lines
      .filter((l) => l.enabled)
      .map((l) => ({
        dayOfWeek: l.dayOfWeek,
        startTime: l.startTime,
        endTime: l.endTime,
        breakMinutes: Number(l.breakMinutes) || 0,
      }));

    if (activeLines.length === 0) {
      setErrorMessage('Please select and enable at least one working day for this schedule.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      lines: activeLines,
    };

    if (isNewMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  if (scheduleLoading && !isNewMode) {
    return <LoadingState message="Loading schedule configuration..." />;
  }

  const typeOptions = Object.values(ScheduleType).map((t) => ({ value: t, label: formatEnumLabel(t) }));
  const watchedLines = watch('lines');

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNewMode ? 'Create Working Schedule' : `Edit ${scheduleData?.name || 'Schedule'}`}
        description="Configure daily work shifts and break duration. Total weekly hours are calculated by the server upon save."
        actions={
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedules
          </button>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-4 text-sm text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Schedule Saved</p>
              <p className="text-xs mt-0.5 text-emerald-700">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/schedules')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              View Schedules
            </button>
            {isNewMode && (
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('');
                  setServerTotalWeeklyHours(null);
                  reset({
                    name: '',
                    type: ScheduleType.FULL_TIME,
                    lines: defaultLines,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Another
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save schedule</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {serverTotalWeeklyHours !== null && serverTotalWeeklyHours !== undefined && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 text-emerald-900 font-semibold text-sm">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Server-Calculated Total Weekly Hours:</span>
          </div>
          <span className="text-lg font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
            {formatHours(serverTotalWeeklyHours)}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Schedule Name" name="name" register={register} error={errors.name} required placeholder="e.g. Standard 40h Full-Time" />
          <SelectField label="Schedule Type" name="type" options={typeOptions} register={register} error={errors.type} required />
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Weekly Working Pattern</h3>
          <p className="text-xs text-gray-500 mb-4">Toggle working days and customize shift timings.</p>
          
          <div className="space-y-3">
            {fields.map((field, index) => {
              const dayLabel = DAYS_OF_WEEK.find((d) => d.value === field.dayOfWeek)?.label || `Day ${field.dayOfWeek}`;
              const isDayEnabled = watchedLines?.[index]?.enabled;

              return (
                <div
                  key={field.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDayEnabled ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-50/70 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`lines.${index}.enabled`}
                      {...register(`lines.${index}.enabled`)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor={`lines.${index}.enabled`} className="text-sm font-semibold text-gray-900 cursor-pointer">
                      {dayLabel}
                    </label>
                  </div>

                  {isDayEnabled ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Start Time</label>
                        <input
                          type="time"
                          {...register(`lines.${index}.startTime`)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">End Time</label>
                        <input
                          type="time"
                          {...register(`lines.${index}.endTime`)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Break (Minutes)</label>
                        <input
                          type="number"
                          min="0"
                          step="15"
                          {...register(`lines.${index}.breakMinutes`)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">Off / Non-working day</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Calculating & Saving...' : isNewMode ? 'Create Schedule' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}
