import {
  resolveAttackCount,
  resolveAttackInterval,
  resolveDamageStreamTotal,
  resolveSkillDuration,
  resolveTotalByStreams,
} from '../SkillTotalFormula';
import {
  getConditionalModuleTrait,
  getExtraAttackHitMultiplier,
  hasConditionalModuleTrait,
} from '../uniequipTraitRules';

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

  test('keeps the thrower third attack rule outside the generic scheduler', () => {
    expect(getExtraAttackHitMultiplier('投擲手', 1)).toBe(2);
    expect(getExtraAttackHitMultiplier('投擲手', 0)).toBe(1);
    expect(getExtraAttackHitMultiplier('領主', 1)).toBe(1);
  });
});
