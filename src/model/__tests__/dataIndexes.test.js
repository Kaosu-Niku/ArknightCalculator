import SkillDataIndexModel from '../SkillDataIndex';
import TalentDataIndexModel from '../TalentDataIndex';
import TalentEffectRulesModel from '../talentEffectRules';
import TalentsCalculatorModel from '../TalentsCalculator';
import TalentsCustomCalculatorModel from '../TalentsCustomCalculator';
import UniequipDataIndexModel from '../UniequipDataIndex';

describe('data indexes', () => {
  test('skill blackboard keeps the first entry and an explicit zero', () => {
    const firstEntry = { key: 'atk_scale', value: 0 };
    const skillData = {
      blackboard: [firstEntry, { key: 'atk_scale', value: 2 }],
    };

    const blackboard = SkillDataIndexModel.blackboard(skillData);

    expect(blackboard.get('atk_scale')).toBe(firstEntry);
    expect(blackboard.get('atk_scale').value).toBe(0);
    expect(blackboard.has('missing')).toBe(false);
  });

  test('talent index preserves low-rarity level selection', () => {
    const member = {
      rarity: 'TIER_3',
      talents: [{
        candidates: [
          {
            unlockCondition: { phase: 'PHASE_0', level: 1 },
            blackboard: [{ key: 'atk', value: 0.1 }],
          },
          {
            unlockCondition: { phase: 'PHASE_0', level: 55 },
            blackboard: [{ key: 'atk', value: 0.2 }],
          },
        ],
      }],
    };

    expect(TalentDataIndexModel.resolve('精零1級', member).values.get('atk')).toBe(0.1);
    expect(TalentDataIndexModel.resolve('精零滿級', member).values.get('atk')).toBe(0.2);
    expect(TalentDataIndexModel.resolve('精二1級', member).values.get('atk')).toBe(0.2);
  });

  test('uniequip index uses the highest phase and first blackboard value', () => {
    const member = { potentialItemId: 'p_char_test', equipid: 'uniequip_test' };
    const uniequipData = { charEquip: { char_test: ['uniequip_test'] } };
    const firstPhase = { parts: [] };
    const highestPhase = {
      parts: [
        {
          overrideTraitDataBundle: {
            candidates: [{ blackboard: [
              { key: 'atk_scale', value: 0 },
              { key: 'atk_scale', value: 2 },
            ] }],
          },
        },
        {
          addOrOverrideTalentDataBundle: {
            candidates: [{ blackboard: [{ key: 'attack_speed', value: 12 }] }],
          },
        },
      ],
    };
    const battleData = {
      uniequip_test: { phases: [firstPhase, highestPhase] },
    };

    const index = UniequipDataIndexModel.resolve(member, uniequipData, battleData);

    expect(index.battlePhase).toBe(highestPhase);
    expect(index.traitBlackboard.get('atk_scale')).toBe(0);
    expect(index.talentBlackboard.get('attack_speed')).toBe(12);
  });
});

describe('custom talent effect semantics', () => {
  test('raw talent values remain available to custom rules after exclusion', () => {
    const member = {
      name: '猎蜂',
      rarity: 'TIER_4',
      potentialItemId: 'p_char_test',
      talents: [{ candidates: [{
        unlockCondition: { phase: 'PHASE_2', level: 1 },
        blackboard: [
          { key: 'atk', value: 0.05 },
          { key: 'max_stack_cnt', value: 5 },
        ],
      }] }],
    };
    const uniequipData = { charEquip: {} };
    const battleEquipData = {};

    expect(TalentsCalculatorModel.memberTalent(
      '精二滿級', member, uniequipData, battleEquipData, 'atk'
    )).toBe(0);
    expect(TalentsCalculatorModel.memberTalentRaw(
      '精二滿級', member, uniequipData, battleEquipData, 'atk'
    )).toBe(0.05);

    const rule = TalentsCustomCalculatorModel.createTalentEffectRule({
      type: '精二滿級',
      memberRow: member,
      uniequipJsonData: uniequipData,
      battleEquipJsonData: battleEquipData,
      conditionEffectsEnabled: true,
    });
    expect(rule.effects.attack).toBe(0.25);
  });

  test('stacking attack talents use their maximum stack count', () => {
    const characterData = require('../../../public/json/character_table.json');
    const uniequipData = require('../../../public/json/uniequip_table.json');
    const battleEquipData = require('../../../public/json/battle_equip_table.json');
    const names = [
      '猎蜂',
      '莱恩哈特',
      '莱伊',
      '夕',
      '妮芙',
      '令',
      '琳琅诗怀雅',
      '多萝西',
      '塞雷娅',
    ];

    for (const name of names) {
      const member = Object.values(characterData).find(item => item.name === name);
      const rawAttack = TalentsCalculatorModel.memberTalentRaw(
        '精二滿級', member, uniequipData, battleEquipData, 'atk'
      );
      const maxStacks = TalentsCalculatorModel.memberTalentRaw(
        '精二滿級', member, uniequipData, battleEquipData, 'max_stack_cnt'
      );
      const rule = TalentsCustomCalculatorModel.createTalentEffectRule({
        type: '精二滿級',
        memberRow: member,
        uniequipJsonData: uniequipData,
        battleEquipJsonData: battleEquipData,
        conditionEffectsEnabled: true,
      });

      expect(TalentsCalculatorModel.memberTalent(
        '精二滿級', member, uniequipData, battleEquipData, 'atk'
      )).toBe(0);
      expect(rule.effects.attack).toBeCloseTo(rawAttack * maxStacks);
    }
  });

  test('empty custom rules do not emit multiplier placeholders', () => {
    expect(TalentEffectRulesModel.resolve('卡达', {})).toEqual({});
    expect(TalentEffectRulesModel.resolve('骋风', {})).toEqual({});
  });

  test('inactive multiplicative effects are omitted', () => {
    const context = { memberTalent: () => 0 };

    expect(TalentEffectRulesModel.resolve('酸糖', context)).toEqual({});
    expect(TalentEffectRulesModel.resolve('云迹', context)).toEqual({});
  });
});
