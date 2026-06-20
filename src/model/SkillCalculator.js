import BasicCalculatorModel from '../model/BasicCalculator';
import DataIndexModel from './DataIndex';
import CalculationContextModel from './CalculationContext';
import SkillEffectResolverModel from './SkillEffectResolver';
import {
  resolveAttackDamage,
  resolveAttackPower,
  resolveEnemyDefense,
  resolveEnemyResistance,
} from './DamageFormula';
import {
  resolveAttackCount,
  resolveAttackInterval,
  resolveDamageStreamTotal,
  resolveDpsByStreams,
  resolveSkillDuration,
  resolveTotalByStreams,
} from './SkillTotalFormula';
import { getExtraAttackHitMultiplier } from './uniequipTraitRules';
import { resolveSkillAttackType } from './subProfessionCombatRules';
import { isPermanentSkill } from './skillDurationRules';
import { resolveSkillStateData } from './skillStateRules';

const resolveDamageDetails = (
  context,
  enemyData,
  extraAttackScale = null,
  attackTypeOverride = null,
  allowForcedOverride = false
) => {
  // 所有傷害流共用同一套乘區與減傷順序，明細與總傷因此不會分叉。
  const { memberNumeric, memberTalent } = context;
  const attackMultiplier = context.skillEffects.attackMultiplier();
  const flatAttack = context.skillEffects.flatAttack();
  const baseAttack = memberNumeric.atk + flatAttack;
  const talentAttackMultiplier = memberTalent?.attack ?? 0;
  const traitAttackMultiplier = context.memberEquipTrait('atk') ?? 0;
  let attackScale = context.skillEffects.attackScale();
  attackScale = attackScale > 0 ? attackScale : 1;
  const talentAttackScale = memberTalent?.atk_scale ?? 1;
  const traitAttackScale = context.memberEquipTrait('atk_scale') ?? 1;
  let damageMultiplier = context.skillEffects.damageScale();
  damageMultiplier = damageMultiplier > 0 ? damageMultiplier : 1;
  const talentDamageMultiplier = memberTalent?.damage_scale ?? 1;
  const traitDamageMultiplier = context.memberEquipTrait('damage_scale') ?? 1;
  const enemyDefense = resolveEnemyDefense({
    enemyDefense: enemyData.enemyDef,
    skillReduction: context.skillEffects.defenseReduction(),
    talentReduction: memberTalent?.def_penetrate_fixed ?? 0,
    skillPenetration: context.skillEffects.defensePenetration(),
    traitPenetration: context.memberEquipTrait('def_penetrate_fixed') ?? 0,
  });
  const enemyResistance = resolveEnemyResistance({
    enemyResistance: enemyData.enemyRes,
    skillReduction: context.skillEffects.resistanceReduction(),
    talentReduction: memberTalent?.magic_resistance ?? 0,
    traitAdjustment: context.memberEquipTrait('magic_resist_penetrate_fixed') ?? 0,
  });
  const attackType = resolveSkillAttackType({
    subProfessionId: context.memberData.subProfessionId,
    baseAttackType: context.attackType,
    skillAttackType: context.skillEffects.attackTypeOverride() || null,
    streamAttackType: attackTypeOverride,
    allowForcedOverride,
  });

  const attackMultiplierFactor = 1
    + attackMultiplier
    + talentAttackMultiplier
    + traitAttackMultiplier;
  const combinedAttackScale = attackScale * talentAttackScale * traitAttackScale;
  const combinedDamageMultiplier = damageMultiplier
    * talentDamageMultiplier
    * traitDamageMultiplier;
  const scaledAttackPower = resolveAttackPower({
    baseAttack,
    attackMultiplierFactor,
    attackScale: combinedAttackScale,
    extraAttackScale,
  });
  const attackPower = extraAttackScale !== null && extraAttackScale >= 10
    ? extraAttackScale
    : scaledAttackPower;
  const damage = resolveAttackDamage({
    attackType,
    baseAttack,
    attackMultiplierFactor,
    attackScale: combinedAttackScale,
    extraAttackScale,
    minimumDamageScale: memberTalent?.ensure_damage ?? 0.05,
    enemyDefense,
    enemyResistance,
    damageMultiplier: combinedDamageMultiplier,
  });

  return {
    damage,
    attackType,
    baseAttack,
    flatAttack,
    attackMultiplier: {
      skill: attackMultiplier,
      talent: talentAttackMultiplier,
      module: traitAttackMultiplier,
      final: attackMultiplierFactor,
    },
    attackScale: {
      skill: attackScale,
      talent: talentAttackScale,
      module: traitAttackScale,
      extra: extraAttackScale,
      final: combinedAttackScale * (extraAttackScale ?? 1),
    },
    scaledAttackPower,
    attackPower,
    enemyDefense,
    enemyResistance,
    defenseEffects: {
      skillReduction: context.skillEffects.defenseReduction(),
      talentReduction: memberTalent?.def_penetrate_fixed ?? 0,
      skillPenetration: context.skillEffects.defensePenetration(),
      modulePenetration: context.memberEquipTrait('def_penetrate_fixed') ?? 0,
    },
    resistanceEffects: {
      skillReduction: context.skillEffects.resistanceReduction(),
      talentReduction: memberTalent?.magic_resistance ?? 0,
      moduleAdjustment: context.memberEquipTrait('magic_resist_penetrate_fixed') ?? 0,
    },
    damageMultiplier: {
      skill: damageMultiplier,
      talent: talentDamageMultiplier,
      module: traitDamageMultiplier,
      final: combinedDamageMultiplier,
    },
    minimumDamageScale: memberTalent?.ensure_damage ?? 0.05,
  };
};

