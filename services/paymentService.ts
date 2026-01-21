
import { supabase } from '../lib/supabase';
import { Job } from '../types';

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
}

// Global declaration for Razorpay SDK
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const paymentService = {
  /**
   * Initializes the dual-handshake Razorpay protocol
   * 1. Generates Order in Supabase (Simulation of backend order creation)
   * 2. Opens Razorpay Modal
   * 3. Verifies & Captures in Supabase
   */
  async processPayment(job: Job, user: any): Promise<{ success: boolean; transactionId: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Initialize Order in Backend
        const { data: orderData, error: orderError } = await supabase.rpc('initialize_payment_order', {
          p_job_id: job.id,
          p_customer_id: user.id,
          p_amount: job.price
        });

        if (orderError) throw orderError;

        // 2. Configure Razorpay Options
        const options = {
          key: "rzp_test_enterprise_key", // Simulated Test Key
          amount: orderData.amount * 100, // Paise
          currency: "INR",
          name: "SkillConnect OS",
          description: `Settlement for Deployment #${job.id.slice(0, 8)}`,
          order_id: orderData.razorpay_order_id,
          handler: async (response: any) => {
            // 3. Confirm Protocol via Backend
            try {
              const { data: success, error: confirmError } = await supabase.rpc('confirm_payment_protocol', {
                p_order_id: response.razorpay_order_id,
                p_payment_id: response.razorpay_payment_id,
                p_signature: response.razorpay_signature
              });

              if (confirmError || !success) throw new Error("Verification Protocol Failed");
              
              resolve({ success: true, transactionId: response.razorpay_payment_id });
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || ""
          },
          theme: {
            color: "#4F46E5" // Indigo-600
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          console.error("Payment Protocol Breach:", response.error);
          reject(new Error(response.error.description));
        });
        rzp.open();

      } catch (err) {
        reject(err);
      }
    });
  },

  async getSavedMethods(): Promise<PaymentMethod[]> {
    // In a live Razorpay integration, saved methods are handled by their secure vault
    return [
      { id: 'pm_razorpay', brand: 'Razorpay', last4: 'Vault', expiry: 'Locked' }
    ];
  },

  async requestRefund(jobId: string, reason: string): Promise<boolean> {
    const { error } = await supabase.rpc('create_audit_entry', {
      p_action: 'REFUND_REQUESTED',
      p_entity_type: 'JOB',
      p_entity_id: jobId,
      p_metadata: { reason, timestamp: new Date().toISOString() }
    });
    if (error) throw error;
    return true;
  }
};