import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { employeesApi } from '../../api/employees.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CreateEditUserModal from './CreateEditUserModal';
import { UserPlus, Edit2, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users list
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  // Fetch employees list for dropdown linking
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
  });

  const usersList = usersData?.data || (Array.isArray(usersData) ? usersData : []);
  const employeesList = employeesData?.data || (Array.isArray(employeesData) ? employeesData : []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
  });

  const handleCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = (user, e) => {
    e.stopPropagation();
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleSaveUser = (data) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'User Name',
      accessorKey: 'name',
      render: (user) => (
        <div className="font-medium text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div>{user.name}</div>
            <div className="text-xs text-gray-400 font-normal">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      render: (user) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          {user.role?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Linked Employee',
      accessorKey: 'employee',
      render: (user) => (
        <span className="text-gray-700 font-medium">
          {user.employee?.name ? `${user.employee.name} (${user.employee.jobPosition})` : 'Unlinked'}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      render: (user) => formatDate(user.createdAt),
    },
    {
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleEdit(user, e)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(user, e)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete User"
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
        title="User Management"
        description="Manage system access credentials, role permissions, and linked employee accounts."
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create User Account
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={usersList}
        isLoading={usersLoading}
        emptyMessage="No system users found. Click 'Create User Account' to add one."
      />

      <CreateEditUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        employees={employeesList}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(userToDelete.id)}
        title="Delete User Account"
        message={`Are you sure you want to delete user account "${userToDelete?.name}"? They will no longer be able to log in.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
