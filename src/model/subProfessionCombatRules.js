const forcedSkillAttackTypes = {
  artsprotector: '法術',
  blessing: '治療',
};

const resolveSkillAttackType = ({
  subProfessionId,
  baseAttackType,
  skillAttackType,
  streamAttackType,
}) => {
  return forcedSkillAttackTypes[subProfessionId]
    ?? (streamAttackType || skillAttackType || baseAttackType);
};

export {
  resolveSkillAttackType,
};
