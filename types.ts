
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',
  ADMIN = 'ADMIN'
}

export enum JobStatus {
  REQUESTED = 'REQUESTED',
  MATCHING = 'MATCHING',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  STARTED = 'STARTED',
  COMPLETED_PENDING_PAYMENT = 'COMPLETED_PENDING_PAYMENT',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  verified: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  avgDuration: string;
  popularityScore: number; // 1-100
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  basePrice: number;
  serviceTypes?: ServiceType[];
}

export interface Job {
  id: string;
  customerId: string;
  workerId?: string;
  categoryId: string;
  serviceTypeId?: string;
  status: JobStatus;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  description: string;
  otp?: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  distance?: number;
  invoiceDetails?: {
    items: { label: string; amount: number }[];
    total: number;
  };
}

export interface Worker {
  id: string;
  userId: string;
  skills: string[];
  rating: number;
  totalJobs: number;
  adminApproved: boolean;
  walletBalance: number;
  isOnline: boolean;
}

export interface WorkerApplication {
  id: string;
  worker_id: string;
  skills: string[];
  experience_summary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_reason?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  timestamp: string;
  reference_job_id?: string;
}

export interface WithdrawalRequest {
  id: string;
  worker_id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  bank_details: any;
  created_at: string;
}

export interface EarningsAnalytics {
  date: string;
  amount: number;
}
