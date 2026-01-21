
import { JobStatus } from '../types';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.REQUESTED]: [JobStatus.MATCHING, JobStatus.CANCELLED],
  [JobStatus.MATCHING]: [JobStatus.ASSIGNED, JobStatus.REQUESTED, JobStatus.CANCELLED],
  [JobStatus.ASSIGNED]: [JobStatus.IN_TRANSIT, JobStatus.CANCELLED],
  [JobStatus.IN_TRANSIT]: [JobStatus.STARTED, JobStatus.CANCELLED],
  [JobStatus.STARTED]: [JobStatus.COMPLETED_PENDING_PAYMENT, JobStatus.DISPUTED],
  [JobStatus.COMPLETED_PENDING_PAYMENT]: [JobStatus.PAID, JobStatus.DISPUTED],
  [JobStatus.PAID]: [], // Final state
  [JobStatus.DISPUTED]: [JobStatus.PAID, JobStatus.CANCELLED],
  [JobStatus.CANCELLED]: [], // Final state
};

export const canTransition = (current: JobStatus, next: JobStatus): boolean => {
  return VALID_TRANSITIONS[current].includes(next);
};
