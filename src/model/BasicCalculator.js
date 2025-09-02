import TalentsCalculatorModel from './TalentsCalculator';
import UniequipCalculatorModel from './UniequipCalculator';

const BasicCalculatorModel = {
    // 查詢當前所選流派，回傳對應的階段和等級索引
    type: (type) => {
        const typeMap = {
            '精零1級': { witchPhases: 0, witchAttributesKeyFrames: 0 },
            '精零滿級': { witchPhases: 0, witchAttributesKeyFrames: 1 },
            '精一1級': { witchPhases: 1, witchAttributesKeyFrames: 0 },
            '精一滿級': { witchPhases: 1, witchAttributesKeyFrames: 1 },
            '精二1級': { witchPhases: 2, witchAttributesKeyFrames: 0 },
            '精二滿級': { witchPhases: 2, witchAttributesKeyFrames: 1 },
        };
        return typeMap[type] || { witchPhases: 0, witchAttributesKeyFrames: 0 };
    },

    // 查詢幹員的星級 (回傳number)
    memberRarity: (memberRow) => {
        const rarityMap = {
            "TIER_1": 1, "TIER_2": 2, "TIER_3": 3,
            "TIER_4": 4, "TIER_5": 5, "TIER_6": 6,
        };
        return rarityMap[memberRow.rarity];
    },

    // 查詢幹員的職業 (回傳object，詳情內容參考profession.json)
    memberProfession: (memberRow, professionJsonData) => {
        return professionJsonData[memberRow.profession];
    },

    // 查詢幹員的分支 (回傳object，詳情內容參考subProfessionId.json)
    memberSubProfessionId: (memberRow, subProfessionIdJsonData) => {
        return subProfessionIdJsonData[memberRow.subProfessionId];
    },

    // 處理屬性計算的通用函式
    calculateAttribute: (memberData, prop, talentValue) => {
        const { potentialRanksData, favorKeyFrames, equipBattle } = memberData;
        const potentialValue = potentialRanksData.find(el => el.buff?.attributes.attributeModifiers[0]?.attributeType === prop.toUpperCase())?.buff.attributes.attributeModifiers[0].value || 0;
        const favorValue = favorKeyFrames.find(el => el.level === 50)?.data[prop] || 0;
        const equipValue = equipBattle?.attributeBlackboard.find(el => el.key === prop)?.value || 0;
        return memberData.basicData[prop] + potentialValue + favorValue + equipValue + talentValue;
    },

    // 計算幹員的基礎數據在經過各種加成後的最終數據
    memberNumeric: (type, memberRow, uniequipJsonData, battleEquipJsonData) => {
        const { witchPhases, witchAttributesKeyFrames } = BasicCalculatorModel.type(type);
        const maxPhases = memberRow.phases.length;
        const basicData = memberRow.phases[witchPhases]?.attributesKeyFrames[witchAttributesKeyFrames]?.data ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
        
        const equipBattle = (witchPhases === 2) ? UniequipCalculatorModel.memberEquipBattle(memberRow, uniequipJsonData, battleEquipJsonData) : null;
        
        const data = {
            basicData,
            potentialRanksData: memberRow.potentialRanks,
            favorKeyFrames: memberRow.favorKeyFrames,
            equipBattle
        };

        let maxHp = BasicCalculatorModel.calculateAttribute(data, 'maxHp');
        let atk = BasicCalculatorModel.calculateAttribute(data, 'atk');
        let def = BasicCalculatorModel.calculateAttribute(data, 'def');
        let magicResistance = BasicCalculatorModel.calculateAttribute(data, 'magicResistance');
        let baseAttackTime = BasicCalculatorModel.calculateAttribute(data, 'baseAttackTime');
        let attackSpeed = BasicCalculatorModel.calculateAttribute(data, 'attackSpeed');

        // 天賦加成
        maxHp *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'max_hp'));
        atk *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'atk'));
        def *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'def'));
        magicResistance += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'magic_resistance');
        baseAttackTime += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'base_attack_time');
        attackSpeed += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'attack_speed');

        return { maxHp, atk, def, magicResistance, baseAttackTime, attackSpeed };
    },

    // 計算敵方的DPS
    enemyDps: (type, memberRow, enemyData, uniequipJsonData, battleEquipJsonData) => {
        const numeric = BasicCalculatorModel.memberNumeric(type, memberRow, uniequipJsonData, battleEquipJsonData);
        let dps = 0;

        // 平A DPS
        let dph = 0;
        const { enemyAttack, enemySpd, enemyAttackType } = enemyData;
        const minDamage = enemyAttack / 20;
        if (enemyAttackType === "物傷") {
            dph = Math.max(enemyAttack - numeric.def, minDamage);
        } else if (enemyAttackType === "法傷") {
            dph = Math.max(enemyAttack * ((100 - numeric.magicResistance) / 100), minDamage);
        } else if (enemyAttackType === "真傷") {
            dph = enemyAttack;
        }
        dps += dph / enemySpd;

        // 技能 DPS
        let skillDpsTotal = 0;
        if (enemyData.enemySkill.length > 0) {
            enemyData.enemySkill.forEach((item) => {
                let skillDph = 0;
                const minSkillDamage = item.enemySkillDamage / 20;
                if (item.enemySkillType === "物傷") {
                    skillDph = Math.max(item.enemySkillDamage - numeric.def, minSkillDamage);
                } else if (item.enemySkillType === "法傷") {
                    skillDph = Math.max(item.enemySkillDamage * ((100 - numeric.magicResistance) / 100), minSkillDamage);
                } else if (item.enemySkillType === "真傷") {
                    skillDph = item.enemySkillDamage;
                }
                const skillDps = (skillDph * item.enemySkillCount) / item.enemySkillWaitTime;
                skillDpsTotal += skillDps;
            });
        }
        return dps + skillDpsTotal;
    },
};

export default BasicCalculatorModel;