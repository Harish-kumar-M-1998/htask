export interface TaskHistoryEntry {
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
}

export type DevDurationPhase = 'not_started' | 'in_progress' | 'completed';

export interface DevDurationResult {
  phase: DevDurationPhase;
  startedAt?: Date;
  completedAt?: Date;
  durationHours?: number;
}

export interface EtaComparison {
  deltaHours: number;
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  percentOfEta?: number;
}

export function computeDevDuration(
  history: TaskHistoryEntry[],
  currentStatus: string,
): DevDurationResult {
  const transitions = history
    .filter((entry) => entry.action === 'TRANSITION' && entry.toStatus)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (let i = transitions.length - 1; i >= 0; i -= 1) {
    if (transitions[i].toStatus !== 'DEVELOPMENT_COMPLETE') continue;

    const completedAt = new Date(transitions[i].createdAt);
    let startedAt: Date | undefined;

    for (let j = i - 1; j >= 0; j -= 1) {
      if (transitions[j].toStatus === 'IN_PROGRESS') {
        startedAt = new Date(transitions[j].createdAt);
        break;
      }
    }

    if (startedAt) {
      const durationMs = completedAt.getTime() - startedAt.getTime();
      return {
        phase: 'completed',
        startedAt,
        completedAt,
        durationHours: durationMs / 3_600_000,
      };
    }
  }

  if (currentStatus === 'IN_PROGRESS' || currentStatus === 'BLOCKED') {
    for (let i = transitions.length - 1; i >= 0; i -= 1) {
      if (transitions[i].toStatus === 'IN_PROGRESS') {
        const startedAt = new Date(transitions[i].createdAt);
        const durationMs = Date.now() - startedAt.getTime();
        return {
          phase: 'in_progress',
          startedAt,
          durationHours: durationMs / 3_600_000,
        };
      }
    }
  }

  return { phase: 'not_started' };
}

export function formatDurationHours(hours: number): string {
  if (hours < 1 / 60) return '< 1m';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainder = hours % 24;
  return remainder >= 1 ? `${days}d ${remainder.toFixed(0)}h` : `${days}d`;
}

export function compareDevTimeWithEta(
  actualHours: number,
  etaHours: number | null | undefined,
  phase: DevDurationPhase,
): EtaComparison | null {
  if (etaHours == null || etaHours <= 0) return null;

  const percentOfEta = (actualHours / etaHours) * 100;
  const deltaHours = actualHours - etaHours;

  if (phase === 'completed') {
    if (deltaHours <= 0) {
      return {
        deltaHours,
        percentOfEta,
        tone: 'good',
        label: `${formatDurationHours(Math.abs(deltaHours))} under ETA`,
      };
    }
    if (percentOfEta <= 120) {
      return {
        deltaHours,
        percentOfEta,
        tone: 'warn',
        label: `${formatDurationHours(deltaHours)} over ETA`,
      };
    }
    return {
      deltaHours,
      percentOfEta,
      tone: 'bad',
      label: `${formatDurationHours(deltaHours)} over ETA`,
    };
  }

  if (phase === 'in_progress') {
    if (percentOfEta <= 75) {
      return { deltaHours, percentOfEta, tone: 'good', label: 'On track' };
    }
    if (percentOfEta <= 100) {
      return { deltaHours, percentOfEta, tone: 'warn', label: 'Approaching ETA' };
    }
    return { deltaHours, percentOfEta, tone: 'bad', label: 'Over ETA' };
  }

  return { deltaHours: 0, percentOfEta: 0, tone: 'neutral', label: 'Not started' };
}
