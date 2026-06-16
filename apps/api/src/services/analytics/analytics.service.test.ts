import { describe, expect, it } from 'vitest';
import { applyEtaAggregation, classifyEta } from './analytics.service.js';

describe('classifyEta', () => {
  it('returns no_eta_data when estimate is missing', () => {
    expect(classifyEta(null, 4)).toBe('no_eta_data');
  });

  it('returns no_eta_data when actual is missing', () => {
    expect(classifyEta(4, null)).toBe('no_eta_data');
  });

  it('returns before_eta when actual is clearly lower than estimate', () => {
    expect(classifyEta(8, 7.5)).toBe('before_eta');
  });

  it('returns on_eta when within epsilon window', () => {
    expect(classifyEta(8, 8.005)).toBe('on_eta');
    expect(classifyEta(8, 7.995)).toBe('on_eta');
  });

  it('returns over_eta when actual exceeds estimate beyond epsilon', () => {
    expect(classifyEta(8, 8.02)).toBe('over_eta');
  });
});

describe('applyEtaAggregation', () => {
  it('increments correct bucket and tracks variance', () => {
    const acc = {
      beforeEta: 0,
      onEta: 0,
      overEta: 0,
      noEtaData: 0,
      varianceSum: 0,
      varianceCount: 0,
    };

    applyEtaAggregation(acc, 'before_eta', -1.5);
    applyEtaAggregation(acc, 'on_eta', 0);
    applyEtaAggregation(acc, 'over_eta', 2.25);
    applyEtaAggregation(acc, 'no_eta_data', null);

    expect(acc.beforeEta).toBe(1);
    expect(acc.onEta).toBe(1);
    expect(acc.overEta).toBe(1);
    expect(acc.noEtaData).toBe(1);
    expect(acc.varianceCount).toBe(3);
    expect(acc.varianceSum).toBeCloseTo(0.75, 6);
  });
});
