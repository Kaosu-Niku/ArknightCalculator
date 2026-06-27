import SettingsStorageModel, { defaultSettings } from '../SettingsStorage';

describe('settings storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = 'type=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'rarity=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'memberName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  test('uses defaults and persists supported calculator settings', () => {
    expect(SettingsStorageModel.getAll()).toEqual(defaultSettings);

    SettingsStorageModel.update({
      enemyDef: '850',
      candidates: true,
      visibleSkillColumns: ['attackScale', 'ammo'],
      visibleHealingColumns: ['healScale', 'healTimes'],
      enemySkill: [{ damage: 999 }],
    });
    const restored = SettingsStorageModel.getAll();

    expect(restored.enemyDef).toBe(850);
    expect(restored.candidates).toBe(true);
    expect(restored.visibleSkillColumns).toEqual(['attackScale', 'ammo']);
    expect(restored.visibleHealingColumns).toEqual(['healScale', 'healTimes']);
    expect(restored).not.toHaveProperty('enemySkill');
  });

  test('migrates the existing phase, rarity and member cookies', () => {
    document.cookie = 'type=精二滿級; path=/';
    document.cookie = `rarity=${JSON.stringify({ ...defaultSettings.rarity, TIER_1: false })}; path=/`;
    document.cookie = 'memberName=维什戴尔; path=/';

    const migrated = SettingsStorageModel.getAll();

    expect(migrated.type).toBe('精二滿級');
    expect(migrated.rarity.TIER_1).toBe(false);
    expect(migrated.memberName).toBe('维什戴尔');
    expect(window.localStorage.getItem(SettingsStorageModel.storageKey)).not.toBeNull();
  });

  test('falls back safely when stored JSON is damaged', () => {
    window.localStorage.setItem(SettingsStorageModel.storageKey, '{broken');

    expect(SettingsStorageModel.getAll()).toEqual(defaultSettings);
  });

  test('normalizes invalid numeric settings without replacing legal zeroes', () => {
    SettingsStorageModel.update({
      enemyHp: 0,
      enemyDef: '',
      enemyRes: 120,
      enemySpd: 0,
    });

    const restored = SettingsStorageModel.getAll();
    expect(restored.enemyHp).toBe(0);
    expect(restored.enemyDef).toBe(defaultSettings.enemyDef);
    expect(restored.enemyRes).toBe(defaultSettings.enemyRes);
    expect(restored.enemySpd).toBe(defaultSettings.enemySpd);
  });

  test('persists only supported language values', () => {
    SettingsStorageModel.update({ language: 'zh-TW' });
    expect(SettingsStorageModel.get('language')).toBe('zh-TW');

    SettingsStorageModel.update({ language: 'en-US' });
    expect(SettingsStorageModel.get('language')).toBe(defaultSettings.language);
  });
});
