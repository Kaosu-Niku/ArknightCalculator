const splitReduction = (value) => {
  if (!(value < 0)) {
    return { ratio: 0, fixed: 0 };
  }

  if (value > -1) {
    return { ratio: value, fixed: 0 };
  }

  return { ratio: 0, fixed: value };
};

const resolveEnemyDefense = ({
  enemyDefense,
  skillReduction,
  talentReduction,
  skillPenetration,
  traitPenetration,
}) => {
  const skill = splitReduction(skillReduction);
  const talent = splitReduction(talentReduction);
  const defense = enemyDefense * (1 + skill.ratio + talent.ratio)
    + skill.fixed
    + talent.fixed
    - skillPenetration
    - traitPenetration;

  return Math.max(0, defense);
};

const resolveEnemyResistance = ({
  enemyResistance,
  skillReduction,
  talentReduction,
  traitAdjustment,
}) => {
  const skill = splitReduction(skillReduction);
  const talent = splitReduction(talentReduction);
  const resistance = enemyResistance * (1 + skill.ratio + talent.ratio)
    + skill.fixed
    + talent.fixed
    + traitAdjustment;

  return Math.min(100, Math.max(0, resistance));
};

const resolveAttackPower = ({
  baseAttack,
  attackMultiplierFactor,
  attackScale,
  extraAttackScale = null,
}) => {
  const scale = extraAttackScale === null
    ? attackScale
    : attackScale * extraAttackScale;
  return baseAttack * attackMultiplierFactor * scale;
};

const resolvePhysicalDamage = (attackPower, enemyDefense) => {
  return attackPower - enemyDefense;
};

const resolveArtsDamage = (attackPower, enemyResistance) => {
  return attackPower * ((100 - enemyResistance) / 100);
};

const resolveDamageByType = ({
  attackType,
  attackPower,
  enemyDefense,
  enemyResistance,
}) => {
  if (attackType === '物理') {
    return resolvePhysicalDamage(attackPower, enemyDefense);
  }

  if (attackType === '法術') {
    return resolveArtsDamage(attackPower, enemyResistance);
  }

  if (attackType === '真實') {
    return attackPower;
  }

  return 0;
};

const resolveAttackDamage = ({
  attackType,
  baseAttack,
  attackMultiplierFactor,
  attackScale,
  extraAttackScale,
  minimumDamageScale,
  enemyDefense,
  enemyResistance,
  damageMultiplier,
}) => {
  const scaledAttackPower = resolveAttackPower({
    baseAttack,
    attackMultiplierFactor,
    attackScale,
    extraAttackScale,
  });
  // 部分 custom 規則以 >= 10 的值表示固定額外傷害，而非倍率。
  const attackPower = extraAttackScale !== null && extraAttackScale >= 10
    ? extraAttackScale
    : scaledAttackPower;
  const rawDamage = resolveDamageByType({
    attackType,
    attackPower,
    enemyDefense,
    enemyResistance,
  });
  const minimumDamage = scaledAttackPower * minimumDamageScale;
  const ensuredDamage = rawDamage < minimumDamage ? minimumDamage : rawDamage;
  const damage = attackType === '治療' || attackType === '不攻擊'
    ? 0
    : ensuredDamage;

  return damage * damageMultiplier;
};

export {
  splitReduction,
  resolveAttackPower,
  resolvePhysicalDamage,
  resolveArtsDamage,
  resolveDamageByType,
  resolveAttackDamage,
  resolveEnemyDefense,
  resolveEnemyResistance,
};
