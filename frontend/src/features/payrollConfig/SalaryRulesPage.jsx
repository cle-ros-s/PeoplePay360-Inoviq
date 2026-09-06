import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { salaryRulesApi } from '../../api/salaryRules.api';
import { salaryStructuresApi } from '../../api/salaryStructures.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SalaryRuleFormPage from './SalaryRuleFormPage';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, ArrowLeft, Code } from 'lucide-react';
import { formatEnumLabel, formatCurrency } from '../../utils/formatters';
import { ComputationMethod, SalaryCategory } from '../../utils/constants';

export default function SalaryRulesPage() {
  const { structureId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch structure details
  const { data: structureData } = useQuery({
    queryKey: ['salary-structure', structureId],
    queryFn: () => salaryStructuresApi.getSalaryStructureById(structureId),
    enabled: !!structureId,
  });

  // Fetch rules for this structure
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['salary-rules', structureId],
    queryFn: () => salaryRulesApi.getRulesByStructure(structureId),
    enabled: !!structureId,
  });

  const rawList = rulesData?.data || (Array.isArray(rulesData) ? rulesData : []);
  const rulesList = [...rawList].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const deleteMutation = useMutation({
    mutationFn: salaryRulesApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
      setFeedback({ type: 'success', text: 'Salary rule deleted successfully!' });
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to delete salary rule.';
      setFeedback({ type: 'error', text: msg });
      setDeleteConfirmOpen(false);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ruleIds) => salaryRulesApi.reorderRules(structureId, ruleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      setFeedback({ type: 'success', text: 'Rule sequence order updated successfully!' });
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to reorder salary rules.';
      setFeedback({ type: 'error', text: msg });
    },
  });

  const handleMove = (index, direction) => {
    const newRules = [...rulesList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRules.length) return;

    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    const reorderedIds = newRules.map((r) => r.id);
    reorderMutation.mutate(reorderedIds);
  };

  const handleOpenCreate = () => {
    setSelectedRule(null);
    setRuleModalOpen(true);
  };

  const handleOpenEdit = (rule, e) => {
    if (e) e.stopPropagation();
    setSelectedRule(rule);
    setRuleModalOpen(true);
  };

  const handleOpenDelete = (rule, e) => {
    if (e) e.stopPropagation();
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const columns = [
    {
      header: 'Seq',
      accessorKey: 'sequence',
      render: (r, idx) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-bold text-gray-700 w-5 text-xs">{r.sequence ?? idx + 1}</span>
          {can('MANAGE_SALARY_RULES') && (
            <div className="flex flex-col">
              <button
                type="button"
                disabled={idx === 0 || reorderMutation.isPending}
                onClick={() => handleMove(idx, 'up')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                title="Move Rule Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === rulesList.length - 1 || reorderMutation.isPending}
                onClick={() => handleMove(idx, 'down')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                title="Move Rule Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Rule Name & Code',
      accessorKey: 'name',
      render: (r) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">{r.name}</div>
          <div className="text-xs font-mono text-blue-600 font-bold flex items-center gap-1 mt-0.5">
            <Code className="w-3.5 h-3.5" />
            {r.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      render: (r) => {
        const cat = r.category;
        const color =
          cat === 'BASIC'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : cat === 'ALLOWANCE'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : cat === 'DEDUCTION'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : cat === 'GROSS'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200';
        return (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${color}`}>
            {formatEnumLabel(cat)}
          </span>
        );
      },
    },
    {
      header: 'Method',
      render: (r) => {
        const method = r.computationType || r.computationMethod || 'FIXED';
        const badgeStyle =
          method === 'PERCENTAGE'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : method === 'FORMULA'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-blue-50 text-blue-700 border-blue-200';
        return (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
            {formatEnumLabel(method)}
          </span>
        );
      },
    },
    {
      header: 'Computation Formula / Amount',
      render: (r) => {
        const method = r.computationType || r.computationMethod || 'FIXED';
        if (method === ComputationMethod.FIXED || method === 'FIXED') {
          return (
            <span className="font-mono text-xs font-bold text-gray-900">
              {formatCurrency(r.amount || 0)}
            </span>
          );
        } else if (method === ComputationMethod.PERCENTAGE || method === 'PERCENTAGE') {
          return (
            <span className="text-xs font-medium text-gray-800">
              <span className="font-bold text-purple-700">{r.percentage ?? 0}%</span> of{' '}
              <code className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-mono font-bold">
                {r.percentageBasisCode || 'BASIC'}
              </code>
            </span>
          );
        } else if (method === ComputationMethod.FORMULA || method === 'FORMULA') {
          return (
            <code className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded block max-w-xs truncate font-bold">
              {r.formula || '—'}
            </code>
          );
        }
        return <span className="text-xs text-gray-400">—</span>;
      },
    },
    {
      header: 'Actions',
      render: (r) => (
        can('MANAGE_SALARY_RULES') && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => handleOpenEdit(r, e)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Rule"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleOpenDelete(r, e)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Rule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Salary Rules — ${structureData?.name || 'Structure'}`}
        description="Configure rule sequence and computation logic (Fixed, Percentage, Formula). Rules run in ascending sequence order."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/payroll-config/structures')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Structures
            </button>

            {can('MANAGE_SALARY_RULES') && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Salary Rule
              </button>
            )}
          </div>
        }
      />

      {feedback.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', text: '' })}
            className="underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rulesList}
        isLoading={isLoading}
        emptyMessage="No salary rules defined for this structure. Click 'Add Salary Rule' to configure one."
        onRowClick={(r) => handleOpenEdit(r)}
      />

      {ruleModalOpen && (
        <SalaryRuleFormPage
          isOpen={ruleModalOpen}
          onClose={() => setRuleModalOpen(false)}
          structureId={structureId}
          rule={selectedRule}
          existingRulesCount={rulesList.length}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(ruleToDelete.id)}
        title="Delete Salary Rule"
        message={`Are you sure you want to delete rule "${ruleToDelete?.name}" (${ruleToDelete?.code})?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
