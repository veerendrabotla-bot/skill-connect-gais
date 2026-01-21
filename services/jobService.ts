
import { supabase } from '../lib/supabase';
import { Job, JobStatus, ServiceCategory } from '../types';

const mapJob = (d: any): Job => {
  return {
    id: d.id,
    customerId: d.customer_id,
    workerId: d.worker_id,
    categoryId: d.category_id,
    status: d.status as JobStatus,
    location: {
      address: d.location_address,
      lat: d.location_lat,
      lng: d.location_lng
    },
    description: d.description,
    otp: d.otp,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    price: parseFloat(d.price),
    distance: d.distance_meters,
    invoiceDetails: d.invoice_details
  };
};

export const jobService = {
  async getCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await supabase.from('service_categories').select('*');
    if (error) return [];
    return data.map(d => ({
      id: d.id,
      name: d.name,
      icon: d.icon,
      description: d.description,
      basePrice: parseFloat(d.base_price)
    }));
  },

  async getMyJobs(userId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`customer_id.eq.${userId},worker_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapJob);
  },

  /**
   * Real-time subscription to any job the user is a participant of.
   */
  subscribeToMyJobs(userId: string, onUpdate: (job: Job) => void) {
    return supabase
      .channel(`user-jobs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `customer_id=eq.${userId}`
        },
        (payload) => onUpdate(mapJob(payload.new))
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `worker_id=eq.${userId}`
        },
        (payload) => onUpdate(mapJob(payload.new))
      )
      .subscribe();
  },

  async getAvailableLeads(lat?: number, lng?: number): Promise<Job[]> {
    if (!lat || !lng) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', JobStatus.REQUESTED);
      if (error) throw error;
      return (data || []).map(mapJob);
    }

    const { data, error } = await supabase.rpc('get_nearby_jobs', {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: 25000 
    });
    
    if (error) throw error;
    return (data || []).map(mapJob);
  },

  /**
   * Real-time subscription to new requests for workers.
   */
  subscribeToAvailableLeads(onNewLead: (job: Job) => void) {
    return supabase
      .channel('public-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: `status=eq.${JobStatus.REQUESTED}`
        },
        (payload) => onNewLead(mapJob(payload.new))
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `status=eq.${JobStatus.REQUESTED}`
        },
        (payload) => onNewLead(mapJob(payload.new))
      )
      .subscribe();
  },

  async createJob(customerId: string, categoryId: string, description: string, price: number, address: string, lat: number, lng: number): Promise<Job> {
    const { data, error } = await supabase.rpc('request_job', {
      p_customer_id: customerId,
      p_category_id: categoryId,
      p_description: description,
      p_price: price,
      p_address: address,
      p_lat: lat,
      p_lng: lng
    });

    if (error) throw error;
    
    const { data: jobData, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', data)
      .single();
    
    if (fetchError) throw fetchError;
    return mapJob(jobData);
  },

  async initializeTransit(jobId: string, workerId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('initialize_transit', {
      p_job_id: jobId,
      p_worker_id: workerId
    });
    if (error) throw error;
    return data;
  },

  async finalizeInvoice(jobId: string, workerId: string, invoice: any): Promise<boolean> {
    const { data, error } = await supabase.rpc('finalize_job_invoice', {
      p_job_id: jobId,
      p_worker_id: workerId,
      p_invoice_data: invoice
    });
    if (error) throw error;
    return data;
  },

  async generateStartOTP(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_auth_otp', {
      p_user_id: userId,
      p_purpose: 'JOB_START'
    });
    if (error) throw error;
    return data;
  },

  async updateJobStatus(jobId: string, status: JobStatus, otp?: string, workerId?: string): Promise<boolean> {
    if (status === JobStatus.STARTED && otp && workerId) {
      const { data, error } = await supabase.rpc('verify_and_start_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_otp: otp
      });
      if (error) throw error;
      return data;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('update_job_state', {
      p_job_id: jobId,
      p_next_status: status,
      p_actor_id: user.id
    });
    
    if (error) throw error;
    return data;
  },

  async claimJob(jobId: string, workerId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('claim_job', {
      p_job_id: jobId,
      p_worker_id: workerId
    });
    if (error) throw error;
    return data;
  },

  async submitDispute(jobId: string, reporterId: string, category: string, reason: string): Promise<string> {
    const { data, error } = await supabase.rpc('submit_dispute', {
      p_job_id: jobId,
      p_reporter_id: reporterId,
      p_category: category,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  }
};