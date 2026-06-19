import {
  resolveArtsDamage,
  resolveAttackDamage,
  resolveAttackPower,
  resolveEnemyDefense,
  resolveEnemyResistance,
  resolvePhysicalDamage,
  splitReduction,
} from '../DamageFormula';

describe('damage formula helpers', () => {
  test.each([
    [0.2, { ratio: 0, fixed: 0 }],
    [0, { ratio: 0, fixed: 0 }],
    [undefined, { ratio: 0, fixed: 0 }],
    [-0.25, { ratio: -0.25, fixed: 0 }],
    [-1, { ratio: 0, fixed: -1 }],
    [-100, { ratio: 0, fixed: -100 }],
  ])('splits reduction %p using the existing threshold', (value, expected) => {
    expect(splitReduction(value)).toEqual(expected);
  });

  test('resolves enemy defense in the existing operation order', () => {
    expect(resolveEnemyDefense({
      enemyDefense: 1000,
      skillReduction: -0.2,
      talentReduction: -100,
      skillPenetration: 50,
      traitPenetration: 25,
    })).toBe(625);
  });

  test('clamps enemy defense to zero', () => {
    expect(resolveEnemyDefense({
      enemyDefense: 100,
      skillReduction: 0,
      talentReduction: 0,
      skillPenetration: 200,
      traitPenetration: 0,
    })).toBe(0);
  });

  test('resolves and clamps enemy resistance', () => {
    expect(resolveEnemyResistance({
      enemyResistance: 50,
      skillReduction: -0.2,
      talentReduction: -10,
      traitAdjustment: 5,
    })).toBe(35);

    expect(resolveEnemyResistance({
      enemyResistance: 120,
      skillReduction: 0,
      talentReduction: 0,
      traitAdjustment: 10,
    })).toBe(100);

    expect(resolveEnemyResistance({
      enemyResistance: 10,
      skillReduction: -100,
      talentReduction: 0,
      traitAdjustment: 0,
    })).toBe(0);
  });

  test('resolves physical and arts damage', () => {
    expect(resolvePhysicalDamage(800, 300)).toBe(500);
    expect(resolveArtsDamage(800, 25)).toBe(600);
  });

  test('combines attack multipliers and scales in the existing order', () => {
    expect(resolveAttackPower({
      baseAttack: 500,
      attackMultiplierFactor: 1.5,
      attackScale: 1.2,
      extraAttackScale: 0.8,
    })).toBeCloseTo(720);
  });

  test('uses proportional extra damage below 10', () => {
    expect(resolveAttackDamage({
      attackType: '物理',
      baseAttack: 500,
      attackMultiplierFactor: 1,
      attackScale: 1,
      extraAttackScale: 0.8,
      minimumDamageScale: 0.05,
      enemyDefense: 100,
      enemyResistance: 0,
      damageMultiplier: 1,
    })).toBe(300);
  });

  test('thrower second hits inherit skill scaling before the half-damage scale', () => {
    const skillAttack = {
      baseAttack: 100,
      attackMultiplierFactor: 1.5,
      attackScale: 1.5,
    };

    expect(resolveAttackPower({
      ...skillAttack,
      extraAttackScale: null,
    })).toBe(225);
    expect(resolveAttackPower({
      ...skillAttack,
      extraAttackScale: 0.5,
    })).toBe(112.5);
  });

  test('preserves fixed extra damage and its existing minimum calculation', () => {
    expect(resolveAttackDamage({
      attackType: '物理',
      baseAttack: 100,
      attackMultiplierFactor: 1,
      attackScale: 1,
      extraAttackScale: 20,
      minimumDamageScale: 0.05,
      enemyDefense: 50,
      enemyResistance: 0,
      damageMultiplier: 1,
    })).toBe(100);
  });

  test('returns zero for healing and non-attacking types', () => {
    const values = {
      baseAttack: 500,
      attackMultiplierFactor: 1,
      attackScale: 1,
      extraAttackScale: null,
      minimumDamageScale: 0.05,
      enemyDefense: 0,
      enemyResistance: 0,
      damageMultiplier: 1,
    };

    expect(resolveAttackDamage({ ...values, attackType: '治療' })).toBe(0);
    expect(resolveAttackDamage({ ...values, attackType: '不攻擊' })).toBe(0);
  });
});
