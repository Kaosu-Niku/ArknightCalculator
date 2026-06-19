const skillMemberIndexCache = new WeakMap();

const normalizeRows = (data) => Array.isArray(data) ? data : Object.values(data ?? {});

const DataIndexModel = {
  skillMemberIndex: (characterData) => {
    if (!characterData) {
      return { bySkillId: new Map(), bySkillIdAndEquipId: new Map() };
    }

    const cached = skillMemberIndexCache.get(characterData);
    if (cached) {
      return cached;
    }

    const bySkillId = new Map();
    const bySkillIdAndEquipId = new Map();

    normalizeRows(characterData).forEach((member) => {
      member.skills?.forEach(({ skillId }) => {
        if (!bySkillId.has(skillId)) {
          bySkillId.set(skillId, member);
        }

        if (member.equipid) {
          bySkillIdAndEquipId.set(`${skillId}::${member.equipid}`, member);
        }
      });
    });

    const index = { bySkillId, bySkillIdAndEquipId };
    skillMemberIndexCache.set(characterData, index);
    return index;
  },
};

export default DataIndexModel;
