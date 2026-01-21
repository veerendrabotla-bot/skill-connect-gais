
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Job, JobStatus } from '../../types';
import { jobService } from '../../services/jobService';
import { locationService } from '../../services/locationService';
import { canTransition } from '../../services/stateMachine';

import WorkerOnboarding from './WorkerOnboarding';
import RadarView from './RadarView';
import ActiveJobsView from './ActiveJobsView';
import EarningsView from './EarningsView';
import ProfileSettingsView from './ProfileSettingsView';

import { 
  Power, Loader2, LayoutDashboard, Radar, 
  Wallet, BadgeCheck, AlertTriangle, UserCircle 
} from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const WorkerDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const { user, workerStats, isVerified, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'radar' | 'earnings' | 'jobs' | 'profile'>('radar');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const telemetryWatchId = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Phase 9.1: Real-time Telemetry Stream
  useEffect(() => {
    if (isOnline && user && isVerified) {
      telemetryWatchId.current = locationService.watchPosition((coords) => {
        setUserLocation({ lat: coords.lat, lng: coords.lng });
        
        // Throttled database sync (every 20 seconds)
        const now = Date.now();
        if (now - lastUpdateRef.current > 20000) {
          locationService.updateWorkerTelemetry(user.id, coords)
            .catch(err => console.error("Telemetry Sync Error", err));
          lastUpdateRef.current = now;
        }
      });
    } else {
      if (telemetryWatchId.current !== null) {
        navigator.geolocation.clearWatch(telemetryWatchId.current);
        telemetryWatchId.current = null;
      }
    }

    return () => {
      if (telemetryWatchId.current !== null) {
        navigator.geolocation.clearWatch(telemetryWatchId.current);
      }
    };
  }, [isOnline, user, isVerified]);

  useEffect(() => {
    if (!isVerified) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      if (!user) return;
      try {
        let loc = null;
        if (isOnline) {
          // If we already have a watch-based location, use it, otherwise fetch fresh
          loc = userLocation || await locationService.getCurrentPosition();
          if (!userLocation) setUserLocation(loc);
        }

        const [myJobs, availableLeads] = await Promise.all([
          jobService.getMyJobs(user.id),
          jobService.getAvailableLeads(loc?.lat, loc?.lng)
        ]);
        
        const uniqueLeads = availableLeads.filter(lead => !myJobs.some(myJob => myJob.id === lead.id));
        setJobs([...myJobs, ...uniqueLeads]);
      } catch (err) {
        console.error("Worker Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    if (user) {
      const jobChannel = jobService.subscribeToMyJobs(user.id, (updatedJob) => {
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        if (updatedJob.status === JobStatus.PAID) {
           refreshProfile();
        }
      });

      const leadsChannel = jobService.subscribeToAvailableLeads((newLead) => {
         setJobs(prev => {
            if (prev.some(j => j.id === newLead.id)) return prev;
            return [newLead, ...prev];
         });
      });

      return () => {
        jobChannel.unsubscribe();
        leadsChannel.unsubscribe();
      };
    }
  }, [user, isOnline, isVerified]);

  if (!isVerified) {
    return <WorkerOnboarding />;
  }

  const assignedJobs = jobs.filter(j => j.workerId === user?.id && j.status !== JobStatus.PAID && j.status !== JobStatus.CANCELLED);
  const availableLeads = jobs.filter(j => j.status === JobStatus.REQUESTED);

  const updateJobStatus = async (jobId: string, nextStatus: JobStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && canTransition(job.status, nextStatus)) {
      try {
        await jobService.updateJobStatus(jobId, nextStatus);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus, updatedAt: new Date().toISOString() } : j));
      } catch (err) {
        setTransitionError("Platform Sync Failed. Try again.");
      }
    } else {
      setTransitionError(`Invalid state transition requested.`);
      setTimeout(() => setTransitionError(null), 3000);
    }
  };

  const claimJob = async (jobId: string) => {
    if (!user) return;
    try {
      const success = await jobService.claimJob(jobId, user.id);
      if (!success) throw new Error("Already claimed");
      setActiveTab('jobs');
    } catch (err) {
      alert("Lead already claimed by another partner.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Connecting to Lead Network</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-white p-2 rounded-[2rem] my-10 border border-gray-100 shadow-sm w-fit hidden md:flex">
        {(['radar', 'jobs', 'earnings', 'profile'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-3 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'radar' && (
          <RadarView 
            isOnline={isOnline} 
            setIsOnline={setIsOnline} 
            leads={availableLeads}
            userLocation={userLocation}
            onClaim={claimJob}
            workerStats={workerStats}
            userAvatar={user?.avatar}
          />
      )}

      {activeTab === 'jobs' && (
        <ActiveJobsView jobs={assignedJobs} onStatusUpdate={updateJobStatus} />
      )}

      {activeTab === 'earnings' && <EarningsView />}
      {activeTab === 'profile' && <ProfileSettingsView />}
    </div>
  );
};

export default WorkerDashboard;
