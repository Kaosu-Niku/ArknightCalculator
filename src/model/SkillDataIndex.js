const skillBlackboardCache = new WeakMap();

const SkillDataIndexModel = {
  blackboard: (skillData) => {
    if (skillBlackboardCache.has(skillData)) {
      return skillBlackboardCache.get(skillData);
    }

    const blackboard = new Map();
    for (const entry of skillData.blackboard ?? []) {
      if (!blackboard.has(entry.key)) {
        blackboard.set(entry.key, entry);
      }
    }

    skillBlackboardCache.set(skillData, blackboard);
    return blackboard;
  },
};

export default SkillDataIndexModel;
