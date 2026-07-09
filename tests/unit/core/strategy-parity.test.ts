import { deepVisit, deepVisitAsync } from '../../../src/core/strategies/traverser';
import { applyMaskStrategy, applyMaskStrategyAsync } from '../../../src/core/strategies/mask-strategy';
import { applyAllowStrategy, applyAllowStrategyAsync } from '../../../src/core/strategies/allow-strategy';
import { applyAutoStrategy, applyAutoStrategyAsync } from '../../../src/core/strategies/auto-strategy';
import { MaskifyCore } from '../../../src/core/maskify';

/**
 * Every strategy in core/strategies ships a hand-duplicated async twin of
 * its sync logic. These tests assert the two stay behaviorally identical —
 * without them, a fix applied to only one twin would pass silently.
 */
describe('sync/async strategy parity', () => {
  it('traverser: deepVisit and deepVisitAsync visit the same nodes in the same order', async () => {
    const fixture = {
      user: { email: 'jane@example.com', tags: ['a', 'b'] },
      count: 3,
    };
    const syncCalls: Array<[string, any]> = [];
    const asyncCalls: Array<[string, any]> = [];

    deepVisit(fixture, (key, val) => {
      syncCalls.push([key, val]);
    });
    await deepVisitAsync(fixture, async (key, val) => {
      asyncCalls.push([key, val]);
    });

    expect(asyncCalls).toEqual(syncCalls);
  });

  it('mask-strategy: applyMaskStrategy and applyMaskStrategyAsync produce identical output', async () => {
    const schema = { 'user.email': { type: 'email' as const } };
    const syncTarget = { user: { email: 'jane@example.com' } };
    const asyncTarget = { user: { email: 'jane@example.com' } };

    applyMaskStrategy(syncTarget, schema, (val, opts) => MaskifyCore.mask(val, opts));
    await applyMaskStrategyAsync(asyncTarget, schema, (val, opts) => MaskifyCore.maskAsync(val, opts));

    expect(asyncTarget).toEqual(syncTarget);
  });

  it('allow-strategy: applyAllowStrategy and applyAllowStrategyAsync produce identical output', async () => {
    const schema = { 'user.id': {} };
    const defaultMask = { type: 'generic' as const };
    const syncTarget = { user: { id: 'keep-me', email: 'jane@example.com' } };
    const asyncTarget = { user: { id: 'keep-me', email: 'jane@example.com' } };

    applyAllowStrategy(syncTarget, schema, defaultMask, (val, opts) => MaskifyCore.mask(val, opts));
    await applyAllowStrategyAsync(asyncTarget, schema, defaultMask, (val, opts) => MaskifyCore.maskAsync(val, opts));

    expect(asyncTarget).toEqual(syncTarget);
  });

  it('auto-strategy: applyAutoStrategy and applyAutoStrategyAsync produce identical output', async () => {
    const syncTarget = { password: 'super-secret', email: 'jane@example.com', note: 'hello' };
    const asyncTarget = { password: 'super-secret', email: 'jane@example.com', note: 'hello' };

    applyAutoStrategy(syncTarget, {}, (val, opts) => MaskifyCore.mask(val, opts));
    await applyAutoStrategyAsync(asyncTarget, {}, (val, opts) => MaskifyCore.maskAsync(val, opts));

    expect(asyncTarget).toEqual(syncTarget);
  });
});
