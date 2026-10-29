/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNexus } from '../../context/NexusContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNexus();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/40 bg-[#0A1612]/95',
          warning: 'border-amber-500/40 bg-[#161208]/95',
          error: 'border-rose-500/40 bg-[#170A0B]/95',
          info: 'border-cyan-500/40 bg-[#081318]/95',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${borders[toast.type]}`}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                <span>{toast.title}</span>
                <span className="text-[10px] font-mono text-slate-400 ml-2">
                  {toast.timestamp}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
