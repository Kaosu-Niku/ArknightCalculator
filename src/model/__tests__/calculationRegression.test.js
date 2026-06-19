import SkillCalculatorModel from '../SkillCalculator';
import CalculatorDataBuilderModel from '../CalculatorDataBuilder';

const characterJsonData = require('../../../public/json/character_table.json');
const skillJsonData = require('../../../public/json/skill_table.json');
const subProfessionIdJsonData = require('../../../public/json/subProfessionId.json');
const uniequipJsonData = require('../../../public/json/uniequip_table.json');
const battleEquipJsonData = require('../../../public/json/battle_equip_table.json');

const types = [
  '精零1級',
  '精零滿級',
  '精一1級',
  '精一滿級',
  '精二1級',
  '精二滿級',
];

const enemyData = {
  enemyDef: 500,
  enemyRes: 30,
};

const round = (value) => Math.round(value * 1000000) / 1000000;

const calculate = (type, skillId) => {
  const skillRow = { ...skillJsonData[skillId], skillId };
  return round(SkillCalculatorModel.skillMemberTotal(
    type,
    skillRow,
    characterJsonData,
    enemyData,
    subProfessionIdJsonData,
    uniequipJsonData,
    battleEquipJsonData
  ));
};

describe('approved calculation baselines', () => {
  test('all elite-two skill totals are finite with module conditions on and off', () => {
    const checkRarity = {
      TIER_1: true,
      TIER_2: true,
      TIER_3: true,
      TIER_4: true,
      TIER_5: true,
      TIER_6: true,
    };
    const processedCharacterData = CalculatorDataBuilderModel.buildCharacterRows({
      type: '精二滿級',
      characterJsonData,
      checkRarity,
      uniequipJsonData,
    });
    const processedSkillData = CalculatorDataBuilderModel.buildSkillRows({
      type: '精二滿級',
      skillJsonData,
      characterJsonData,
      processedCharacterData,
      checkRarity,
      uniequipJsonData,
    });
    const invalidRows = [false, true].flatMap(candidates => {
      return processedSkillData.flatMap(skillRow => {
        const total = SkillCalculatorModel.skillMemberTotal(
          '精二滿級',
          skillRow,
          processedCharacterData,
          enemyData,
          subProfessionIdJsonData,
          uniequipJsonData,
          battleEquipJsonData,
          candidates
        );

        if(Number.isFinite(total)){
          return [];
        }

        const member = SkillCalculatorModel.skillFromMember(
          skillRow,
          processedCharacterData
        );
        return [{
          member: member?.name,
          skill: SkillCalculatorModel.skillData('精二滿級', skillRow)?.name,
          skillId: skillRow.skillId,
          equipId: skillRow.equipid ?? null,
          candidates,
          total,
        }];
      });
    });

    expect(invalidRows).toEqual([]);
  });

  test('卡达 同步索敌攻击 remains non-zero at every calculation phase', () => {
    const results = Object.fromEntries(
      types.map(type => [type, calculate(type, 'skchr_cammou_2')])
    );

    for (const total of Object.values(results)) {
      expect(total).toBeGreaterThan(0);
    }
    expect(results).toMatchSnapshot();
  });

  test('special skill and talent rules retain approved outputs', () => {
    const cases = {
      '断罪者-断罪': calculate('精二滿級', 'skchr_peacok_1'),
      '深靛-光影迷宫': calculate('精二滿級', 'skchr_indigo_2'),
      '酸糖-扳机时刻': calculate('精二滿級', 'skchr_acdrop_2'),
      '宴-落地斩·破门': calculate('精二滿級', 'skchr_utage_1'),
      '夜烟-赤色之瞳': calculate('精二滿級', 'skchr_nights_2'),
      '云迹-旧日重现': calculate('精二滿級', 'skchr_ctrail_2'),
      '猎蜂-急速拳': calculate('精二滿級', 'skchr_brownb_2'),
    };

    expect(cases).toMatchSnapshot();
  });

  test('special branches use their skill combat behavior', () => {
    const artsProtector = calculate('精二滿級', 'skchr_asbest_2');
    const abjurer = calculate('精二滿級', 'skchr_quercu_2');
    const incantationMedic = calculate('精二滿級', 'skchr_reed2_2');

    expect(artsProtector).toBeGreaterThan(0);
    expect(abjurer).toBe(0);
    expect(incantationMedic).toBeGreaterThan(0);
  });

  test('ammo total includes thrower module extra attacks', () => {
    const skillId = 'skchr_wisdel_3';
    const equipid = 'uniequip_002_wisdel';
    const member = Object.values(characterJsonData).find(character => {
      return character.skills?.some(skill => skill.skillId === skillId);
    });
    const characterRows = [
      ...Object.values(characterJsonData),
      { ...member, equipid },
    ];
    const skillRow = { ...skillJsonData[skillId], skillId, equipid };
    const args = [
      '精二滿級',
      skillRow,
      characterRows,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
    ];
    const report = SkillCalculatorModel.skillMemberReport(...args);
    const mainStream = report.streams.find(stream => stream.source === 'main');
    const result = {
      mainDamage: round(mainStream.damage),
      mainDamageOnly: round(mainStream.damage * report.schedule.ammoCount),
      total: round(report.total),
    };

    expect(result.total).toBeGreaterThan(result.mainDamageOnly);
    expect(result).toMatchSnapshot();
  });
});
