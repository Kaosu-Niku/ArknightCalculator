const baseSubProfessionTraits = {
  atk: {
    '解放者': 2,
  },
  atk_scale: {
    '獵手': 1.2,
    '散射手': 1.5,
  },
  other2_attack_scale: {
    '御械術師': 1.1,
    '投擲手': 0.5,
  },
  other2_attack_type: {
    '御械術師': '法術',
    '投擲手': '物理',
  },
};

const staticModuleTraits = {
  atk: {
    '解放者': 2,
  },
  atk_scale: {
    '獵手': 1.2,
    '散射手': { key: 'atk_scale', fallback: 1.5 },
  },
  damage_scale: {
    '劍豪': { key: 'damage_scale', fallback: 1 },
  },
  def_penetrate_fixed: {
    '劍豪': { key: 'def_penetrate_fixed', fallback: 0 },
    '炮手': { key: 'def_penetrate_fixed', fallback: 0 },
  },
  magic_resist_penetrate_fixed: {
    '中堅術師': { key: 'magic_resist_penetrate_fixed', fallback: 0 },
  },
  attack_speed: {
    '要塞': { key: 'attack_speed', fallback: 0 },
  },
  other2_attack_scale: {
    '御械術師': { key: 'max_atk_scale', fallback: 1.1 },
    '投擲手': { key: 'attack@append_atk_scale', fallback: 0.5 },
    '領主': { key: 'atk_scale_m', fallback: 0 },
  },
  other2_attack_type: {
    '御械術師': '法術',
    '投擲手': '物理',
    '領主': '法術',
  },
  enable_third_attack: {
    '投擲手': { key: 'attack@enable_third_attack', fallback: 0 },
  },
};

const conditionalModuleTraits = {
  atk: {
    '尖兵': { key: 'atk', fallback: 0 },
    '吟遊者': { key: 'atk', fallback: 0 },
    '處決者': { key: 'atk', fallback: 0 },
    '行商': { compute: (blackboard) => (blackboard.value('atk') ?? 0) * (blackboard.value('max_stack_cnt') ?? 0) },
  },
  atk_scale: {
    '衝鋒手': { key: 'atk_scale', fallback: 1 },
    '戰術家': { key: 'atk_scale', fallback: 1 },
    '無畏者': { key: 'atk_scale', fallback: 1 },
    '強攻手': { key: 'atk_scale', fallback: 1 },
    '教官': { key: 'atk_scale', fallback: 1 },
    '速射手': { key: 'atk_scale', fallback: 1 },
    '攻城手': { key: 'atk_scale', fallback: 1 },
    '炮手': { key: 'atk_scale', fallback: 1 },
    '塑靈術師': { key: 'atk_scale', fallback: 1 },
    '撼地者': { key: 'atk_scale_e', fallback: 1 },
  },
  damage_scale: {
    '術戰者': { key: 'damage_scale', fallback: 1 },
    '神射手': { compute: (blackboard) => 1 + (blackboard.value('damage_scale') ?? 0) },
    '攻城手': { compute: (blackboard) => 1 + (blackboard.value('damage_scale') ?? 0) },
    '轟擊術師': { compute: (blackboard) => 1 + (blackboard.value('damage_scale') ?? 0) },
    '陣法術師': { compute: (blackboard) => 1 + (blackboard.value('damage_scale') ?? 0) },
  },
  attack_speed: {
    '無畏者': { key: 'attack_speed', fallback: 0 },
    '術戰者': { key: 'attack_speed', fallback: 0 },
    '鬥士': { key: 'attack_speed', fallback: 0 },
    '領主': { key: 'attack_speed', fallback: 0 },
    '速射手': { key: 'attack_speed', fallback: 0 },
    '秘術師': { key: 'attack_speed', fallback: 0 },
  },
};

const resolveTraitRule = (rule, blackboard) => {
  if(rule && typeof rule === 'object' && 'compute' in rule){
    return rule.compute(blackboard);
  }

  if(rule && typeof rule === 'object' && 'key' in rule){
    return blackboard.value(rule.key) ?? rule.fallback;
  }

  return rule;
};

const getStaticModuleTrait = (subProfession, attributeKey, blackboard) => {
  return resolveTraitRule(staticModuleTraits[attributeKey]?.[subProfession], blackboard);
};

const getConditionalModuleTrait = (subProfession, attributeKey, blackboard) => {
  return resolveTraitRule(conditionalModuleTraits[attributeKey]?.[subProfession], blackboard);
};

const hasConditionalModuleTrait = (subProfession) => {
  return Object.values(conditionalModuleTraits).some(traits => {
    return Object.prototype.hasOwnProperty.call(traits, subProfession);
  });
};

const getBaseSubProfessionTrait = (subProfession, attributeKey) => {
  return baseSubProfessionTraits[attributeKey]?.[subProfession];
};

const getExtraAttackHitMultiplier = (subProfession, enableThirdAttack) => {
  if(subProfession === '投擲手' && enableThirdAttack > 0){
    return 1 + enableThirdAttack;
  }

  return 1;
};

export {
  getBaseSubProfessionTrait,
  getConditionalModuleTrait,
  getExtraAttackHitMultiplier,
  hasConditionalModuleTrait,
  getStaticModuleTrait,
};
