import SkillCalculatorModel from './SkillCalculator';
import TalentsCalculatorModel from './TalentsCalculator';

const SkillCustomCalculatorModel = {
  skillNotListToBasic: {
    // 4星
    '石英-全力相搏': new Set(['damage_scale']),
    '猎蜂-急速拳': new Set(['base_attack_time']),
    '断罪者-断罪': new Set(['atk_scale']),
    '深靛-灯塔守卫者': new Set(['base_attack_time']),
    '深靛-光影迷宫': new Set(['base_attack_time']),
    '深海色-光影之触': new Set(['atk']),
    // 5星
    // 6星
  },

  skillListToAttackSkill: (calculationType, skillRow, memberRow, uniequipJsonData, battleEquipJsonData) => {
    const talentAtkScale = TalentsCalculatorModel.memberTalent(calculationType, memberRow, uniequipJsonData, battleEquipJsonData, 'atk_scale');
    const skillAtkScale = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'attack@atk_scale');
    const skillDuration = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'duration');
    const skillAtkScale2 = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'attack@s2_atk_scale');
    const skillMagicAtkScale = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'magic_atk_scale');
    const skillBaseAttackTime = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'base_attack_time');
    const indigoDamageScale = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'indigo_s_2[damage].atk_scale');
    const indigoInterval = SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'indigo_s_2[damage].interval');
    const chengfengOtherAtkScale = TalentsCalculatorModel.memberTalent(calculationType, memberRow, uniequipJsonData, battleEquipJsonData, 'atk_scale');

    return {
      // 4星
      '骋风-以攻为守': {
        'CHANGE_OTHER_attackType': '物理',
        'OTHER_atk_scale': chengfengOtherAtkScale,
      },
      '骋风-招无虚发': {
        'atk_scale': skillAtkScale,
        'CHANGE_OTHER_attackType': '物理',
        'OTHER_atk_scale': chengfengOtherAtkScale,
      },
      '休谟斯-高效处理': { 'atk': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'humus_s_2[peak_2].peak_performance.atk') },
      '石英-全力相搏': { 'atk_scale': skillAtkScale2 },
      '芳汀-小玩笑': {
        'atk_scale': skillAtkScale,
        'ATTACK_COUNT': 2,
      },
      '芳汀-致命恶作剧': {
        'atk_scale': skillAtkScale,
        'CHANGE_attackType': '法術',
      },
      '宴-落地斩·破门': {
        'CHANGE_attackType': '法術',
        'CHANGE_duration': skillDuration,
      },
      '猎蜂-急速拳': { 'base_attack_time': 0.78 * skillBaseAttackTime },
      '杰克-全神贯注！': { 'CHANGE_attackType': '不攻擊' },
      '断罪者-断罪': { 'atk_scale': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'atk_scale_fake') },
      '断罪者-创世纪': {
        'CHANGE_attackType': '法術',
        'atk_scale': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'success.atk_scale'),
      },
      '跃跃-乐趣加倍': { 'ATTACK_COUNT': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'cnt') },
      '铅踝-破虹': { 'atk_scale': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'attack@s2c.atk_scale') },
      '酸糖-扳机时刻': { 'ATTACK_COUNT': 2 },
      '松果-电能过载': { 'atk': SkillCalculatorModel.skillAttribute(calculationType, skillRow, 'pinecn_s_2[d].atk') },
      '白雪-凝武': {
        'CHANGE_OTHER_attackType': '法術',
        'OTHER_atk_scale': skillAtkScale,
        'OTHER_base_attack_time': 1,
      },
      '深靛-灯塔守卫者': {
        'atk_scale': skillAtkScale,
        'base_attack_time': 3 * skillBaseAttackTime,
      },
      '深靛-光影迷宫': {
        'base_attack_time': 3 * (-1 + skillBaseAttackTime),
        'CHANGE_OTHER_attackType': '法術',
        'OTHER_atk_scale': indigoDamageScale,
        'OTHER_base_attack_time': indigoInterval,
      },
      '波登可-花香疗法': { 'CHANGE_attackType': '治療' },
      '波登可-孢子扩散': { 'base_attack_time': -0.9 },
      '地灵-流沙化': { 'CHANGE_attackType': '不攻擊' },
      '罗比菈塔-全自动造型仪': { 'CHANGE_attackType': '不攻擊' },
      '古米-食粮烹制': { 'CHANGE_attackType': '治療' },
      '蛇屠箱-壳状防御': { 'CHANGE_attackType': '不攻擊' },
      '泡泡-“挨打”': { 'CHANGE_attackType': '不攻擊' },
      '露托-强磁防卫': {
        'CHANGE_attackType': '法術',
        'atk_scale': skillMagicAtkScale,
        'base_attack_time': 0.4,
      },
      '孑-断螯': { 'CHANGE_duration': 2 },
      '孑-刺身拼盘': { 'CHANGE_duration': 2 },
      // 5星
      // 6星
    };
  },
};

export default SkillCustomCalculatorModel;