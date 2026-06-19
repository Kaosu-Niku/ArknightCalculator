import createAttackSkillColumns, { optionalAttackSkillColumns } from '../attackSkillColumns';

const createColumns = (visibleOptionalColumns = []) => createAttackSkillColumns({
  t: value => value,
  whichType: '精二滿級',
  processedCharacterData: [],
  enemyData: {},
  professionJsonData: {},
  subProfessionIdJsonData: {},
  uniequipJsonData: {},
  battleEquipJsonData: {},
  candidates: false,
  visibleOptionalColumns,
});

describe('attack skill table columns', () => {
  test('uses a compact core set without DPS', () => {
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
      '技能總傷',
    ]);
    expect(titles).not.toContain('技能期間DPS');
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
});
