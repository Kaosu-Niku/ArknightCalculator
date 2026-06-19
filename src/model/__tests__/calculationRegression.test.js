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

const report = (type, skillId, candidates = false) => {
  const skillRow = { ...skillJsonData[skillId], skillId };
  return SkillCalculatorModel.skillMemberReport(
    type,
    skillRow,
    characterJsonData,
    enemyData,
    subProfessionIdJsonData,
    uniequipJsonData,
    battleEquipJsonData,
    candidates
  );
};

describe('approved calculation baselines', () => {
  test('all elite-two skill metrics are finite with module conditions on and off', () => {
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
        const metrics = SkillCalculatorModel.skillMemberMetrics(
          '精二滿級',
          skillRow,
          processedCharacterData,
          enemyData,
          subProfessionIdJsonData,
          uniequipJsonData,
          battleEquipJsonData,
          candidates
        );

        if(Number.isFinite(metrics.dps) && Number.isFinite(metrics.total)){
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
          ...metrics,
        }];
      });
    });

    expect(invalidRows).toEqual([]);
  });

  test('shared skills create a separate row for every operator', () => {
    const checkRarity = { TIER_4: true };
    const processedCharacterData = CalculatorDataBuilderModel.buildCharacterRows({
      type: types[4],
      characterJsonData,
      checkRarity,
      uniequipJsonData,
    });
    const processedSkillData = CalculatorDataBuilderModel.buildSkillRows({
      type: types[4],
      skillJsonData,
      characterJsonData,
      processedCharacterData,
      checkRarity,
      uniequipJsonData,
    });
    const click = Object.values(characterJsonData).find(member => {
      return member.appellation === 'Click';
    });
    const clickRows = processedSkillData.filter(row => {
      return row.memberId === click.potentialItemId && !row.equipid;
    });

    expect(clickRows.map(row => row.skillId)).toEqual([
      'skcom_atk_up[2]',
      'skchr_cammou_2',
    ]);
    expect(clickRows.map(row => (
      SkillCalculatorModel.skillFromMember(row, processedCharacterData)?.appellation
    ))).toEqual(['Click', 'Click']);

    const haze = Object.values(characterJsonData).find(member => {
      return member.appellation === 'Haze';
    });
    const hazeRows = processedSkillData.filter(row => row.memberId === haze.potentialItemId);
    const hazeRowIdentities = hazeRows.map(row => {
      return `${row.memberId}::${row.skillId}::${row.equipid ?? 'base'}`;
    });

    expect(hazeRows.map(row => [row.skillId, row.equipid ?? null])).toEqual([
      ['skcom_atk_up[2]', null],
      ['skchr_nights_2', null],
      ['skcom_atk_up[2]', 'uniequip_002_nights'],
      ['skchr_nights_2', 'uniequip_002_nights'],
    ]);
    expect(new Set(hazeRowIdentities).size).toBe(hazeRows.length);
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

  test('enemy debuffs and self-defense penalties do not enter attacker modifiers', () => {
    const cases = [
      ['skchr_vodfox_2', 'attackMultiplier'],
      ['skchr_tinman_1', 'attackMultiplier'],
      ['skchr_thorn2_3', 'attackMultiplier'],
      ['skchr_f12yin_2', 'defenseReduction'],
      ['skchr_svrash_3', 'defenseReduction'],
      ['skchr_slbell_1', 'attackSpeedRevision'],
    ];

    for (const [skillId, fieldName] of cases) {
      expect(report('精二滿級', skillId).formulaEffects[fieldName]).toEqual({
        found: false,
        value: 0,
        source: 'excluded',
      });
    }

    const thornReport = report('精二滿級', 'skchr_thorn2_3');
    expect(thornReport.formulaEffects.attackScale.found).toBe(true);
    expect(thornReport.formulaEffects.defenseReduction.found).toBe(true);
    expect(thornReport.formulaEffects.resistanceReduction.found).toBe(true);
  });

  test('talent conditions are disabled or probability-weighted by the condition toggle', () => {
    const vignaOff = report('精二滿級', 'skchr_vigna_2', false);
    const vignaOn = report('精二滿級', 'skchr_vigna_2', true);
    const midnightOff = report('精二滿級', 'skchr_midn_1', false);
    const midnightOn = report('精二滿級', 'skchr_midn_1', true);
    const beehunterOff = report('精二滿級', 'skchr_brownb_2', false);
    const beehunterOn = report('精二滿級', 'skchr_brownb_2', true);

    expect(vignaOff.memberTalent.attack ?? 0).toBe(0);
    expect(vignaOn.memberTalent.attack).toBeCloseTo(0.33);
    expect(midnightOff.memberTalent.atk_scale ?? 1).toBe(1);
    expect(midnightOn.memberTalent.atk_scale).toBeCloseTo(1.12);
    expect(beehunterOff.memberTalent.attack ?? 0).toBe(0);
    expect(beehunterOn.memberTalent.attack).toBeCloseTo(0.3);

    const schwarzSkillOne = report('精二滿級', 'skchr_shwaz_1', true);
    const schwarzSkillThree = report('精二滿級', 'skchr_shwaz_3', true);
    expect(schwarzSkillOne.memberTalent.atk_scale).toBeCloseTo(1.48);
    expect(schwarzSkillThree.memberTalent.atk_scale).toBeCloseTo(1.6);
  });

  test('probabilistic skill attack multipliers use expected values', () => {
    const tachankaOff = report('精二滿級', 'skchr_tachak_2', false);
    const tachankaOn = report('精二滿級', 'skchr_tachak_2', true);
    const pozemkaOff = report('精二滿級', 'skchr_bgsnow_1', false);
    const pozemkaOn = report('精二滿級', 'skchr_bgsnow_1', true);

    expect(tachankaOff.formulaEffects.attackScale.value).toBe(1);
    expect(tachankaOn.formulaEffects.attackScale.value).toBeCloseTo(1.15);
    expect(pozemkaOff.formulaEffects.attackScale.value).toBe(1);
    expect(pozemkaOn.formulaEffects.attackScale.value).toBeCloseTo(1.5);
  });

  test('probabilistic trapper modules use expected attack multipliers', () => {
    const skillId = 'skchr_doroth_1';
    const equipid = 'uniequip_002_doroth';
    const member = Object.values(characterJsonData).find(character => {
      return character.skills?.some(skill => skill.skillId === skillId);
    });
    const moduleMember = { ...member, equipid };
    const skillRow = {
      ...skillJsonData[skillId],
      skillId,
      memberId: member.potentialItemId,
      equipid,
    };
    const args = [
      '精二滿級',
      skillRow,
      [...Object.values(characterJsonData), moduleMember],
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
    ];

    const disabled = SkillCalculatorModel.skillMemberReport(...args, false);
    const enabled = SkillCalculatorModel.skillMemberReport(...args, true);

    expect(disabled.streams[0].details.attackScale.module).toBe(1);
    expect(enabled.streams[0].details.attackScale.module).toBeCloseTo(1.2);
  });

  test('special branches use their skill combat behavior', () => {
    const artsProtector = calculate('精二滿級', 'skchr_asbest_2');
    const abjurer = calculate('精二滿級', 'skchr_quercu_2');
    const incantationMedic = calculate('精二滿級', 'skchr_reed2_2');

    expect(artsProtector).toBeGreaterThan(0);
    expect(abjurer).toBe(0);
    expect(incantationMedic).toBeGreaterThan(0);
  });

  test('real skills use instant, ammo, permanent and staged DPS timing', () => {
    const instant = report('精二滿級', 'skchr_chen_2');
    const ammo = report('精二滿級', 'skchr_wisdel_3');
    const permanent = report('精二滿級', 'skchr_huang_2');
    const staged = report('精二滿級', 'skchr_thorns_3');

    expect(instant.dps).toBeCloseTo(instant.total);
    expect(ammo.dps).toBeCloseTo(
      ammo.total / (ammo.schedule.attackInterval * ammo.schedule.ammoCount)
    );
    expect(permanent.schedule.isPermanent).toBe(true);
    expect(permanent.dps).toBeGreaterThan(0);
    expect(staged.schedule.isPermanent).toBe(false);
    expect(staged.dps).toBeCloseTo(staged.total / staged.schedule.duration);
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
