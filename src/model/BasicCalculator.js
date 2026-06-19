import UniequipCalculatorModel from './UniequipCalculator';
import TalentsCalculatorModel from './TalentsCalculator';
import ProgressionResolverModel from './ProgressionResolver';
import { resolveFlatTalentBonuses } from './talentEffectRules';

const memberNumericCache = new WeakMap();
const numericKeys = ['maxHp', 'atk', 'def', 'magicResistance', 'baseAttackTime', 'attackSpeed'];
const emptyNumeric = () => Object.fromEntries(numericKeys.map(key => [key, 0]));

const attributeTypeToKey = {
  MAX_HP: 'maxHp',
  ATK: 'atk',
  DEF: 'def',
  MAGIC_RESISTANCE: 'magicResistance',
  ATTACK_SPEED: 'attackSpeed',
};

const BasicCalculatorModel = {
  // 將 UI 的養成階段轉成 JSON phase 與 key frame 索引。
  type: ProgressionResolverModel.type,

  memberRarity: ProgressionResolverModel.memberRarity,

  memberProfession: (memberRow, professionJsonData) => {
    const profession = memberRow.profession;
    return professionJsonData[profession];
  },

  memberSubProfessionId: (memberRow, subProfessionIdJsonData) => {
    const subProfessionId = memberRow.subProfessionId;
    return subProfessionIdJsonData[subProfessionId];
  },

  // 面板順序：等級基礎值 + 潛能 + 信賴 + 模組，最後套用天賦。
  memberNumeric: (type, memberRow, uniequipJsonData, battleEquipJsonData) => {
    if (!memberRow) {
      return { maxHp: 0, atk: 0, def: 0, magicResistance: 0, baseAttackTime: 0, attackSpeed: 0 };
    }

    const cacheKey = `${type}::${memberRow.equipid ?? ''}`;
    const cachedByMember = memberNumericCache.get(memberRow);
    if (cachedByMember?.has(cacheKey)) {
      return cachedByMember.get(cacheKey);
    }

    const numeric = BasicCalculatorModel.memberNumericBreakdown(
      type,
      memberRow,
      uniequipJsonData,
      battleEquipJsonData
    ).final;
    if (cachedByMember) {
      cachedByMember.set(cacheKey, numeric);
    }
    else {
      memberNumericCache.set(memberRow, new Map([[cacheKey, numeric]]));
    }

    return numeric;
  },

  memberNumericBreakdown: (type, memberRow, uniequipJsonData, battleEquipJsonData) => {
    if(!memberRow){
      return {
        base: emptyNumeric(),
        potential: emptyNumeric(),
        trust: emptyNumeric(),
        module: emptyNumeric(),
        beforeTalent: emptyNumeric(),
        talent: emptyNumeric(),
        flatTalent: { atk: 0, maxHp: 0 },
        final: emptyNumeric(),
      };
    }

    // 同一份拆解同時供表格最終值與計算明細使用，避免兩套加成順序分叉。
    const progression = ProgressionResolverModel.type(type);
    const maxPhases = memberRow.phases.length;
    const baseData = memberRow.phases[progression.witchPhases]
      ?.attributesKeyFrames[progression.witchAttributesKeyFrames]?.data
      ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
    const base = Object.fromEntries(numericKeys.map(key => [key, baseData[key] ?? 0]));
    const potential = emptyNumeric();
    const trust = emptyNumeric();
    const module = emptyNumeric();

    for(const rank of memberRow.potentialRanks ?? []){
      const modifier = rank.buff?.attributes.attributeModifiers?.[0];
      const key = attributeTypeToKey[modifier?.attributeType];
      if(key){
        potential[key] += modifier.value ?? 0;
      }
    }

    for(const frame of memberRow.favorKeyFrames ?? []){
      if(frame.level !== 50){
        continue;
      }
      for(const key of ['maxHp', 'atk', 'def', 'magicResistance']){
        trust[key] += frame.data?.[key] ?? 0;
      }
    }

    if(progression.witchPhases === 2){
      const equipBattle = UniequipCalculatorModel.memberEquipBattle(
        memberRow,
        uniequipJsonData,
        battleEquipJsonData
      );
      const moduleKeyMap = {
        max_hp: 'maxHp',
        atk: 'atk',
        def: 'def',
        magic_resistance: 'magicResistance',
        attack_speed: 'attackSpeed',
      };
      for(const attribute of equipBattle?.attributeBlackboard ?? []){
        const key = moduleKeyMap[attribute.key];
        if(key){
          module[key] += attribute.value ?? 0;
        }
      }
    }

    const talent = Object.fromEntries(numericKeys.map(key => [key,
      TalentsCalculatorModel.memberTalent(
        type,
        memberRow,
        uniequipJsonData,
        battleEquipJsonData,
        key === 'magicResistance' ? 'magic_resistance'
          : key === 'baseAttackTime' ? 'base_attack_time'
            : key === 'attackSpeed' ? 'attack_speed'
              : key === 'maxHp' ? 'max_hp'
                : key
      )
    ]));
    const beforeTalent = Object.fromEntries(numericKeys.map(key => [
      key,
      base[key] + potential[key] + trust[key] + module[key],
    ]));
    const flatTalent = resolveFlatTalentBonuses(
      memberRow.name,
      (attribute) => TalentsCalculatorModel.memberTalentRaw(
        type,
        memberRow,
        uniequipJsonData,
        battleEquipJsonData,
        attribute
      )
    );
    const final = {
      maxHp: beforeTalent.maxHp * (1 + talent.maxHp) + flatTalent.maxHp,
      atk: beforeTalent.atk * (1 + talent.atk) + flatTalent.atk,
      def: beforeTalent.def * (1 + talent.def),
      magicResistance: beforeTalent.magicResistance + talent.magicResistance,
      baseAttackTime: beforeTalent.baseAttackTime + talent.baseAttackTime,
      attackSpeed: beforeTalent.attackSpeed + talent.attackSpeed,
    };

    return { base, potential, trust, module, beforeTalent, talent, flatTalent, final };
  },
};

export default BasicCalculatorModel;
