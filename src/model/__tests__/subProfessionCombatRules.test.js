import { resolveSkillAttackType } from '../subProfessionCombatRules';

describe('sub-profession combat rules', () => {
  test('arts protectors always deal arts damage during skills', () => {
    expect(resolveSkillAttackType({
      subProfessionId: 'artsprotector',
      baseAttackType: '物理',
      skillAttackType: '物理',
      streamAttackType: null,
    })).toBe('法術');
  });

  test('abjurers only heal during skills', () => {
    expect(resolveSkillAttackType({
      subProfessionId: 'blessing',
      baseAttackType: '法術',
      skillAttackType: '法術',
      streamAttackType: '物理',
    })).toBe('治療');
  });

  test('incantation medics retain their arts damage type', () => {
    expect(resolveSkillAttackType({
      subProfessionId: 'incantationmedic',
      baseAttackType: '法術',
      skillAttackType: null,
      streamAttackType: null,
    })).toBe('法術');
  });

  test('ordinary branches still honor skill and extra-stream overrides', () => {
    expect(resolveSkillAttackType({
      subProfessionId: 'corecaster',
      baseAttackType: '法術',
      skillAttackType: '不攻擊',
      streamAttackType: null,
    })).toBe('不攻擊');
    expect(resolveSkillAttackType({
      subProfessionId: 'corecaster',
      baseAttackType: '法術',
      skillAttackType: null,
      streamAttackType: '物理',
    })).toBe('物理');
  });
});
