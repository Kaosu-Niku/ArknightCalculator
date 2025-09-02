import BasicCalculatorModel from '../model/BasicCalculator';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import UniequipCalculatorModel from './UniequipCalculator';
import { logCalculationDetails } from './LogHelper';
import CookieModel from './Cookie';

const TalentsCalculatorModel = {
  // Queries for the operator's corresponding talent based on the specified key name, and returns the bonus value of this talent (returns 0 by default if not found)
  memberTalent: (calculationType, memberRow, uniequipJsonData, battleEquipJsonData, attribute) => {
    const { witchPhases, witchAttributesKeyFrames } = BasicCalculatorModel.type(calculationType);
    let totalValue = 0;
    let logObject = {};
    let logCount = 1;

    const memberRarity = BasicCalculatorModel.memberRarity(memberRow);

    memberRow.talents?.forEach(talent => {
      for (let i = talent.candidates.length - 1; i >= 0; i--) {
        const candidate = talent.candidates[i];
        const phaseNum = parseInt(candidate.unlockCondition.phase.replace('PHASE_', ''), 10);
        const levelRequired = candidate.unlockCondition.level;

        const isPhaseMatch = phaseNum === witchPhases || (memberRarity < 4 && witchPhases === 2);
        const isLevelMatch = memberRarity >= 4 || (levelRequired === 1 ? witchAttributesKeyFrames === 1 : witchAttributesKeyFrames === 0);

        if (isPhaseMatch && isLevelMatch) {
          logObject[`${logCount}.`] = candidate.name;
          candidate.blackboard.forEach(board => {
            logObject[`${logCount}. ${board.key}`] = board.value;
            const unieqVal = UniequipCalculatorModel.memberEquipTalent(memberRow.equipid, memberRow, uniequipJsonData, battleEquipJsonData, witchPhases, board.key);
            if (unieqVal !== undefined) {
              logObject[`${logCount}. ${board.key}`] = unieqVal;
            }
          });
          logCount++;

          candidate.blackboard.forEach(board => {
            if (board.key === attribute) {
              const customFilter = TalentsCustomCalculatorModel.talentNotListToBasic[memberRow.name]?.has(attribute);
              if (!customFilter) {
                totalValue += (board.value ?? 0);
              }
            }
          });
          break;
        }
      }
    });

    if (witchPhases === 2) {
      const unieqVal = UniequipCalculatorModel.memberEquipTalent(memberRow.equipid, memberRow, uniequipJsonData, battleEquipJsonData, witchPhases, attribute);
      if (unieqVal !== undefined) {
        const customFilter = TalentsCustomCalculatorModel.talentNotListToBasic[memberRow.name]?.has(attribute);
        totalValue = customFilter ? 0 : unieqVal;
      }
    }

    //logCalculationDetails('memberTalent', memberRow.name, memberRow, null, null, null, totalValue, logObject);

    return totalValue;
  },
};

export default TalentsCalculatorModel;