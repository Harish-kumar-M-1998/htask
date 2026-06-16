import { ProjectFormDialog } from '@/features/projects/ProjectFormDialog';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  return (
    <ProjectFormDialog open={open} onOpenChange={onOpenChange} mode="create" />
  );
}