const createSkillDamageProfile = (context, enemyData) => {
  const { memberNumeric, memberTalent, subProfessionName } = context;
  const streams = [{
    source: 'main',
    details: resolveDamageDetails(context, enemyData),
    times: context.skillEffects.mainAttackTimes() || undefined,
  }];
  streams[0].damage = streams[0].details.damage;
  const skillExtraScale = context.skillEffects.extraAttackScale();

  if(skillExtraScale !== 0){
    const details = resolveDamageDetails(
      context,
      enemyData,
      skillExtraScale,
      context.skillEffects.extraAttackTypeOverride(),
      true
    );
    streams.push({
      source: 'skillExtra',
      damage: details.damage,
      details,
      interval: context.skillEffects.extraAttackInterval(),
      times: context.skillEffects.extraAttackTimes() || undefined,
      duration: context.skillEffects.extraDuration() || undefined,
    });
  }

  const traitExtraScale = context.memberEquipTrait('other2_attack_scale') ?? 0;
  if(traitExtraScale !== 0 && !context.skillEffects.disableTraitExtra()){
    const enableThirdAttack = context.memberEquipTrait('enable_third_attack') ?? 0;
    const details = resolveDamageDetails(
      context,
      enemyData,
      traitExtraScale,
      context.memberEquipTrait('other2_attack_type') ?? 0
    );
    streams.push({
      source: 'traitExtra',
      damage: details.damage,
      details,
      hitMultiplier: getExtraAttackHitMultiplier(
        subProfessionName,
        enableThirdAttack
      ),
    });
  }

  const schedule = {
    attackCount: resolveAttackCount(context.skillEffects.attackCount()),
    attackInterval: resolveAttackInterval({
      baseAttackTime: memberNumeric.baseAttackTime,
      attackTimeRevision: context.skillEffects.attackIntervalRevision(),
      talentAttackTimeRevision: memberTalent?.base_attack_time ?? 0,
      attackSpeed: memberNumeric.attackSpeed,
      attackSpeedRevision: context.skillEffects.attackSpeedRevision(),
      talentAttackSpeedRevision: memberTalent?.attack_speed ?? 0,
      traitAttackSpeedRevision: context.memberEquipTrait('attack_speed') ?? 0,
    }),
    duration: resolveSkillDuration(
      context.skillData.duration,
      context.skillEffects.durationOverride()
    ),
    times: context.skillEffects.attackTimes(),
    ammoCount: context.skillEffects.ammoCount(),
    isPermanent: isPermanentSkill(context.skillData),
  };

  return { streams, schedule };
};

const resolveSkillMetrics = (profile) => {
  const total = resolveTotalByStreams(profile.streams, profile.schedule);
  return {
    dps: resolveDpsByStreams(profile.streams, profile.schedule, total),
    total,
  };
};

