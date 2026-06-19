const uniequipDataCache = new WeakMap();

const firstValueMap = (blackboard = []) => {
  const values = new Map();
  for (const item of blackboard) {
    if (!values.has(item.key)) {
      values.set(item.key, item.value);
    }
  }
  return values;
};

const bundleBlackboard = (parts, bundleKey) => {
  const part = parts?.find(item => {
    const candidates = item[bundleKey]?.candidates;
    return candidates !== null && candidates !== undefined;
  });
  const candidates = part?.[bundleKey]?.candidates;
  return candidates?.[candidates.length - 1]?.blackboard;
};

const emptyIndex = (equipid) => ({
  equipid,
  battlePhase: undefined,
  traitBlackboard: new Map(),
  talentBlackboard: new Map(),
});

const UniequipDataIndexModel = {
  resolve: (
    memberData,
    uniequipJsonData,
    battleEquipJsonData,
    customEquipid = null
  ) => {
    const equipid = customEquipid ?? memberData?.equipid;
    const usesCustomEquip = Boolean(customEquipid);
    const cacheKey = `${usesCustomEquip ? 'custom' : 'member'}::${equipid ?? ''}`;
    const cachedByMember = uniequipDataCache.get(memberData);
    if (cachedByMember?.has(cacheKey)) {
      return cachedByMember.get(cacheKey);
    }

    const memberId = memberData.potentialItemId?.substring(2);
    const memberEquipIds = uniequipJsonData.charEquip[memberId];
    const canUseEquip = memberEquipIds
      && (usesCustomEquip || (equipid && memberEquipIds.includes(equipid)));
    const battleEquip = canUseEquip ? battleEquipJsonData[equipid] : undefined;
    const battlePhase = battleEquip?.phases?.[battleEquip.phases.length - 1];

    const index = battlePhase
      ? {
          equipid,
          battlePhase,
          traitBlackboard: firstValueMap(
            bundleBlackboard(battlePhase.parts, 'overrideTraitDataBundle')
          ),
          talentBlackboard: firstValueMap(
            bundleBlackboard(battlePhase.parts, 'addOrOverrideTalentDataBundle')
          ),
        }
      : emptyIndex(equipid);

    if (cachedByMember) {
      cachedByMember.set(cacheKey, index);
    }
    else {
      uniequipDataCache.set(memberData, new Map([[cacheKey, index]]));
    }

    return index;
  },
};

export default UniequipDataIndexModel;
