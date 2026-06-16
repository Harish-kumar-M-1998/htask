export type ReportTypeOption = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type ReportFormatOption = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export interface GenerateReportForm {
  type: ReportTypeOption;
  format: ReportFormatOption;
  projectId: string;
  dateFrom: string;
  dateTo: string;
  sections: string[];
}

export const REPORT_TYPES: Array<{ value: ReportTypeOption; label: string; description: string }> = [
  { value: 'DAILY', label: 'Daily', description: 'Yesterday\'s activity snapshot' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Last 7 days' },
  { value: 'MONTHLY', label: 'Monthly', description: 'Last 30 days' },
  { value: 'QUARTERLY', label: 'Quarterly', description: 'Last 90 days' },
  { value: 'YEARLY', label: 'Yearly', description: 'Last 365 days' },
  { value: 'CUSTOM', label: 'Custom range', description: 'Pick start and end dates' },
];

export const REPORT_FORMATS: Array<{ value: ReportFormatOption; label: string }> = [
  { value: 'EXCEL', label: 'Excel (.xlsx)' },
  { value: 'CSV', label: 'CSV' },
  { value: 'PDF', label: 'PDF (HTML)' },
  { value: 'JSON', label: 'JSON' },
];

export const REPORT_SECTIONS: Array<{ value: string; label: string }> = [
  { value: 'task_summary', label: 'Task summary' },
  { value: 'team_utilization', label: 'Team utilization' },
  { value: 'bug_trends', label: 'Bug trends' },
];

export const defaultReportForm: GenerateReportForm = {
  type: 'WEEKLY',
  format: 'EXCEL',
  projectId: '',
  dateFrom: '',
  dateTo: '',
  sections: ['task_summary', 'team_utilization', 'bug_trends'],
};

export function reportFormToPayload(form: GenerateReportForm) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  return {
    type: form.type,
    format: form.format,
    ...(form.projectId && { projectId: form.projectId }),
    dateRange: {
      from: form.type === 'CUSTOM' ? form.dateFrom : weekAgo,
      to: form.type === 'CUSTOM' ? form.dateTo : today,
    },
    sections: form.sections,
  };
}

export function quickReportForm(type: ReportTypeOption): GenerateReportForm {
  return {
    ...defaultReportForm,
    type,
    format: 'EXCEL',
  };
}
