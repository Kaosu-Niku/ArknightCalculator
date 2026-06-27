import SkillCalculatorModel from '../SkillCalculator';
import CalculatorDataBuilderModel from '../CalculatorDataBuilder';
import BasicCalculatorModel from '../BasicCalculator';
import HealingSkillCalculatorModel from '../HealingSkillCalculator';

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

  test('toggle skills expose initial and active states as separate rows', () => {
    const checkRarity = { TIER_6: true };
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
    const mountainRows = processedSkillData.filter(row => (
      row.skillId === 'skchr_f12yin_2' && !row.equipid
    ));

    expect(mountainRows.map(row => row.skillState)).toEqual(['initial', 'active']);
    const [initial, active] = mountainRows.map(row => (
      SkillCalculatorModel.skillMemberMetrics(
        '精二滿級',
        row,
        processedCharacterData,
        enemyData,
        subProfessionIdJsonData,
        uniequipJsonData,
        battleEquipJsonData
      ).dps
    ));
    expect(active).toBeGreaterThan(initial);
  });

  test('卡达 同步索敌攻击 remains non-zero at every calculation phase', () => {
    const results = Object.fromEntries(
      types.map(type => [type, calculate(type, 'skchr_cammou_2')])
    );

    for (const total of Object.values(results)) {
      expect(total).toBeGreaterThan(0);
    }
    expect(results['精二滿級']).toBeGreaterThan(results['精零1級']);
  });

  test('audited stop-attack skills keep intentional damage streams only', () => {
    expect(calculate('精二滿級', 'skchr_utage_1')).toBe(0);
    expect(calculate('精二滿級', 'skchr_bdhkgt_2')).toBeGreaterThan(0);
    expect(calculate('精二滿級', 'skchr_judge_2')).toBeGreaterThan(0);
  });

  test('approved Monster Hunter skills use their full hit sequences', () => {
    const noirc = report('精二滿級', 'skchr_noirc2_1');
    const catapult = report('精二滿級', 'skchr_catap2_1');

    expect(noirc.schedule.attackCount).toBe(4);
    expect(noirc.total).toBeGreaterThan(0);
    expect(catapult.schedule.attackCount).toBe(7.5);
    expect(catapult.streams.map(stream => stream.source)).toEqual([
      'main',
      'skillExtra',
    ]);
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

  test('healing skills are separated from damage skills', () => {
    const medic = Object.values(characterJsonData).find(member => member.name === '苏苏洛');
    const medicSkillRow = { ...skillJsonData.skchr_susuro_2, skillId: 'skchr_susuro_2' };
    const medicDamage = SkillCalculatorModel.skillMemberMetrics(
      '精二滿級',
      medicSkillRow,
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );

    expect(HealingSkillCalculatorModel.isHealingSkill(medic)).toBe(true);
    expect(HealingSkillCalculatorModel.shouldShowInDamageTable({
      member: medic,
      damageMetrics: medicDamage,
    })).toBe(false);

    const incantationSkillRow = { ...skillJsonData.skchr_reed2_2, skillId: 'skchr_reed2_2' };
    const incantationDamage = SkillCalculatorModel.skillMemberMetrics(
      '精二滿級',
      incantationSkillRow,
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );
    const incantationHealing = HealingSkillCalculatorModel.skillMemberMetrics(
      '精二滿級',
      incantationSkillRow,
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );

    expect(incantationDamage.total).toBeGreaterThan(0);
    expect(incantationHealing.total).toBeCloseTo(incantationDamage.total * 0.5);
  });

  test('healing custom rules map direct heals and healing-over-time schedules', () => {
    const lumenHot = HealingSkillCalculatorModel.skillMemberReport(
      '精二滿級',
      { ...skillJsonData.skchr_lumen_1, skillId: 'skchr_lumen_1' },
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );
    const lumenBurst = HealingSkillCalculatorModel.skillMemberReport(
      '精二滿級',
      { ...skillJsonData.skchr_lumen_2, skillId: 'skchr_lumen_2' },
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );
    const eyjaVolcano = HealingSkillCalculatorModel.skillMemberReport(
      '精二滿級',
      { ...skillJsonData.skchr_agoat2_3, skillId: 'skchr_agoat2_3' },
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData
    );

    expect(lumenHot.streams[0].interval).toBe(1);
    expect(lumenHot.streams[0].duration).toBe(5);
    expect(lumenBurst.streams[0].times).toBe(1);
    expect(eyjaVolcano.streams[0].times).toBe(5);
    expect(lumenBurst.total).toBeGreaterThan(lumenHot.streams[0].healing);
  });

  test('new game data custom rules map multi-hit and non-standard keys', () => {
    const varkis = report('精二滿級', 'skchr_varkis_1');
    const amoris = report('精二滿級', 'skchr_amoris_1');
    const liesel = report('精二滿級', 'skchr_liesel_2');
    const kaltsit = report('精二滿級', 'skchr_kalts2_2');
    const headbrh = report('精二滿級', 'skchr_headb2_3');

    expect(varkis.schedule.attackCount).toBe(3);
    expect(amoris.formulaEffects.attackScale.value).toBeCloseTo(2);
    expect(liesel.streams.find(stream => stream.source === 'main').times).toBe(1);
    expect(liesel.streams.find(stream => stream.source === 'skillExtra').duration).toBe(6);
    expect(kaltsit.streams[0].details.attackType).toBe('真實');
    expect(kaltsit.schedule.ammoCount).toBe(10);
    expect(headbrh.formulaEffects.attackMultiplier.value).toBe(1);
    expect(headbrh.formulaEffects.attackScale.value).toBeCloseTo(3.12);
    expect(headbrh.schedule.attackCount).toBe(5);
  });

  test('new conditional talents and skills use enabled or expected values', () => {
    const kichiOff = report('精二滿級', 'skchr_kichi_2', false);
    const kichiOn = report('精二滿級', 'skchr_kichi_2', true);
    const demetrOff = report('精二滿級', 'skchr_demetr_3', false);
    const demetrOn = report('精二滿級', 'skchr_demetr_3', true);

    expect(kichiOff.memberTalent.damage_scale ?? 1).toBe(1);
    expect(kichiOn.memberTalent.damage_scale).toBeCloseTo(1.21);
    expect(demetrOff.formulaEffects.attackScale.value).toBe(1);
    expect(demetrOn.formulaEffects.attackScale.value).toBeCloseTo(1.425);
    expect(demetrOn.memberTalent.damage_scale).toBeCloseTo(1.36);
    expect(demetrOn.memberTalent.def_penetrate_fixed).toBeCloseTo(-0.35);
  });

  test('fragile effects feed back only when conditional effects are enabled', () => {
    const pramanixOff = report('精二滿級', 'skchr_slbell_2', false);
    const pramanixOn = report('精二滿級', 'skchr_slbell_2', true);
    const shamareOn = report('精二滿級', 'skchr_vodfox_1', true);
    const reedOff = report('精二滿級', 'skchr_reed2_3', false);
    const reedOn = report('精二滿級', 'skchr_reed2_3', true);

    expect(pramanixOff.memberTalent.damage_scale ?? 1).toBe(1);
    expect(pramanixOn.memberTalent.damage_scale).toBeCloseTo(1.33);
    expect(shamareOn.streams[0].details.damageMultiplier.final).toBeCloseTo(1.594);
    expect(reedOff.memberTalent.damage_scale ?? 1).toBe(1);
    expect(reedOn.memberTalent.damage_scale).toBeCloseTo(1.32);
  });

  test('fixed talent stacks are added after percentage talent bonuses', () => {
    const ulpian = characterJsonData.char_4145_ulpia;
    const numeric = BasicCalculatorModel.memberNumericBreakdown(
      '精二滿級',
      ulpian,
      uniequipJsonData,
      battleEquipJsonData
    );
    const skill = report('精二滿級', 'skchr_ulpia_2');

    expect(numeric.flatTalent.atk).toBe(300);
    expect(numeric.flatTalent.maxHp).toBe(1200);
    expect(numeric.final.atk).toBeCloseTo(
      numeric.beforeTalent.atk * (1 + numeric.talent.atk) + 300
    );
    expect(skill.formulaEffects.flatAttack.value).toBe(300);
  });

  test('substitute and retaliation damage do not modify main attacks', () => {
    const specter = report('精二滿級', 'skchr_ghost2_2', true);
    const mlynarOff = report('精二滿級', 'skchr_mlynar_1', false);
    const mlynarOn = report('精二滿級', 'skchr_mlynar_1', true);

    expect(specter.memberTalent.atk_scale ?? 1).toBe(1);
    expect(mlynarOff.memberTalent.atk_scale).toBeCloseTo(1.13);
    expect(mlynarOn.memberTalent.atk_scale).toBeCloseTo(1.18);
  });

  test('team buffs apply only when the operator can receive them', () => {
    const breakdown = (type, id) => BasicCalculatorModel.memberNumericBreakdown(
      type,
      characterJsonData[id],
      uniequipJsonData,
      battleEquipJsonData
    );

    expect(breakdown('精二滿級', 'char_180_amgoat').talent.atk).toBeCloseTo(0.16);
    expect(breakdown('精二滿級', 'char_130_doberm').talent.atk).toBe(0);
    expect(breakdown('精一滿級', 'char_187_ccheal').talent.atk).toBe(0);
  });

  test('staged skills use their highest available stage', () => {
    const thorns = report('精二滿級', 'skchr_thorns_3');
    const viviana = report('精二滿級', 'skchr_vvana_3');
    const horn = report('精二滿級', 'skchr_horn_3');
    const headbrh = report('精二滿級', 'skchr_headb2_2');
    const haruka = report('精二滿級', 'skchr_haruka_2');
    const eyjafjalla = report('精二滿級', 'skchr_amgoat_1');
    const logos = report('精二滿級', 'skchr_logos_2');
    const carnelian = report('精二滿級', 'skchr_billro_3');

    expect(thorns.formulaEffects.attackMultiplier.value).toBeCloseTo(1.2);
    expect(thorns.formulaEffects.attackSpeedRevision.value).toBe(50);
    expect(thorns.schedule.isPermanent).toBe(true);
    expect(viviana.schedule.attackCount).toBe(3);
    expect(viviana.schedule.duration).toBe(25);
    expect(horn.formulaEffects.attackMultiplier.value).toBeCloseTo(1.4);
    expect(headbrh.formulaEffects.attackMultiplier.value).toBeCloseTo(1.8);
    expect(headbrh.schedule.isPermanent).toBe(true);
    expect(haruka.formulaEffects.attackMultiplier.value).toBeCloseTo(0.4);
    expect(haruka.schedule.isPermanent).toBe(true);
    expect(eyjafjalla.formulaEffects.attackMultiplier.value).toBeCloseTo(0.6);
    expect(eyjafjalla.formulaEffects.attackSpeedRevision.value).toBe(60);
    expect(logos.streams.find(stream => stream.source === 'skillExtra').details.attackScale.extra).toBeCloseTo(2.25);
    expect(carnelian.formulaEffects.damageScale.value).toBeCloseTo(2);
  });

  test('duration adjustments use effective output time for delayed skills', () => {
    const xiaoman = report('精二滿級', 'skchr_grabds_2');

    expect(xiaoman.formulaEffects.durationAdjustment).toEqual({
      found: true,
      value: -5,
      source: 'custom',
    });
    expect(xiaoman.schedule.duration).toBe(xiaoman.skill.duration - 5);
    expect(xiaoman.total).toBeGreaterThan(0);
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
    expect(staged.schedule.isPermanent).toBe(true);
    expect(staged.dps).toBeGreaterThan(0);
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
    const mainDamageOnly = round(mainStream.damage * report.schedule.ammoCount);

    expect(report.schedule.ammoCount).toBeGreaterThan(0);
    expect(report.streams.map(stream => stream.source)).toContain('traitExtra');
    expect(round(report.total)).toBeGreaterThan(mainDamageOnly);
  });
});
