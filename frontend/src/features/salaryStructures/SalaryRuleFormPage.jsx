import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryRulesApi } from '../../api/salaryRules.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import { ComputationMethod, SalaryCategory } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';

const ruleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().min(1, 'Rule code is required').transform((val) => val.toUpperCase().replace(/\s+/g, '_')),
  category: z.nativeEnum(SalaryCategory),
  sequence: z.preprocess((v) => parseInt(v, 10), z.number().min(1)),
  computationMethod: z.nativeEnum(ComputationMethod),
  amount: z.preprocess((v) => (v ? parseFloat(v) : null), z.number().nullable().optional()),
  percentage: z.preprocess((v) => (v ? parseFloat(v) : null), z.number().nullable().optional()),
  percentageBasisCode: z.string().nullable().optional(),
  formula: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export default function SalaryRuleFormPage({ isOpen, onClose, structureId, rule, existingRulesCount = 0 }) {
  const queryClient = useQueryClient();
  const isEditing = !!rule;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      code: '',
      category: SalaryCategory.BASIC,
      sequence: existingRulesCount + 1,
      computationMethod: ComputationMethod.FIXED,
      amount: 0,
      percentage: 0,
      percentageBasisCode: 'BASIC',
      formula: '',
      isActive: true,
    },
  });

  const selectedMethod = watch('computationMethod');

  useEffect(() => {
    if (rule) {
      reset({
        name: rule.name || '',
        code: rule.code || '',
        category: rule.category || SalaryCategory.BASIC,
        sequence: rule.sequence || 1,
        computationMethod: rule.computationMethod || ComputationMethod.FIXED,
        amount: rule.amount !== null && rule.amount !== undefined ? parseFloat(rule.amount) : 0,
        percentage: rule.percentage !== null && rule.percentage !== undefined ? parseFloat(rule.percentage) : 0,
        percentageBasisCode: rule.percentageBasisCode || 'BASIC',
        formula: rule.formula || '',
        isActive: rule.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        code: '',
        category: SalaryCategory.BASIC,
        sequence: existingRulesCount + 1,
        computationMethod: ComputationMethod.FIXED,
        amount: 0,
        percentage: 0,
        percentageBasisCode: 'BASIC',
        formula: '',
        isActive: true,
      });
    }
  }, [rule, reset, existingRulesCount, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data) => salaryRulesApi.createRule(structureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => salaryRulesApi.updateRule(rule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      onClose();
    },
  });

  const onSubmit = (values) => {
    const payload = {
      ...values,
      computationType: values.computationMethod || values.computationType || 'FIXED',
    };
    if (payload.computationMethod === ComputationMethod.FIXED) {
      payload.percentage = null;
      payload.percentageBasisCode = null;
      payload.formula = null;
    } else if (payload.computationMethod === ComputationMethod.PERCENTAGE) {
      payload.amount = null;
      payload.formula = null;
    } else if (payload.computationMethod === ComputationMethod.FORMULA) {
      payload.amount = null;
      payload.percentage = null;
      payload.percentageBasisCode = null;
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const categoryOptions = Object.values(SalaryCategory).map((c) => ({ value: c, label: formatEnumLabel(c) }));
  const methodOptions = Object.values(ComputationMethod).map((m) => ({ value: m, label: formatEnumLabel(m) }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Salary Rule' : 'Add New Salary Rule'}
      description="Configure calculation sequence, category, and computation algorithm."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Rule Name" name="name" register={register} error={errors.name} required placeholder="e.g. House Rent Allowance" />
          <FormField label="Rule Code (Unique)" name="code" register={register} error={errors.code} required placeholder="e.g. HRA" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Category" name="category" options={categoryOptions} register={register} error={errors.category} required />
          <FormField label="Sequence Order" name="sequence" type="number" min="1" register={register} error={errors.sequence} required />
          <SelectField label="Computation Method" name="computationMethod" options={methodOptions} register={register} error={errors.computationMethod} required />
        </div>

        {selectedMethod === ComputationMethod.FIXED && (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 mb-2">FIXED Method Configuration</p>
            <FormField label="Fixed Amount" name="amount" type="number" step="0.01" register={register} error={errors.amount} required placeholder="0.00" />
          </div>
        )}

        {selectedMethod === ComputationMethod.PERCENTAGE && (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Percentage (%)" name="percentage" type="number" step="0.01" register={register} error={errors.percentage} required placeholder="e.g. 40" />
            <FormField label="Percentage Basis Code" name="percentageBasisCode" register={register} error={errors.percentageBasisCode} required placeholder="e.g. BASIC or CONTRACT_WAGE" />
          </div>
        )}

        {selectedMethod === ComputationMethod.FORMULA && (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 mb-1">FORMULA Method Configuration</p>
            <p className="text-[11px] text-gray-500 mb-2">
              Use preceding rule codes and context variables (e.g. <code className="font-mono bg-white px-1 border rounded">BASIC * 0.1 + HRA</code> or <code className="font-mono bg-white px-1 border rounded">GROSS - PF</code>).
            </p>
            <FormField label="Formula Expression" name="formula" register={register} error={errors.formula} required placeholder="BASIC + HRA" />
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer pt-2">
          <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-900">Active Rule</span>
        </label>

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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving Rule...' : isEditing ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
