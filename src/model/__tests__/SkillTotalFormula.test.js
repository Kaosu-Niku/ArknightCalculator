import {
  resolveAttackCount,
  resolveAttackInterval,
  resolveDamageStreamTotal,
  resolveDpsByStreams,
  resolveSkillDuration,
  resolveTotalByStreams,
} from '../SkillTotalFormula';
import { isPermanentSkill } from '../skillDurationRules';
import {
  getConditionalModuleTrait,
  getExtraAttackHitMultiplier,
  getStaticModuleTrait,
  hasConditionalModuleTrait,
} from '../uniequipTraitRules';
import {
  expectedAdditive,
  expectedMultiplier,
  normalizeProbability,
} from '../conditionalEffect';

describe('skill total formula', () => {
  test('identifies module branches with conditional formula traits', () => {
    expect(hasConditionalModuleTrait('強攻手')).toBe(true);
    expect(hasConditionalModuleTrait('不存在的分支')).toBe(false);
  });

  test('missing conditional module values resolve to neutral numbers', () => {
    const missingBlackboard = { value: () => undefined };

    expect(getConditionalModuleTrait('行商', 'atk', missingBlackboard)).toBe(0);
    expect(getConditionalModuleTrait('神射手', 'damage_scale', missingBlackboard)).toBe(1);
  });

  test('conditional effects use probability-weighted expectations', () => {
    expect(normalizeProbability(20)).toBe(0.2);
    expect(expectedAdditive(0.6, 0.3)).toBeCloseTo(0.18);
    expect(expectedMultiplier(1.6, 0.2)).toBeCloseTo(1.12);

    const values = new Map([
      ['atk_scale', 1.5],
      ['damage_scale', 0.5],
      ['attack_speed', 20],
      ['prob', 0.2],
    ]);
    const blackboard = { value: key => values.get(key) };

    expect(getConditionalModuleTrait('強攻手', 'atk_scale', blackboard)).toBeCloseTo(1.1);
    expect(getConditionalModuleTrait('神射手', 'damage_scale', blackboard)).toBeCloseTo(1.1);
    expect(getConditionalModuleTrait('無畏者', 'attack_speed', blackboard)).toBeCloseTo(4);
  });

  test('new module branch traits resolve through the shared rule table', () => {
    const values = new Map([
      ['atk_scale', 1.1],
      ['damage_scale', 1.1],
    ]);
    const blackboard = { value: key => values.get(key) };
    const artsProtectorBlackboard = {
      value: key => key === 'atk_scale' ? 0.1 : undefined,
    };

    expect(getConditionalModuleTrait('回環射手', 'atk_scale', blackboard)).toBe(1.1);
    expect(getConditionalModuleTrait('本源術師', 'damage_scale', blackboard)).toBe(1.1);
    expect(getStaticModuleTrait('馭法鐵衛', 'other2_attack_scale', artsProtectorBlackboard)).toBe(0.1);
    expect(getStaticModuleTrait('馭法鐵衛', 'other2_attack_type', blackboard)).toBe('法術');
  });

  test('resolves attack interval with all revisions', () => {
    expect(resolveAttackInterval({
      baseAttackTime: 2,
      attackTimeRevision: -0.2,
      talentAttackTimeRevision: 0.1,
      attackSpeed: 100,
      attackSpeedRevision: 10,
      talentAttackSpeedRevision: 5,
      traitAttackSpeedRevision: 5,
    })).toBeCloseTo(1.5833333333333333);
  });

  test('normalizes only a zero attack count', () => {
    expect(resolveAttackCount(0)).toBe(1);
    expect(resolveAttackCount(2)).toBe(2);
    expect(resolveAttackCount(-1)).toBe(-1);
  });

  test('preserves duration normalization and truthy override behavior', () => {
    expect(resolveSkillDuration(0, 0)).toBe(1);
    expect(resolveSkillDuration(-1, null)).toBe(1);
    expect(resolveSkillDuration(20, 5)).toBe(5);
    expect(resolveSkillDuration(20, 0, -5)).toBe(15);
    expect(resolveSkillDuration(20, 10, -3)).toBe(7);
    expect(resolveSkillDuration(3, 0, -5)).toBe(1);
  });

  test('resolves total damage for timed and segmented streams', () => {
    expect(resolveDamageStreamTotal({ damage: 100 }, {
      attackCount: 1,
      attackInterval: 2,
      duration: 20,
      times: 0,
      ammoCount: 0,
    })).toBe(1000);

    expect(resolveDamageStreamTotal({ damage: 100 }, {
      attackCount: 1,
      attackInterval: 2,
      duration: 1,
      times: 3,
      ammoCount: 0,
    })).toBe(300);
  });

  test('ammo total includes every per-attack damage stream', () => {
    expect(resolveTotalByStreams([
      { damage: 100 },
      { damage: 50 },
      { damage: 25, hitMultiplier: 2 },
    ], {
      attackCount: 1,
      attackInterval: 2,
      duration: 20,
      times: 0,
      ammoCount: 6,
    })).toBe(1200);
  });

  test('damage streams can override shared times and duration independently', () => {
    const schedule = {
      attackCount: 1,
      attackInterval: 2,
      duration: 10,
      times: 0,
      ammoCount: 0,
    };

    expect(resolveTotalByStreams([
      { damage: 100, times: 1 },
      { damage: 20, interval: 1, duration: 6 },
    ], schedule)).toBe(220);
  });

  test('uses active duration for normal, ammo, segmented and instant DPS', () => {
    const streams = [{ damage: 100 }, { damage: 50, interval: 1 }];
    const baseSchedule = {
      attackCount: 1,
      attackInterval: 2,
      duration: 10,
      times: 0,
      ammoCount: 0,
      isPermanent: false,
    };

    expect(resolveDpsByStreams(streams, baseSchedule)).toBe(100);
    expect(resolveDpsByStreams(streams, {
      ...baseSchedule,
      ammoCount: 6,
    })).toBe(75);
    expect(resolveDpsByStreams([{ damage: 100 }], {
      ...baseSchedule,
      times: 3,
    })).toBe(300);
    expect(resolveDpsByStreams([{ damage: 100 }], {
      ...baseSchedule,
      duration: 1,
    })).toBe(100);
  });

  test('sums independent stream rates for permanent skills', () => {
    expect(resolveDpsByStreams([
      { damage: 100 },
      { damage: 50, interval: 1 },
    ], {
      attackCount: 1,
      attackInterval: 2,
      duration: 1,
      times: 0,
      ammoCount: 0,
      isPermanent: true,
    })).toBe(100);
  });

  test('treats the highest stage of permanent skills as permanent', () => {
    expect(isPermanentSkill({ description: '攻擊力提升，持续时间无限' })).toBe(true);
    expect(isPermanentSkill({ description: '可以在下列状态和初始状态间切换' })).toBe(true);
    expect(isPermanentSkill({ description: '第二次及以后使用时持续时间无限' })).toBe(true);
    expect(isPermanentSkill({ description: '立即造成一次伤害' })).toBe(false);
  });

  test('keeps the thrower third attack rule outside the generic scheduler', () => {
    expect(getExtraAttackHitMultiplier('投擲手', 1)).toBe(2);
    expect(getExtraAttackHitMultiplier('投擲手', 0)).toBe(1);
    expect(getExtraAttackHitMultiplier('領主', 1)).toBe(1);
  });
});
