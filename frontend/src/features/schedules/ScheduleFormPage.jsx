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
import { ArrowLeft, Save, Clock } from 'lucide-react';

const scheduleLineSchema = z.object({
  dayOfWeek: z.number(),
  enabled: z.boolean().default(true),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakMinutes: z.preprocess((v) => parseInt(v, 10), z.number().min(0)),
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
      setServerTotalWeeklyHours(data.totalWeeklyHours);
      navigate('/schedules');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => schedulesApi.updateSchedule(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', id] });
      setServerTotalWeeklyHours(data.totalWeeklyHours);
      navigate('/schedules');
    },
  });

  const onSubmit = (formData) => {
    // Filter only enabled day lines to send to backend
    const activeLines = formData.lines
      .filter((l) => l.enabled)
      .map((l) => ({
        dayOfWeek: l.dayOfWeek,
        startTime: l.startTime,
        endTime: l.endTime,
        breakMinutes: l.breakMinutes,
      }));

    const payload = {
      name: formData.name,
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedules
          </button>
        }
      />

      {serverTotalWeeklyHours !== null && serverTotalWeeklyHours !== undefined && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
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
          <h3 className="text-base font-bold text-gray-900 mb-4">Weekly Schedule Pattern (Monday — Sunday)</h3>
          
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
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">End Time</label>
                        <input
                          type="time"
                          {...register(`lines.${index}.endTime`)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Break (Minutes)</label>
                        <input
                          type="number"
                          min="0"
                          step="15"
                          {...register(`lines.${index}.breakMinutes`)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Calculating & Saving...' : isNewMode ? 'Create Schedule' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}
