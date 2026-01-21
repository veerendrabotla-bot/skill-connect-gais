
import React from 'react';
import { Job } from '../../types';
import { X, CheckCircle2, Lock, Download, Receipt } from 'lucide-react';

interface Props {
  job: Job;
  onClose: () => void;
}

const ReceiptModal: React.FC<Props> = ({ job, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-indigo-600 p-12 text-center text-white space-y-4">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">Settlement Receipt</h3>
          <p className="text-indigo-100 text-sm font-medium">Log Entry #{job.id.slice(0, 8)}</p>
        </div>
        <div className="p-12 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
              <span>Node Execution Charge</span>
              <span className="text-gray-900">₹{job.price - 49}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
              <span>Platform Convenience</span>
              <span className="text-gray-900">₹49</span>
            </div>
            <div className="flex justify-between items-center text-xl font-black text-gray-900 pt-2">
              <span>Net Settlement</span>
              <span className="text-indigo-600 text-2xl">₹{job.price}</span>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Authorization Matrix</p>
            <p className="font-bold text-gray-900 flex items-center justify-center gap-2">
              <Lock size={16} /> Encrypted Transaction Logged
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Close Archive</button>
            <button className="flex items-center justify-center w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"><Download size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
