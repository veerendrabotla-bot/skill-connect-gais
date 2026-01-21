
import React, { useState } from 'react';
import { Job } from '../../types';
import { X, Gavel, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

type DisputeCategory = 'PRICING' | 'QUALITY' | 'BEHAVIOR' | 'INCOMPLETE';

const DisputeModal: React.FC<Props> = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<DisputeCategory>('QUALITY');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      await jobService.submitDispute(job.id, user.id, category, reason);
      onSuccess();
    } catch (err) {
      alert("Dispute submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-red-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-red-50/50">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-red-100">
              <Gavel size={36} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Initiate Resolution</h3>
              <p className="text-red-600 font-black text-[10px] uppercase tracking-widest">Governance ID: {job.id.slice(0, 12)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
        </div>
        <div className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Incident Category</label>
            <div className="grid grid-cols-2 gap-4">
              {(['QUALITY', 'PRICING', 'BEHAVIOR', 'INCOMPLETE'] as DisputeCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-6 rounded-3xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${category === cat ? 'border-red-600 bg-red-50 text-red-600 shadow-lg shadow-red-50' : 'border-gray-50 bg-gray-50 text-gray-400 hover:bg-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Statement of Facts</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the issue for our governance audit team..."
              rows={5}
              className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all"
            />
          </div>

          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-start gap-4">
            <AlertTriangle className="text-orange-600 shrink-0" size={24} />
            <p className="text-sm font-medium text-orange-800 leading-relaxed">
              Escrow will be frozen immediately. Admin investigation will follow strict SLA protocols.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-lg shadow-3xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
            {submitting ? 'Finalizing Case...' : 'Submit Resolution Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;
