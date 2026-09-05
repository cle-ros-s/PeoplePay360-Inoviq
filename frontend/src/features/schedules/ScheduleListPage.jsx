import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { schedulesApi } from '../../api/schedules.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { formatEnumLabel, formatHours } from '../../utils/formatters';

export default function ScheduleListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

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
    <div>
      <PageHeader
        title="Working Schedules"
        description="Define weekly work patterns, start/end hours, and break durations. Total weekly hours are calculated authoritatively by the backend."
        actions={
          <button
            onClick={() => navigate('/schedules/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Working Schedule
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={schedulesList}
        isLoading={isLoading}
        emptyMessage="No working schedules found. Click 'Create Working Schedule' to define one."
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(scheduleToDelete.id)}
        title="Delete Working Schedule"
        message={`Are you sure you want to delete schedule "${scheduleToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
