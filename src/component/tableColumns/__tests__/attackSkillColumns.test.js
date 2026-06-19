import createAttackSkillColumns, { optionalAttackSkillColumns } from '../attackSkillColumns';
import SkillCalculatorModel from '../../../model/SkillCalculator';
import SkillCustomCalculatorModel from '../../../model/SkillCustomCalculator';

const createColumns = (visibleOptionalColumns = [], candidates = false) => createAttackSkillColumns({
  t: value => value,
  whichType: '精二滿級',
  processedCharacterData: [],
  enemyData: {},
  professionJsonData: {},
  subProfessionIdJsonData: {},
  uniequipJsonData: {},
  battleEquipJsonData: {},
  candidates,
  visibleOptionalColumns,
});

describe('attack skill table columns', () => {
  test('places skill DPS immediately before total damage', () => {
    const titles = createColumns().map(column => column.title);

    expect(titles).toEqual([
      '名稱',
      '星級',
      '職業',
      '分支',
      '模組',
      '技能名稱',
      '冷卻時間',
      '持續時間',
      '技能DPS',
      '技能總傷',
    ]);
  });

  test('adds only selected optional columns', () => {
    const titles = createColumns(['ammo', 'attackScale', 'attackTimes'])
      .map(column => column.title);

    expect(titles).toContain('彈藥數量');
    expect(titles).toContain('攻擊倍率');
    expect(titles).toContain('攻擊段數');
    expect(titles).not.toContain('攻擊乘算');
    expect(optionalAttackSkillColumns).toHaveLength(16);
  });

  test('offers every skill effect used by the damage formula', () => {
    expect(optionalAttackSkillColumns.map(column => column.id)).toEqual([
      'ammo',
      'attackType',
      'attackMultiplier',
      'attackScale',
      'damageScale',
      'defenseReduction',
      'defensePenetration',
      'resistanceReduction',
      'attackInterval',
      'attackSpeed',
      'attackCount',
      'attackTimes',
      'durationOverride',
      'extraAttackType',
      'extraAttackScale',
      'extraAttackInterval',
    ]);
  });

  test('identifies skills whose damage changes with condition settings', () => {
    expect(SkillCustomCalculatorModel.hasConditionalEffect('战车-倾泻弹药')).toBe(true);
    expect(SkillCustomCalculatorModel.hasConditionalEffect('鸿雪-抑扬格')).toBe(true);
    expect(SkillCustomCalculatorModel.hasConditionalEffect('卡达-同步索敌攻击')).toBe(false);
  });

  test('marks a conditional skill only in display rendering when enabled', () => {
    jest.spyOn(SkillCalculatorModel, 'skillFromMember').mockReturnValue({ name: '战车' });
    jest.spyOn(SkillCalculatorModel, 'skillData').mockReturnValue({ name: '倾泻弹药' });
    const skillColumn = createColumns([], true)[5];
    const row = {};

    expect(skillColumn.render(null, 'display', row)).toContain('技能條件生效');
    expect(skillColumn.render(null, 'sort', row)).toBe('倾泻弹药');

    jest.restoreAllMocks();
  });
});
