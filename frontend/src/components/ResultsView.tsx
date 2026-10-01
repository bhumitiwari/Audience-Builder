import React from 'react';
import type { AudiencePreviewResponse } from '../api.js';

interface ResultsViewProps {
  result: AudiencePreviewResponse | null;
  isLoading: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, isLoading }) => {
  return (
    <section
      aria-labelledby="results-heading"
      className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 id="results-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Preview Results
        </h2>
        {result && (
          <span
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-800"
            aria-live="polite"
          >
            {result.total} {result.total === 1 ? 'user' : 'users'} matched
          </span>
        )}
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="py-12 text-center text-xs text-slate-500"
        >
          Evaluating audience membership against synthetic event data...
        </div>
      )}

      {!isLoading && !result && (
        <div className="py-12 text-center text-xs text-slate-500">
          Configure rule conditions on the left and click <strong>Preview Audience</strong>.
        </div>
      )}

      {!isLoading && result && result.total === 0 && (
        <div
          role="status"
          className="py-12 text-center text-xs text-slate-500 space-y-1"
        >
          <strong className="block text-slate-700">0 users matched.</strong>
          <p>No anonymous users satisfied all conditions for this time window.</p>
        </div>
      )}

      {!isLoading && result && result.total > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th scope="col" className="py-2.5 px-3">
                  Anonymous ID
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Observed Behavior Evidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.members.map((member) => (
                <tr key={member.anonymousId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                    {member.anonymousId}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {member.evidence.map((ev, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-slate-700"
                        >
                          {ev.eventType}: <strong>{ev.observedCount}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
