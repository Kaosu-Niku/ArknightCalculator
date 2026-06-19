const progressionByType = {
  '精零1級': { witchPhases: 0, witchAttributesKeyFrames: 0 },
  '精零滿級': { witchPhases: 0, witchAttributesKeyFrames: 1 },
  '精一1級': { witchPhases: 1, witchAttributesKeyFrames: 0 },
  '精一滿級': { witchPhases: 1, witchAttributesKeyFrames: 1 },
  '精二1級': { witchPhases: 2, witchAttributesKeyFrames: 0 },
  '精二滿級': { witchPhases: 2, witchAttributesKeyFrames: 1 },
};

const rarityByTier = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
  TIER_4: 4,
  TIER_5: 5,
  TIER_6: 6,
};

const defaultProgression = {
  witchPhases: 0,
  witchAttributesKeyFrames: 0,
};

const ProgressionResolverModel = {
  type: (type) => ({ ...(progressionByType[type] ?? defaultProgression) }),

  memberRarity: (memberRow) => rarityByTier[memberRow.rarity],
};

export default ProgressionResolverModel;
