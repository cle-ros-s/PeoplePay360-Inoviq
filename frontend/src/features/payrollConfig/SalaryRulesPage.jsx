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

  const rulesList = (rulesData?.data || (Array.isArray(rulesData) ? rulesData : [])).sort(
    (a, b) => (a.sequence || 0) - (b.sequence || 0)
  );

  const deleteMutation = useMutation({
    mutationFn: salaryRulesApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ruleIds) => salaryRulesApi.reorderRules(structureId, ruleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
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
    e.stopPropagation();
    setSelectedRule(rule);
    setRuleModalOpen(true);
  };

  const handleOpenDelete = (rule, e) => {
    e.stopPropagation();
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const columns = [
    {
      header: 'Seq',
      accessorKey: 'sequence',
      render: (r, idx) => (
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-500 w-6">{r.sequence ?? idx + 1}</span>
          {can('MANAGE_SALARY_RULES') && (
            <div className="flex flex-col">
              <button
                disabled={idx === 0}
                onClick={() => handleMove(idx, 'up')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                disabled={idx === rulesList.length - 1}
                onClick={() => handleMove(idx, 'down')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20"
              >
                <ArrowDown className="w-3 h-3" />
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
          <div className="font-semibold text-gray-900">{r.name}</div>
          <div className="text-xs font-mono text-blue-600 flex items-center gap-1">
            <Code className="w-3 h-3" />
            {r.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      render: (r) => (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
          {formatEnumLabel(r.category)}
        </span>
      ),
    },
    {
      header: 'Method',
      accessorKey: 'computationMethod',
      render: (r) => formatEnumLabel(r.computationMethod),
    },
    {
      header: 'Computation Formula / Amount',
      render: (r) => {
        if (r.computationMethod === ComputationMethod.FIXED) {
          return <span className="font-bold text-gray-900">{formatCurrency(r.amount)}</span>;
        } else if (r.computationMethod === ComputationMethod.PERCENTAGE) {
          return (
            <span className="text-xs font-medium text-gray-700">
              {r.percentage}% of <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">{r.percentageBasisCode}</code>
            </span>
          );
        } else if (r.computationMethod === ComputationMethod.FORMULA) {
          return (
            <code className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded block max-w-xs truncate">
              {r.formula}
            </code>
          );
        }
        return '—';
      },
    },
    {
      header: 'Actions',
      render: (r) => (
        can('MANAGE_SALARY_RULES') && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleOpenEdit(r, e)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Rule"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
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
    <div>
      <PageHeader
        title={`Salary Rules — ${structureData?.name || 'Structure'}`}
        description="Configure rule sequence and computation logic (Fixed, Percentage, Formula). Rules run in ascending sequence order."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/payroll-config/structures')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Structures
            </button>

            {can('MANAGE_SALARY_RULES') && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Salary Rule
              </button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={rulesList}
        isLoading={isLoading}
        emptyMessage="No salary rules defined for this structure. Click 'Add Salary Rule' to configure one."
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
