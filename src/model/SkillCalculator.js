import BasicCalculatorModel from '../model/BasicCalculator';
import SkillCustomCalculatorModel from './SkillCustomCalculator';
import UniequipCalculatorModel from './UniequipCalculator';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import { logCalculationDetails } from './LogHelper';
import CookieModel from './Cookie';

const DPH_OTHER_DAMAGE_THRESHOLD = 10;
const DPH_ENSURE_DAMAGE_MULTIPLIER = 0.05;

const SkillCalculatorModel = {
  // Queries for the operator data a skill belongs to (returns an object, see character_table.json for details)
  skillFromMember: (skillRow, characterJsonData) => {
    const { skillId, equipid } = skillRow;
    for (const key in characterJsonData) {
      if (Object.prototype.hasOwnProperty.call(characterJsonData, key)) {
        const currentCharacter = characterJsonData[key];
        const hasSkill = currentCharacter.skills.some((item) => item.skillId === skillId);
        if (equipid) {
          if (hasSkill && currentCharacter.equipid === equipid) {
            return currentCharacter;
          }
        } else {
          if (hasSkill) {
            return currentCharacter;
          }
        }
      }
    }
    return null;
  },

  // Queries for the highest level skill data corresponding to the currently selected play style (returns an object, see skill_table.json for details)
  skillData: (calculationType, skillRow) => {
    const { witchPhases } = BasicCalculatorModel.type(calculationType);
    const maxLevel = skillRow.levels.length;
    const isHighRarity = maxLevel > 7;

    if (isHighRarity) {
      switch (witchPhases) {
        case 0: return skillRow.levels[maxLevel - 7];
        case 1: return skillRow.levels[maxLevel - 4];
        case 2: return skillRow.levels[maxLevel - 1];
        default: return skillRow.levels[maxLevel - 1];
      }
    } else {
      switch (witchPhases) {
        case 0: return skillRow.levels[maxLevel - 4];
        case 1:
        case 2: return skillRow.levels[maxLevel - 1];
        default: return skillRow.levels[maxLevel - 1];
      }
    }
  },

  // Queries for the skill attribute value of the corresponding key name (returns the value or 0 if not found)
  skillAttribute: (calculationType, skillRow, attribute) => {
    const skillData = SkillCalculatorModel.skillData(calculationType, skillRow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  // Skill attribute query including a custom skill data query and a reasonableness check
  skillCustomAttribute: (calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, attribute) => {
    const skillData = SkillCalculatorModel.skillData(calculationType, skillRow);
    const checkName = `${memberData.name}-${skillData.name}`;

    const customValue = SkillCustomCalculatorModel.skillListToAttackSkill(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData)[checkName]?.[attribute];
    if (customValue !== undefined) {
      return customValue;
    }

    const originalValue = skillData.blackboard?.find(entry => entry.key === attribute)?.value;
    const isFiltered = SkillCustomCalculatorModel.skillNotListToBasic[checkName]?.has(attribute);

    if (isFiltered) {
      return 0;
    }

    return originalValue ?? 0;
  },

  // Calculates the DPH (Damage Per Hit) of the operator during the skill duration
  skillMemberDph: (calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false, other_atk_scale_check = null, other_attackType_check = null) => {
    const { witchPhases } = BasicCalculatorModel.type(calculationType);
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const subProfessionName = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).chineseName;
    const memberNumeric = BasicCalculatorModel.memberNumeric(calculationType, memberData, uniequipJsonData, battleEquipJsonData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(calculationType, memberData, uniequipJsonData, battleEquipJsonData)[memberData.name];

    let attackType = other_attackType_check || BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;
    if (['驭法铁卫', '护佑者'].includes(subProfessionName)) {
      attackType = subProfessionName === '驭法铁卫' ? '法术' : '治疗';
    }
    const changeAttackType = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'CHANGE_attackType');
    if (changeAttackType) {
      attackType = changeAttackType;
    }

    // Damage Modifiers
    const skillAttackMulti = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'atk');
    const talentAttackMulti = memberTalent?.attack || 0;
    const traitAttackMulti = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'atk') ?? 0;
    const totalAttackMulti = 1 + skillAttackMulti + talentAttackMulti + traitAttackMulti;

    const skillAttackScale = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'atk_scale');
    const talentAttackScale = memberTalent?.atk_scale || 1;
    const traitAttackScale = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'atk_scale') ?? 1;
    const totalAttackScale = (skillAttackScale > 0 ? skillAttackScale : 1) * talentAttackScale * traitAttackScale;

    const skillDamageMulti = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'damage_scale');
    const talentDamageMulti = memberTalent?.damage_scale || 1;
    const traitDamageMulti = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'damage_scale') ?? 1;
    const totalDamageMulti = (skillDamageMulti > 0 ? skillDamageMulti : 1) * talentDamageMulti * traitDamageMulti;

    // Enemy Stat Reduction
    const defDivide = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'def');
    const talentDefDivide = memberTalent?.def_penetrate_fixed || 0;
    const defDivideA = defDivide < 0 && defDivide > -1 ? defDivide : 0;
    const defDivideB = defDivide <= -1 ? defDivide : 0;
    const talentDefDivideA = talentDefDivide < 0 && talentDefDivide > -1 ? talentDefDivide : 0;
    const talentDefDivideB = talentDefDivide <= -1 ? talentDefDivide : 0;

    const defSub = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'def_penetrate_fixed');
    const traitDefSub = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'def_penetrate_fixed') ?? 0;
    let finalEnemyDef = Math.max(0, enemyData.enemyDef * (1 + defDivideA + talentDefDivideA) + defDivideB + talentDefDivideB - defSub - traitDefSub);

    const resDivide = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'magic_resistance');
    const talentResDivide = memberTalent?.magic_resistance || 0;
    const traitResDivide = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'magic_resist_penetrate_fixed') ?? 0;
    const resDivideA = resDivide < 0 && resDivide > -1 ? resDivide : 0;
    const resDivideB = resDivide <= -1 ? resDivide : 0;
    const talentResDivideA = talentResDivide < 0 && talentResDivide > -1 ? talentResDivide : 0;
    const talentResDivideB = talentResDivide <= -1 ? talentResDivide : 0;
    let finalEnemyRes = enemyData.enemyRes * (1 + resDivideA + talentResDivideA) + resDivideB + talentResDivideB + traitResDivide;
    finalEnemyRes = Math.min(100, Math.max(0, finalEnemyRes));

    let finalAttack = 0;
    let baseDamage = memberNumeric.atk * totalAttackMulti * totalAttackScale;
    if (other_atk_scale_check !== null) {
      baseDamage = other_atk_scale_check < DPH_OTHER_DAMAGE_THRESHOLD ? baseDamage * other_atk_scale_check : other_atk_scale_check;
    }

    switch (attackType) {
      case '物理':
        finalAttack = baseDamage - finalEnemyDef;
        break;
      case '法术':
        finalAttack = baseDamage * ((100 - finalEnemyRes) / 100);
        break;
      case '治疗':
      case '不攻击':
      default:
        finalAttack = 0;
    }

    const talentEnsureDamage = memberTalent?.ensure_damage || DPH_ENSURE_DAMAGE_MULTIPLIER;
    const ensureDamage = memberNumeric.atk * totalAttackMulti * totalAttackScale * talentEnsureDamage;
    finalAttack = Math.max(finalAttack, ensureDamage);
    
    // logCalculationDetails('memberDph', memberData.name, skillRow, memberNumeric, enemyData, subProfessionName, finalAttack, {
    //   attackMulti: { skill: skillAttackMulti, talent: talentAttackMulti, trait: traitAttackMulti },
    //   attackScale: { skill: skillAttackScale, talent: talentAttackScale, trait: traitAttackScale },
    //   damageMulti: { skill: skillDamageMulti, talent: talentDamageMulti, trait: traitDamageMulti },
    //   defDivide: { skill: defDivide, talent: talentDefDivide },
    //   defSub: { skill: defSub, trait: traitDefSub },
    //   resDivide: { skill: resDivide, talent: talentResDivide, trait: traitResDivide },
    //   talentEnsureDamage,
    //   finalEnemyDef,
    //   finalEnemyRes,
    //   attackType,
    //   other_atk_scale_check,
    //   other_attackType_check,
    // });

    return finalAttack * totalDamageMulti;
  },

  // Calculates the DPS (Damage Per Second) of the operator during the skill duration
  skillMemberDps: (calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    const { witchPhases } = BasicCalculatorModel.type(calculationType);
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const subProfessionName = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).chineseName;
    const memberNumeric = BasicCalculatorModel.memberNumeric(calculationType, memberData, uniequipJsonData, battleEquipJsonData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(calculationType, memberData, uniequipJsonData, battleEquipJsonData)[memberData.name];

    const dph = SkillCalculatorModel.skillMemberDph(calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
    
    // Attack Interval & Speed
    const attackTimeRevise = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'base_attack_time');
    const talentAttackTimeRevise = memberTalent?.base_attack_time || 0;
    const attackSpeedRevise = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'attack_speed');
    const talentAttackSpeedRevise = memberTalent?.attack_speed || 0;
    const traitAttackSpeedRevise = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'attack_speed') ?? 0;
    const finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise + talentAttackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise + talentAttackSpeedRevise + traitAttackSpeedRevise) / 100);

    const attackCount = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'ATTACK_COUNT') || 1;

    // Extra Damage from Skill
    const otherAttackScale = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'OTHER_atk_scale');
    const otherAttackType = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'CHANGE_OTHER_attackType');
    const otherBaseAttackTime = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'OTHER_base_attack_time');

    let otherSkillDph = 0;
    if (otherAttackScale) {
      otherSkillDph = SkillCalculatorModel.skillMemberDph(calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, otherAttackScale, otherAttackType);
    }
    const otherSkillDps = otherBaseAttackTime ? (otherSkillDph * attackCount) / otherBaseAttackTime : (otherSkillDph * attackCount) / finalAttackTime;

    // Extra Damage from Sub-Profession Trait
    const other2AttackScale = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'other2_attack_scale') ?? 0;
    const other2AttackType = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'other2_attack_type') ?? 0;
    
    let otherSubProfessionDph = 0;
    if (other2AttackScale) {
      otherSubProfessionDph = SkillCalculatorModel.skillMemberDph(calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, other2AttackScale, other2AttackType);
      if (subProfessionName === '投擲手') {
        const enableThirdAttack = UniequipCalculatorModel.memberEquipTrait(skillRow.equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfessionName, 'enable_third_attack') ?? 0;
        if (enableThirdAttack > 0) {
          otherSubProfessionDph *= (1 + enableThirdAttack);
        }
      }
    }
    const otherSubProfessionDps = (otherSubProfessionDph * attackCount) / finalAttackTime;
    
    let dps = (dph * attackCount) / finalAttackTime;
    const times = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'times');
    
    if (times > 0) {
      dps = dph * attackCount * times;
    }
    
    // logCalculationDetails('memberDps', memberData.name, skillRow, memberNumeric, enemyData, subProfessionName, (dps + otherSkillDps + otherSubProfessionDps), {
    //   baseAttackTime: memberNumeric.baseAttackTime,
    //   attackSpeed: memberNumeric.attackSpeed,
    //   attackTimeRevise,
    //   talentAttackTimeRevise,
    //   attackSpeedRevise,
    //   talentAttackSpeedRevise,
    //   traitAttackSpeedRevise,
    //   finalAttackTime,
    //   attackCount,
    //   times,
    //   otherAttackScale,
    //   otherAttackType,
    //   otherBaseAttackTime,
    //   other2AttackScale,
    //   other2AttackType,
    //   dph,
    //   otherSkillDph,
    //   otherSubProfessionDph,
    //   dps,
    //   otherSkillDps,
    //   otherSubProfessionDps,
    // });

    return dps + otherSkillDps + otherSubProfessionDps;
  },

  // Calculates the total damage of the operator's skill
  skillMemberTotal: (calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const dps = SkillCalculatorModel.skillMemberDps(calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
    
    let duration = SkillCalculatorModel.skillData(calculationType, skillRow).duration;
    duration = duration < 1 ? 1 : duration;

    const changeDuration = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'CHANGE_duration');
    if (changeDuration) {
      duration = changeDuration;
    }
    
    const times = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'times');
    if (times > 0) {
      return dps;
    }
    
    const triggerTime = SkillCalculatorModel.skillCustomAttribute(calculationType, skillRow, memberData, uniequipJsonData, battleEquipJsonData, 'attack@trigger_time');
    if (triggerTime > 0) {
      const dph = SkillCalculatorModel.skillMemberDph(calculationType, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
      return dph * triggerTime;
    }
    
    return dps * duration;
  },
};

export default SkillCalculatorModel;