const createSkillContext = ({
  type,
  skillRow,
  characterJsonData,
  subProfessionIdJsonData,
  uniequipJsonData,
  battleEquipJsonData,
  candidates_check,
}) => CalculationContextModel.createSkillContext({
  type,
  skillRow,
  characterJsonData,
  subProfessionIdJsonData,
  uniequipJsonData,
  battleEquipJsonData,
  candidates_check,
}, {
  skillFromMember: SkillCalculatorModel.skillFromMember,
  skillData: SkillCalculatorModel.skillData,
});

const SkillCalculatorModel = {
  skillFromMember: (skillRow, characterJsonData) => {
    const {
      byMemberId,
      byMemberIdAndEquipId,
      bySkillId,
      bySkillIdAndEquipId,
    } = DataIndexModel.skillMemberIndex(characterJsonData);

    if(skillRow.memberId){
      if(skillRow.equipid){
        return byMemberIdAndEquipId.get(`${skillRow.memberId}::${skillRow.equipid}`) ?? null;
      }
      return byMemberId.get(skillRow.memberId) ?? null;
    }

    if(skillRow.equipid){
      return bySkillIdAndEquipId.get(`${skillRow.skillId}::${skillRow.equipid}`) ?? null;
    }

    return bySkillId.get(skillRow.skillId) ?? null;
  },

  // 依養成階段選取技能等級；低星技能沒有專精資料。
  skillData: (type, skillRow) => {
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const maxLevel = skillRow.levels.length;

    if(maxLevel > 7){
      const levelIndexByPhase = {
        0: maxLevel - 7,
        1: maxLevel - 4,
        2: maxLevel - 1,
      };
      return resolveSkillStateData(
        skillRow,
        skillRow.levels[levelIndexByPhase[witchPhases]]
      );
    }

    const levelIndexByPhase = {
      0: maxLevel - 4,
      1: maxLevel - 1,
      2: maxLevel - 1,
    };
    return resolveSkillStateData(
      skillRow,
      skillRow.levels[levelIndexByPhase[witchPhases]]
    );
  },

  skillFormulaEffects: (
    type,
    skillRow,
    memberData,
    uniequipJsonData,
    battleEquipJsonData,
    candidates_check = false
  ) => {
    return CalculationContextModel.createSkillAttributeContext({
      type,
      skillRow,
      memberData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates_check,
    }, {
      skillData: SkillCalculatorModel.skillData,
    }).skillEffects;
  },

  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    return SkillCalculatorModel.skillMemberMetrics(
      type,
      skillRow,
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates_check
    ).total;
  },

  skillMemberMetrics: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    const context = createSkillContext({
      type,
      skillRow,
      characterJsonData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates_check,
    });
    const profile = createSkillDamageProfile(context, enemyData);
    return resolveSkillMetrics(profile);
  },

  skillMemberReport: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    const context = createSkillContext({
      type,
      skillRow,
      characterJsonData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates_check,
    });
    const profile = createSkillDamageProfile(context, enemyData);
    const streams = profile.streams.map(stream => ({
      ...stream,
      total: resolveDamageStreamTotal(stream, profile.schedule),
    }));
    const total = streams.reduce((sum, stream) => sum + stream.total, 0);
    const formulaEffects = Object.fromEntries(
      Object.entries(SkillEffectResolverModel.formulaFieldKeys).map(([fieldName]) => [
        fieldName,
        context.skillEffects.fieldResult(fieldName),
      ])
    );

    return {
      member: context.memberData,
      skill: context.skillData,
      skillId: context.skillRow.skillId,
      equipId: context.skillRow.equipid ?? null,
      checkName: context.checkName,
      memberNumeric: context.memberNumeric,
      memberTalent: context.memberTalent ?? {},
      formulaEffects,
      skillBlackboard: Object.fromEntries(
        Array.from(context.skillBlackboard.entries()).map(([key, entry]) => [key, entry.value])
      ),
      schedule: profile.schedule,
      streams,
      dps: resolveDpsByStreams(profile.streams, profile.schedule, total),
      total,
    };
  },
}

export default SkillCalculatorModel;
