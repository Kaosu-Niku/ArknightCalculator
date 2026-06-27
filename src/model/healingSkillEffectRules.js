const healingSkillEffectRuleFactories = {
  '斑点-次级治疗模式': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_add: 1.3,
  }),
  '桃金娘-治愈之翼': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('attack@heal_scale'),
    HEAL_interval: 1,
  }),
  '孑-刺身拼盘': ({ skillAttribute }) => ({
    HEAL_damage_scale: skillAttribute('scale'),
  }),
  '宴-分神': ({ skillAttribute }) => ({
    HEAL_max_hp_ratio: skillAttribute('hp_recovery_per_sec_by_max_hp_ratio'),
    HEAL_interval: 1,
  }),
  '蛇屠箱-壳状防御': ({ skillAttribute }) => ({
    HEAL_max_hp_ratio: skillAttribute('hp_recovery_per_sec_by_max_hp_ratio'),
    HEAL_interval: 1,
  }),
  '古米-备用军粮': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '古米-食粮烹制': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_scale: 1.3,
  }),
  '波登可-花香疗法': () => ({
    HEAL_heal_scale: 1,
  }),
  '万顷-应东风': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('attack@heal_scale'),
    HEAL_interval: 1,
  }),
  '医生-激素手枪': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: skillAttribute('skill_max_trigger_time') || 1,
  }),
  '临光-急救': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '临光-急救模式': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_scale: 1.3,
  }),
  '吽-反制治疗': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '吽-反制医疗模式': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_add: 1.3,
  }),
  '深律-急救': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '深律-沉音宁神': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_add: 1.3,
  }),
  '流明-沐雨': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('aura.heal_scale'),
    HEAL_interval: skillAttribute('aura.interval'),
    HEAL_duration: skillAttribute('aura.projectile_life_time'),
  }),
  '流明-沛霖': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '流明-灯火不灭': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
  }),
  '暴雨-应急迷彩': ({ skillAttribute, skillDuration }) => ({
    HEAL_flat: skillAttribute('hp_recovery_per_sec'),
    HEAL_interval: 1,
    HEAL_duration: skillDuration(),
  }),
  '森西-单人份料理': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '玛露西尔-才女的实力': () => ({
    HEAL_heal_scale: 1,
  }),
  '铃兰-狐火渺然': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('attack@atk_to_hp_recovery_ratio'),
    HEAL_interval: 1,
  }),
  '纯烬艾雅法拉-云霭荫佑': () => ({
    HEAL_times: 1,
  }),
  '纯烬艾雅法拉-火山回响': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('attack@heal_scale'),
    HEAL_times: 5,
  }),
  '塞雷娅-急救': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '塞雷娅-药物配置': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '塞雷娅-钙质化': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('attack@heal_scale'),
    HEAL_interval: 1,
  }),
  '瑕光-光芒涌动': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '瑕光-先贤化身': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
  }),
  '琴柳-信仰传承': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('atk_to_hp_recovery_ratio'),
    HEAL_interval: 1,
  }),
  '黍-化被草木': ({ skillAttribute }) => ({
    HEAL_heal_scale: skillAttribute('heal_scale'),
    HEAL_times: 1,
  }),
  '黍-嘉禾盈仓': () => ({
    HEAL_heal_scale: 1,
    HEAL_interval_add: 1.3,
  }),
  '黍-离离枯荣': () => ({
    HEAL_heal_scale: 1,
  }),
  '夜魔-灵魂汲取': ({ skillAttribute }) => ({
    HEAL_damage_scale: skillAttribute('attack@heal_scale'),
  }),
};

const pureHealingSkillRules = new Set([
  '斑点-次级治疗模式',
  '桃金娘-治愈之翼',
  '宴-分神',
  '蛇屠箱-壳状防御',
  '古米-备用军粮',
  '古米-食粮烹制',
  '波登可-花香疗法',
  '万顷-应东风',
  '医生-激素手枪',
  '临光-急救',
  '临光-急救模式',
  '吽-反制治疗',
  '吽-反制医疗模式',
  '深律-急救',
  '深律-沉音宁神',
  '暴雨-应急迷彩',
  '森西-单人份料理',
  '铃兰-狐火渺然',
  '塞雷娅-急救',
  '塞雷娅-药物配置',
  '塞雷娅-钙质化',
  '琴柳-信仰传承',
  '黍-化被草木',
  '黍-嘉禾盈仓',
]);

const HealingSkillEffectRulesModel = {
  hasRule: (checkName) => Object.prototype.hasOwnProperty.call(
    healingSkillEffectRuleFactories,
    checkName
  ),

  isPureHealingRule: (checkName) => pureHealingSkillRules.has(checkName),

  resolve: (checkName, context) => {
    const factory = healingSkillEffectRuleFactories[checkName];
    return factory ? factory(context) : {};
  },

  createRule: (checkName, context) => ({
    effects: HealingSkillEffectRulesModel.resolve(checkName, context),
    ignoredAttributes: new Set(),
  }),
};

export {
  healingSkillEffectRuleFactories,
};

export default HealingSkillEffectRulesModel;
