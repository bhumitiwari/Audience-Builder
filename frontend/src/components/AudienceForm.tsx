import React, { useState } from 'react';
import type {
  ConditionRule,
  EventType,
  Operator,
  AudiencePreviewRequest,
} from '../api.js';

const EVENT_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'product_view', label: 'Product View' },
  { value: 'page_view', label: 'Page View' },
  { value: 'add_to_cart', label: 'Add to Cart' },
  { value: 'checkout_started', label: 'Checkout Started' },
  { value: 'purchase', label: 'Purchase' },
];

const INITIAL_CONDITIONS: ConditionRule[] = [
  { id: '1', eventType: 'product_view', operator: 'at_least', count: 2, withinDays: 7 },
  { id: '2', eventType: 'purchase', operator: 'exactly', count: 0, withinDays: 7 },
];

interface AudienceFormProps {
  isLoading: boolean;
  onSubmit: (payload: AudiencePreviewRequest) => void;
  onReset: () => void;
}

export const AudienceForm: React.FC<AudienceFormProps> = ({
  isLoading,
  onSubmit,
  onReset,
}) => {
  // Local Form State
  const [name, setName] = useState<string>('Viewed but not purchased');
  const [asOf, setAsOf] = useState<string>('2026-09-29T00:00:00.000Z');
  const [conditions, setConditions] = useState<ConditionRule[]>(INITIAL_CONDITIONS);
  const [clientErrors, setClientErrors] = useState<string[]>([]);

  // Condition mutations
  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        eventType: 'product_view',
        operator: 'at_least',
        count: 1,
        withinDays: 7,
      },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, updates: Partial<ConditionRule>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSetNow = () => {
    setAsOf(new Date().toISOString());
  };

  const handleSetSeedDate = () => {
    setAsOf('2026-09-29T00:00:00.000Z');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Audience name cannot be empty.');
    }
    if (!asOf.trim() || isNaN(Date.parse(asOf))) {
      errors.push('asOf must be a valid ISO 8601 date string.');
    }
    if (conditions.length === 0) {
      errors.push('At least one condition must be specified.');
    }

    conditions.forEach((c, idx) => {
      const num = idx + 1;
      if (c.count === '' || isNaN(Number(c.count))) {
        errors.push(`Condition ${num}: Count is required.`);
      } else if (Number(c.count) < 0) {
        errors.push(`Condition ${num}: Count cannot be negative.`);
      }

      if (c.withinDays === '' || isNaN(Number(c.withinDays))) {
        errors.push(`Condition ${num}: Within (Days) is required.`);
      } else if (Number(c.withinDays) < 1) {
        if (Number(c.withinDays) < 0) {
          errors.push(`Condition ${num}: Within (Days) cannot be negative. Must be at least 1 day.`);
        } else {
          errors.push(`Condition ${num}: Within (Days) cannot be 0. Must be at least 1 day.`);
        }
      }
    });

    if (errors.length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors([]);
    onSubmit({
      name: name.trim(),
      asOf: asOf.trim(),
      conditions: conditions.map(({ eventType, operator, count, withinDays }) => ({
        eventType,
        operator,
        count: Number(count),
        withinDays: Number(withinDays),
      })),
    });
  };

  const handleResetForm = () => {
    setName('Viewed but not purchased');
    setAsOf('2026-09-29T00:00:00.000Z');
    setConditions(INITIAL_CONDITIONS);
    setClientErrors([]);
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }}
      className="space-y-5"
      aria-label="Audience Rule Definition Form"
    >
      {/* Client validation alerts */}
      {clientErrors.length > 0 && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs space-y-1"
        >
          <strong className="block font-semibold">Please resolve the following:</strong>
          <ul className="list-disc list-inside space-y-0.5">
            {clientErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Section */}
      <fieldset className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Audience Metadata
        </legend>

        {/* Audience Name */}
        <div>
          <label htmlFor="aud-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Audience Name <span className="text-rose-500" aria-hidden="true">*</span>
          </label>
          <input
            id="aud-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Viewed but not purchased"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          />
        </div>

        {/* asOf Timestamp with NOW button */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
            <label htmlFor="aud-as-of" className="text-xs font-semibold text-slate-700">
              Evaluation Timestamp (<code className="font-mono text-[11px]">asOf</code>){' '}
              <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <div className="flex items-center space-x-1.5 text-xs">
              <button
                type="button"
                onClick={handleSetNow}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
                title="Fill with current ISO timestamp"
              >
                Now
              </button>
              <button
                type="button"
                onClick={handleSetSeedDate}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
                title="Fill with assignment seed dataset date (2026-09-29)"
              >
                Seed Date
              </button>
            </div>
          </div>
          <input
            id="aud-as-of"
            type="text"
            required
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            placeholder="2026-09-29T00:00:00.000Z"
            aria-describedby="as-of-help"
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          />
          <p id="as-of-help" className="mt-1 text-[11px] text-slate-400">
            Rules evaluate strictly relative to this date snapshot (events after this date are ignored).
          </p>
        </div>
      </fieldset>

      {/* Conditions Section */}
      <fieldset className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Behavioral Conditions (Combined with AND)
          </legend>
          <span className="text-xs text-slate-400" aria-live="polite">
            {conditions.length} {conditions.length === 1 ? 'condition' : 'conditions'}
          </span>
        </div>

        <div className="space-y-3">
          {conditions.map((condition, idx) => (
            <div
              key={condition.id}
              role="group"
              aria-label={`Condition Rule ${idx + 1}`}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 transition-colors focus-within:border-slate-400"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="font-semibold text-slate-800">
                  {idx === 0 ? 'Where user performed' : 'AND user performed'}
                </span>
                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(condition.id)}
                    aria-label={`Remove condition ${idx + 1}`}
                    className="text-rose-600 hover:text-rose-800 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 text-xs">
                {/* Event Type */}
                <div className="col-span-2 sm:col-span-1 xl:col-span-1">
                  <label
                    htmlFor={`event-${condition.id}`}
                    className="block text-[11px] font-medium text-slate-600 mb-0.5"
                  >
                    Event Type
                  </label>
                  <select
                    id={`event-${condition.id}`}
                    value={condition.eventType}
                    onChange={(e) =>
                      handleUpdateCondition(condition.id, {
                        eventType: e.target.value as EventType,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    {EVENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="col-span-2 sm:col-span-1 xl:col-span-1">
                  <label
                    htmlFor={`op-${condition.id}`}
                    className="block text-[11px] font-medium text-slate-600 mb-0.5"
                  >
                    Operator
                  </label>
                  <select
                    id={`op-${condition.id}`}
                    value={condition.operator}
                    onChange={(e) =>
                      handleUpdateCondition(condition.id, {
                        operator: e.target.value as Operator,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <option value="at_least">At least (≥)</option>
                    <option value="exactly">Exactly (=)</option>
                  </select>
                </div>

                {/* Count */}
                <div className="col-span-1 xl:col-span-1">
                  <label
                    htmlFor={`cnt-${condition.id}`}
                    className="block text-[11px] font-medium text-slate-600 mb-0.5"
                  >
                    Count
                  </label>
                  <input
                    id={`cnt-${condition.id}`}
                    type="number"
                    step="1"
                    value={condition.count}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateCondition(condition.id, {
                        count: val === '' ? '' : parseInt(val, 10),
                      });
                    }}
                    className={`w-full px-2.5 py-1.5 bg-white border ${
                      condition.count !== '' && Number(condition.count) < 0
                        ? 'border-rose-400 focus-visible:ring-rose-500'
                        : 'border-slate-300 focus-visible:ring-slate-900'
                    } rounded text-slate-800 focus-visible:outline-none focus-visible:ring-2`}
                  />
                  {condition.count !== '' && Number(condition.count) < 0 && (
                    <p className="mt-0.5 text-[10px] text-rose-600 font-medium">Must be ≥ 0</p>
                  )}
                </div>

                {/* Within Days */}
                <div className="col-span-1 xl:col-span-1">
                  <label
                    htmlFor={`days-${condition.id}`}
                    className="block text-[11px] font-medium text-slate-600 mb-0.5"
                  >
                    Within (Days)
                  </label>
                  <input
                    id={`days-${condition.id}`}
                    type="number"
                    step="1"
                    value={condition.withinDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateCondition(condition.id, {
                        withinDays: val === '' ? '' : parseInt(val, 10),
                      });
                    }}
                    className={`w-full px-2.5 py-1.5 bg-white border ${
                      condition.withinDays !== '' && Number(condition.withinDays) < 1
                        ? 'border-rose-400 focus-visible:ring-rose-500'
                        : 'border-slate-300 focus-visible:ring-slate-900'
                    } rounded text-slate-800 focus-visible:outline-none focus-visible:ring-2`}
                  />
                  {condition.withinDays !== '' && Number(condition.withinDays) < 1 && (
                    <p className="mt-0.5 text-[10px] text-rose-600 font-medium">
                      {Number(condition.withinDays) < 0 ? 'Cannot be negative' : 'Must be ≥ 1'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCondition}
          aria-label="Add new condition rule"
          className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
        >
          + Add Condition
        </button>
      </fieldset>

      {/* Form Action Controls */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleResetForm}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
        >
          Reset Form
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Evaluating Membership...' : 'Preview Audience (Ctrl+Enter)'}
        </button>
      </div>
    </form>
  );
};
