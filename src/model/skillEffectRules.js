import TalentsCalculatorModel from './TalentsCalculator';

const memberTalent = ({
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData,
}, attribute) => {
  return TalentsCalculatorModel.memberTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  );
};

const skillEffectRuleFactories = {
  '月见夜-武器附魔·α型': () => ({
    CHANGE_attackType: '法術',
  }),
  '骋风-以攻为守': (context) => ({
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: memberTalent(context, 'atk_scale'),
  }),
  '骋风-招无虚发': (context) => ({
    atk_scale: context.skillAttribute('attack@atk_scale'),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: memberTalent(context, 'atk_scale'),
  }),
  '休谟斯-高效处理': ({ skillAttribute }) => ({
    atk: skillAttribute('humus_s_2[peak_2].peak_performance.atk'),
  }),
  '石英-全力相搏': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@s2_atk_scale'),
  }),
  '芳汀-小玩笑': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 2,
  }),
  '芳汀-致命恶作剧': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    CHANGE_attackType: '法術',
  }),
  '宴-落地斩·破门': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    CHANGE_duration: skillAttribute('duration'),
  }),
  '猎蜂-急速拳': ({ skillAttribute }) => ({
    base_attack_time: 0.78 * skillAttribute('base_attack_time'),
  }),
  '杰克-全神贯注！': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '断罪者-断罪': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale_fake'),
  }),
  '断罪者-创世纪': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('success.atk_scale'),
  }),
  '跃跃-乐趣加倍': ({ skillAttribute }) => ({
    ATTACK_COUNT: skillAttribute('cnt'),
  }),
  '铅踝-破虹': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@s2c.atk_scale'),
  }),
  '酸糖-扳机时刻': () => ({
    ATTACK_COUNT: 2,
  }),
  '松果-电能过载': ({ skillAttribute }) => ({
    atk: skillAttribute('pinecn_s_2[d].atk'),
  }),
  '白雪-凝武': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '深靛-灯塔守卫者': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    base_attack_time: 3 * skillAttribute('base_attack_time'),
  }),
  '深靛-光影迷宫': ({ skillAttribute }) => ({
    base_attack_time: 3 * (-1 + skillAttribute('base_attack_time')),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('indigo_s_2[damage].atk_scale'),
    OTHER_base_attack_time: skillAttribute('indigo_s_2[damage].interval'),
  }),
  '波登可-花香疗法': () => ({
    CHANGE_attackType: '治療',
  }),
  '波登可-孢子扩散': () => ({
    base_attack_time: -0.9,
  }),
  '地灵-流沙化': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '罗比菈塔-全自动造型仪': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '古米-食粮烹制': () => ({
    CHANGE_attackType: '治療',
  }),
  '蛇屠箱-壳状防御': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '泡泡-“挨打”': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '露托-强磁防卫': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('magic_atk_scale'),
    base_attack_time: 0.4,
  }),
  '孑-断螯': () => ({
    CHANGE_duration: 2,
  }),
  '孑-刺身拼盘': () => ({
    CHANGE_duration: 2,
  }),
};

const emptyEffects = Object.freeze({});

const SkillEffectRulesModel = {
  resolve: (checkName, context) => {
    const createEffects = skillEffectRuleFactories[checkName];
    return createEffects?.(context) ?? emptyEffects;
  },
};

export default SkillEffectRulesModel;
