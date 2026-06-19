const skillMemberIndexCache = new WeakMap();

const normalizeRows = (data) => Array.isArray(data) ? data : Object.values(data ?? {});

const DataIndexModel = {
  skillMemberIndex: (characterData) => {
    if (!characterData) {
      return {
        byMemberId: new Map(),
        byMemberIdAndEquipId: new Map(),
        bySkillId: new Map(),
        bySkillIdAndEquipId: new Map(),
      };
    }

    const cached = skillMemberIndexCache.get(characterData);
    if (cached) {
      return cached;
    }

    const byMemberId = new Map();
    const byMemberIdAndEquipId = new Map();
    const bySkillId = new Map();
    const bySkillIdAndEquipId = new Map();

    normalizeRows(characterData).forEach((member) => {
      const memberId = member.potentialItemId;
      if (memberId && !member.equipid && !byMemberId.has(memberId)) {
        byMemberId.set(memberId, member);
      }
      if (memberId && member.equipid) {
        byMemberIdAndEquipId.set(`${memberId}::${member.equipid}`, member);
      }

      member.skills?.forEach(({ skillId }) => {
        if (!bySkillId.has(skillId)) {
          bySkillId.set(skillId, member);
        }

        if (member.equipid) {
          bySkillIdAndEquipId.set(`${skillId}::${member.equipid}`, member);
        }
      });
    });

    const index = {
      byMemberId,
      byMemberIdAndEquipId,
      bySkillId,
      bySkillIdAndEquipId,
    };
    skillMemberIndexCache.set(characterData, index);
    return index;
  },
};

export default DataIndexModel;
