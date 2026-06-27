import HealingSkillEffectResolverModel from '../HealingSkillEffectResolver';

describe('healing skill effect resolver', () => {
  test('uses neutral missing values until custom healing effects are provided', () => {
    const effects = HealingSkillEffectResolverModel.createHealingEffects({
      skillData: { blackboard: [] },
      rule: {
        effects: {},
        ignoredAttributes: new Set(),
      },
    });

    expect(effects.healScale()).toBe(0);
    expect(effects.healFlat()).toBe(0);
    expect(effects.fieldResult('healScale')).toEqual({
      found: false,
      value: 0,
      source: 'missing',
    });
  });

  test('maps custom healing fields independently from damage fields', () => {
    const effects = HealingSkillEffectResolverModel.createHealingEffects({
      skillData: { blackboard: [] },
      rule: {
        effects: {
          HEAL_heal_scale: 1.5,
          HEAL_flat: 120,
        },
        ignoredAttributes: new Set(),
      },
    });

    expect(effects.healScale()).toBe(1.5);
    expect(effects.healFlat()).toBe(120);
    expect(effects.fieldResult('healFlat').source).toBe('custom');
  });
});
