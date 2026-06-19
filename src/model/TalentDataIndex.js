import ProgressionResolverModel from './ProgressionResolver';

const talentDataCache = new WeakMap();

const candidateMatches = (
  candidate,
  memberRarity,
  witchPhases,
  witchAttributesKeyFrames
) => {
  const phaseNum = parseInt(
    candidate.unlockCondition.phase.replace('PHASE_', ''),
    10
  );
  const phaseMatches = phaseNum === witchPhases
    || (memberRarity < 4 && witchPhases === 2);

  if (!phaseMatches) {
    return false;
  }

  const requiresUnlockedLevel = candidate.unlockCondition.level > 1;
  return !(
    memberRarity < 4
    && witchPhases !== 2
    && requiresUnlockedLevel
    && witchAttributesKeyFrames === 0
  );
};

const addBlackboardValues = (values, blackboard) => {
  for (const item of blackboard) {
    values.set(item.key, (values.get(item.key) ?? 0) + (item.value ?? 0));
  }
};

const TalentDataIndexModel = {
  resolve: (type, memberRow) => {
    const cachedByMember = talentDataCache.get(memberRow);
    if (cachedByMember?.has(type)) {
      return cachedByMember.get(type);
    }

    const progression = ProgressionResolverModel.type(type);
    const memberRarity = ProgressionResolverModel.memberRarity(memberRow);
    const values = new Map();
    const activeCandidates = [];

    for (const talent of memberRow.talents ?? []) {
      for (let index = talent.candidates.length - 1; index >= 0; index--) {
        const candidate = talent.candidates[index];
        if (!candidateMatches(
          candidate,
          memberRarity,
          progression.witchPhases,
          progression.witchAttributesKeyFrames
        )) {
          continue;
        }

        activeCandidates.push(candidate);
        addBlackboardValues(values, candidate.blackboard);
        break;
      }
    }

    const talentData = {
      ...progression,
      activeCandidates,
      values,
    };

    if (cachedByMember) {
      cachedByMember.set(type, talentData);
    }
    else {
      talentDataCache.set(memberRow, new Map([[type, talentData]]));
    }

    return talentData;
  },
};

export default TalentDataIndexModel;
