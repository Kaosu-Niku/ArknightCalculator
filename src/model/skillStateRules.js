const toggleStateSkillIds = new Set([
  'skchr_lolxh_1',
  'skchr_narant_1',
  'skchr_lin_1',
  'skchr_whitw2_1',
  'skchr_f12yin_2',
  'skchr_svrash_2',
  'skchr_hodrer_2',
]);

const initialStateAttributes = {
  skchr_hodrer_2: new Set(['atk']),
};

const expandSkillStateRows = (skillRow) => {
  if(!toggleStateSkillIds.has(skillRow.skillId)){
    return [skillRow];
  }

  return [
    { ...skillRow, skillState: 'initial' },
    { ...skillRow, skillState: 'active' },
  ];
};

const resolveSkillStateData = (skillRow, skillData) => {
  if(skillRow.skillState !== 'initial'){
    return skillData;
  }

  const retainedAttributes = initialStateAttributes[skillRow.skillId] ?? new Set();
  return {
    ...skillData,
    blackboard: (skillData.blackboard ?? []).filter(({ key }) => (
      retainedAttributes.has(key)
    )),
  };
};

export { expandSkillStateRows, resolveSkillStateData };
