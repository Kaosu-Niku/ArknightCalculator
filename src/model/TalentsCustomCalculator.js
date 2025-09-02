import TalentsCalculatorModel from './TalentsCalculator';
import UniequipCalculatorModel from './UniequipCalculator';

const TalentsCustomCalculatorModel = {
  talentNotListToBasic: {
    // 4星
    '红豆': new Set(['atk']),
    '清道夫': new Set(['atk', 'def']),
    '讯使': new Set(['def']),
    '猎蜂': new Set(['atk']),
    '杜宾': new Set(['atk']),
    '铅踝': new Set(['atk']),
    '远山': new Set(['max_hp', 'atk', 'attack_speed']),
    '泡泡': new Set(['atk']),
    '嘉维尔': new Set(['atk', 'def']),
    // 5星
    // 6星
  },

  talentListToAttackSkill: (calculationType, memberRow, uniequipJsonData, battleEquipJsonData) => {
    const getTalent = (attribute) => TalentsCalculatorModel.memberTalent(calculationType, memberRow, uniequipJsonData, battleEquipJsonData, attribute);

    const data = {
      'default': {
        attack: 0,
        atk_scale: 1,
        def_penetrate_fixed: 0,
        magic_resistance: 0,
        damage_scale: 1,
        base_attack_time: 0,
        attack_speed: 0,
        ensure_damage: 0.05,
      },
      // 4星
      '骋风': {},
      '宴': { attack_speed: getTalent('min_attack_speed') },
      '猎蜂': { attack: getTalent('atk') * getTalent('max_stack_cnt') },
      '酸糖': { ensure_damage: getTalent('atk_scale_2') },
      '夜烟': { magic_resistance: getTalent('magic_resistance') },
      '卡达': {},
      '云迹': { atk_scale: getTalent('atk_scale') },
    };

    return Object.keys(data).reduce((acc, key) => {
      acc[key] = { ...data.default, ...data[key] };
      return acc;
    }, {});
  },
};

export default TalentsCustomCalculatorModel;