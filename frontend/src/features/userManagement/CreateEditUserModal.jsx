import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import { Role } from '../../utils/constants';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().optional(),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Select a valid role' }) }),
  employeeId: z.string().optional().nullable(),
});

export default function CreateEditUserModal({ isOpen, onClose, onSave, user = null, employees = [], isLoading = false }) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: Role.EMPLOYEE,
      employeeId: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || Role.EMPLOYEE,
        employeeId: user.employeeId || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: Role.EMPLOYEE,
        employeeId: '',
      });
    }
  }, [user, reset, isOpen]);

  const onSubmit = (data) => {
    // If editing and password is empty, omit password
    const payload = { ...data };
    if (isEditing && !payload.password) {
      delete payload.password;
    }
    if (!payload.employeeId) {
      payload.employeeId = null;
    }
    onSave(payload);
  };

  const roleOptions = Object.values(Role).map((r) => ({
    value: r,
    label: r.replace(/_/g, ' '),
  }));

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name} (${emp.jobPosition})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Account' : 'Create New User Account'}
      description="Manage platform login access, assigned system role, and linked employee profile."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full Name" name="name" register={register} error={errors.name} required />
        <FormField label="Email Address" name="email" type="email" register={register} error={errors.email} required />
        
        <FormField
          label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
          name="password"
          type="password"
          register={register}
          error={errors.password}
          required={!isEditing}
        />

        <SelectField label="System Role" name="role" options={roleOptions} register={register} error={errors.role} required />

        <SelectField
          label="Linked Employee (Optional)"
          name="employeeId"
          options={employeeOptions}
          register={register}
          error={errors.employeeId}
          placeholder="None / Unlinked"
        />

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
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
