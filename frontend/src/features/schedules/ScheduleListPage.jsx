import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { schedulesApi } from '../../api/schedules.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatEnumLabel, formatHours } from '../../utils/formatters';

export default function ScheduleListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.getSchedules(),
  });
  const schedulesList = scheduleData?.data || (Array.isArray(scheduleData) ? scheduleData : []);

  const deleteMutation = useMutation({
    mutationFn: schedulesApi.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setDeleteConfirmOpen(false);
      setScheduleToDelete(null);
      setFeedback({ type: 'success', message: 'Working schedule removed successfully.' });
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to delete schedule';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const columns = [
    {
      header: 'Schedule Name',
      accessorKey: 'name',
      render: (s) => (
        <span className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          {s.name}
        </span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      render: (s) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          {formatEnumLabel(s.type)}
        </span>
      ),
    },
    {
      header: 'Server Computed Total Weekly Hours',
      accessorKey: 'totalWeeklyHours',
      render: (s) => (
        <span className="font-bold text-gray-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          {formatHours(s.totalWeeklyHours)}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/schedules/${s.id}/edit`)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Schedule"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setScheduleToDelete(s);
              setDeleteConfirmOpen(true);
            }}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Schedule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Working Schedules"
        description="Define standard, part-time, and flexible shift patterns. Working hours are automatically calculated on the server."
        actions={
          <button
            onClick={() => navigate('/schedules/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
        }
      />

      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm shadow-sm ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedback.type === 'error' ? 'Action Failed' : 'Success'}</p>
              <p className="text-xs mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={schedulesList}
        isLoading={isLoading}
        emptyMessage="No working schedules configured. Click 'Create Schedule' to set up a new shift pattern."
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(scheduleToDelete.id)}
        title="Delete Schedule"
        message={`Are you sure you want to delete working schedule "${scheduleToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
