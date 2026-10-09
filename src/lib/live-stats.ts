export const EMPTY_TRANSPARENCY = {
  kpis: { processed: 0, avgProcessingDays: 0, pending: 0, slaCompliance: 0, grievancesResolved: 0, total: 0 },
  monthly: [] as { month: string; applications: number; completed: number; avgDays: number }[],
  byDepartment: [] as { department: string; applications: number; slaCompliance: number; avgDays: number }[],
  statusMix: [] as { name: string; value: number }[],
};
