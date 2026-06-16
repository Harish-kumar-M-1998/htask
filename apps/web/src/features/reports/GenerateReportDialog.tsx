import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { reportsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName } from '@/lib/formStyles';
import {
  defaultReportForm,
  REPORT_FORMATS,
  REPORT_SECTIONS,
  REPORT_TYPES,
  reportFormToPayload,
  type GenerateReportForm,
  type ReportTypeOption,
} from '@/features/reports/reportOptions';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Array<{ id: string; name: string; key: string }>;
  defaultType?: ReportTypeOption;
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  projects,
  defaultType,
}: GenerateReportDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GenerateReportForm>(defaultReportForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(defaultType ? { ...defaultReportForm, type: defaultType } : defaultReportForm);
      setError('');
    }
  }, [open, defaultType]);

  const generateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof reportFormToPayload>) =>
      reportsApi.generate(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onOpenChange(false);
    },
    onError: () => {
      setError('Failed to generate report. Please try again.');
    },
  });

  const selectClass = selectClassName;
  const isCustom = form.type === 'CUSTOM';
  const canSubmit =
    form.sections.length > 0 &&
    (!isCustom || (form.dateFrom && form.dateTo));

  const toggleSection = (value: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.includes(value)
        ? prev.sections.filter((s) => s !== value)
        : [...prev.sections, value],
    }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    generateMutation.mutate(reportFormToPayload(form));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">Generate report</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Report type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value as ReportTypeOption }))
                }
                className={selectClass}
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} — {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Format</label>
              <select
                value={form.format}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    format: e.target.value as GenerateReportForm['format'],
                  }))
                }
                className={selectClass}
              >
                {REPORT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Project (optional)</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                className={selectClass}
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.key} — {project.name}
                  </option>
                ))}
              </select>
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">From date</label>
                  <Input
                    type="date"
                    value={form.dateFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">To date</label>
                  <Input
                    type="date"
                    value={form.dateTo}
                    onChange={(e) => setForm((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Sections</label>
              <div className="space-y-2">
                {REPORT_SECTIONS.map((section) => (
                  <label
                    key={section.value}
                    className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      checked={form.sections.includes(section.value)}
                      onChange={() => toggleSection(section.value)}
                      className="rounded border-border"
                    />
                    {section.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit || generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate report'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
