
import { User, UserRole, Job, JobStatus, Worker, WalletTransaction } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'cust@test.com', name: 'John Doe', role: UserRole.CUSTOMER, verified: true, avatar: 'https://picsum.photos/seed/cust/200' },
  { id: 'u2', email: 'work@test.com', name: 'Mike Fixer', role: UserRole.WORKER, verified: true, avatar: 'https://picsum.photos/seed/work/200' },
  { id: 'u3', email: 'admin@test.com', name: 'Admin One', role: UserRole.ADMIN, verified: true, avatar: 'https://picsum.photos/seed/admin/200' },
];

export const MOCK_WORKER: Worker = {
  id: 'w1',
  userId: 'u2',
  skills: ['Plumbing', 'Electrical'],
  rating: 4.8,
  totalJobs: 124,
  adminApproved: true,
  walletBalance: 12450,
  isOnline: true,
};

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1',
    customerId: 'u1',
    workerId: 'w1',
    categoryId: '1',
    status: JobStatus.IN_TRANSIT,
    location: { address: '123 Baker Street, London', lat: 51.5237, lng: -0.1585 },
    description: 'Kitchen sink tap is leaking constantly.',
    otp: '4562',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 499,
  }
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 't1', amount: 499, type: 'CREDIT', description: 'Payment for Job #j001', timestamp: '2023-10-01T10:00:00Z' },
  { id: 't2', amount: 1500, type: 'DEBIT', description: 'Bank Withdrawal', timestamp: '2023-10-02T14:30:00Z' },
];
