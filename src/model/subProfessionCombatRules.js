const forcedSkillAttackTypes = {
  artsprotector: '法術',
  blessing: '治療',
};

const resolveSkillAttackType = ({
  subProfessionId,
  baseAttackType,
  skillAttackType,
  streamAttackType,
  allowForcedOverride = false,
}) => {
  const forcedType = forcedSkillAttackTypes[subProfessionId];
  if (forcedType && !allowForcedOverride) {
    return forcedType;
  }

  return streamAttackType || skillAttackType || forcedType || baseAttackType;
};

export {
  resolveSkillAttackType,
};
