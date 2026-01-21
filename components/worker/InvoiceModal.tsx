
import React, { useState } from 'react';
import { Job } from '../../types';
import { X, Plus, Trash2, Calculator, Receipt, ShieldCheck } from 'lucide-react';

interface Props {
  job: Job;
  onClose: () => void;
  onSubmit: (invoice: any) => Promise<void>;
  submitting: boolean;
}

const InvoiceModal: React.FC<Props> = ({ job, onClose, onSubmit, submitting }) => {
  const [items, setItems] = useState<{label: string, amount: number}[]>([
    { label: 'Standard Labor Charge', amount: job.price }
  ]);

  const addItem = () => setItems([...items, { label: '', amount: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const platformFee = 49;
  const netTotal = total + platformFee;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Receipt size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Final Settlement</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Protocol: INVOICE_GEN_V1</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itemized Execution</h4>
              <button onClick={addItem} className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase hover:underline">
                <Plus size={14} /> Add Line Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-2">
                  <input 
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(idx, 'label', e.target.value)}
                    placeholder="Description"
                    className="flex-1 p-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold text-sm outline-none"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                      className="w-full pl-8 pr-4 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold text-sm outline-none"
                    />
                  </div>
                  {idx > 0 && (
                    <button onClick={() => removeItem(idx)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-xs font-black text-blue-300 uppercase tracking-widest">
                   <span>Gross Execution</span>
                   <span>₹{total}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black text-blue-300 uppercase tracking-widest">
                   <span>Platform Conveyance</span>
                   <span>₹{platformFee}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                   <span className="text-sm font-black uppercase tracking-widest">Net Settlement</span>
                   <span className="text-4xl font-black tracking-tighter">₹{netTotal}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-10 bg-gray-50 shrink-0">
           <button 
            disabled={submitting || total <= 0}
            onClick={() => onSubmit({ items, total: netTotal })}
            className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
           >
             {submitting ? <Calculator className="animate-spin" /> : <ShieldCheck size={24} />}
             {submitting ? 'Authenticating Ledger...' : 'Request Customer Release'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
