// LogHelper.js

import CookieModel from './Cookie';

/**
 * 記錄計算細節的通用工具函式。
 * @param {object} params - 包含所有日誌所需資訊的物件。
 * @param {string} params.logType - 日誌類型 (e.g., 'memberTalent', 'memberDph', 'memberDps').
 * @param {string} params.memberName - 幹員名稱.
 * @param {object} params.context - 包含計算所需背景資訊的物件.
 * @param {object} params.memberNumeric - 幹員最終數值.
 * @param {object} params.enemyData - 敵人數據.
 * @param {string} params.subProfessionName - 幹員分支名稱.
 * @param {number} params.finalValue - 最終計算結果.
 * @param {object} params.details - 包含所有中間計算步驟的詳細資訊.
 * @param {string} params.equipName - 模組名稱.
 * @param {string} params.skillName - 技能名稱.
 */
export const logCalculationDetails = ({
  logType,
  memberName,
  context,
  memberNumeric,
  enemyData,
  subProfessionName,
  finalValue,
  details,
  equipName,
  skillName
}) => {
  // 檢查是否需要記錄日誌
  if (memberName !== CookieModel.getCookie('memberName')) {
    return;
  }

  const logCheckKey = `${logType}_check`;
  if (CookieModel.getLog(logCheckKey).includes(context.equipid)) {
    return;
  }
  
  CookieModel.setLog(logType, true);
  CookieModel.getLog(logCheckKey).push(context.equipid);

  console.groupCollapsed(`${memberName}【${equipName}】「${skillName}」的 ${logType} 數據log`);
  
  if (logType === 'memberDph') {
    const skillLog = {};
    context.skillData?.blackboard?.forEach((b, i) => {
      skillLog[`${i + 1}. ${b.key}`] = b.value;
    });
    console.groupCollapsed('技能加成原始數據log');
    console.table(skillLog);
    console.groupEnd();

    console.table({
      '0.1. 幹員原始攻擊力': memberNumeric.atk,
      '0.2. 敵人原始防禦力': enemyData.enemyDef,
      '0.3. 敵人原始法抗': enemyData.enemyRes,
      '0.4. 傷害類型': details.attackType,
      '1.1. 攻擊乘算-技能倍率': details.attackMulti.skill,
      '1.2. 攻擊乘算-天賦倍率': details.attackMulti.talent,
      '1.3. 攻擊乘算-分支特性倍率': details.attackMulti.trait,
      '2.1. 攻擊倍率-技能倍率': details.attackScale.skill,
      '2.2. 攻擊倍率-天賦倍率': details.attackScale.talent,
      '2.3. 攻擊倍率-分支特性倍率': details.attackScale.trait,
      '3.1. 傷害倍率-技能倍率': details.damageMulti.skill,
      '3.2. 傷害倍率-天賦倍率': details.damageMulti.talent,
      '3.3. 傷害倍率-分支特性倍率': details.damageMulti.trait,
      '4.1. 削減敵方防禦-技能倍率': details.defDivide.skill,
      '4.2. 削減敵方防禦-天賦倍率': details.defDivide.talent,
      '5.1. 無視防禦-技能倍率': details.defSub.skill,
      '5.2. 無視防禦-分支特性倍率': details.defSub.trait,
      '6.1. 削減敵方法抗-技能倍率': details.resDivide.skill,
      '6.2. 削減敵方法抗-天賦倍率': details.resDivide.talent,
      '6.3. 削減敵方法抗-分支特性倍率': details.resDivide.trait,
      '7.1. 保底傷害倍率-天賦倍率': details.talentEnsureDamage,
      '8.1. 敵人最終防禦力': details.finalEnemyDef,
      '8.2. 敵人最終法抗': details.finalEnemyRes,
      '10. 最終DPH': finalValue,
    });
  } else if (logType === 'memberDps') {
    console.table({
      '0.1. 幹員原始攻擊間隔': details.baseAttackTime,
      '0.2. 幹員原始攻速': details.attackSpeed,
      '1.1. 攻擊間隔調整-技能倍率': details.attackTimeRevise,
      '1.2. 攻擊間隔調整-天賦倍率': details.talentAttackTimeRevise,
      '2.1. 攻速調整-技能倍率': details.attackSpeedRevise,
      '2.2. 攻速調整-天賦倍率': details.talentAttackSpeedRevise,
      '2.3. 攻速調整-分支特性倍率': details.traitAttackSpeedRevise,
      '3.1. 最終攻擊間隔': details.finalAttackTime,
      '3.2. 連擊數-技能倍率': details.attackCount,
      '3.3. 攻擊段數': details.times,
      '4.1. 技能額外傷害的傷害類型-技能倍率': details.otherAttackType,
      '4.2. 技能額外傷害的攻擊倍率-技能倍率': details.otherAttackScale,
      '4.3. 技能額外傷害的攻擊間隔-技能倍率': details.otherBaseAttackTime,
      '5.1. 主傷害DPH': details.dph,
      '5.2. 技能額外傷害DPH': details.otherSkillDph,
      '5.3. 分支特性額外傷害DPH': details.otherSubProfessionDph,
      '5.4. 主傷害DPS': details.dps,
      '5.5. 技能額外傷害DPS': details.otherSkillDps,
      '5.6. 分支特性額外傷害DPS': details.otherSubProfessionDps,
      '10. 最終DPS': finalValue,
    });
  } else if (logType === 'memberEquip' || logType === 'memberTalent') {
    console.table(details);
  }
  console.groupEnd();
};