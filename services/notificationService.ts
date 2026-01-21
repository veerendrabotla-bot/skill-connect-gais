
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  metadata: any;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  job_updates: boolean;
  marketing_alerts: boolean;
  security_alerts: boolean;
  payment_notifications: boolean;
}

export const notificationService = {
  /**
   * Fetches persistent notifications from the kernel
   */
  async getMyNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Subscribes to the live notification stream for instant updates
   */
  subscribeToNotifications(userId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: userId
    });
    if (error) throw error;
  },

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  }
};