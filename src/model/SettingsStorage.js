const storageKey = 'arknights-calculator:settings:v1';

const defaultSettings = Object.freeze({
  language: 'zh-CN',
  type: '精零1級',
  rarity: {
    TIER_1: true,
    TIER_2: true,
    TIER_3: true,
    TIER_4: true,
    TIER_5: true,
    TIER_6: true,
  },
  enemyHp: 10000,
  enemyAttackType: '物傷',
  enemyAttack: 500,
  enemyDef: 0,
  enemyRes: 0,
  enemySpd: 1,
  candidates: false,
  visibleSkillColumns: [],
  visibleHealingColumns: [],
  memberName: '',
});

const phaseValues = new Set(['精零1級', '精零滿級', '精一1級', '精一滿級', '精二1級', '精二滿級']);
const enemyAttackTypes = new Set(['物傷', '法傷', '真傷']);
const languageValues = new Set(['zh-CN', 'zh-TW']);

const finiteNumber = (value, fallback, min = -Infinity, max = Infinity) => {
  if(value === ''){
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : fallback;
};

const readLegacyCookie = (name) => {
  if(typeof document === 'undefined'){
    return undefined;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find(item => item.startsWith(prefix));
  if(!cookie){
    return undefined;
  }

  const rawValue = cookie.slice(prefix.length);
  try{
    return JSON.parse(rawValue);
  }
  catch(error){
    return rawValue;
  }
};

const normalizeSettings = (settings = {}) => ({
  language: languageValues.has(settings.language)
    ? settings.language
    : defaultSettings.language,
  type: phaseValues.has(settings.type) ? settings.type : defaultSettings.type,
  rarity: Object.fromEntries(Object.entries(defaultSettings.rarity).map(([key, fallback]) => [
    key,
    typeof settings.rarity?.[key] === 'boolean' ? settings.rarity[key] : fallback,
  ])),
  enemyHp: finiteNumber(settings.enemyHp, defaultSettings.enemyHp, 0),
  enemyAttackType: enemyAttackTypes.has(settings.enemyAttackType)
    ? settings.enemyAttackType
    : defaultSettings.enemyAttackType,
  enemyAttack: finiteNumber(settings.enemyAttack, defaultSettings.enemyAttack, 0),
  enemyDef: finiteNumber(settings.enemyDef, defaultSettings.enemyDef, 0),
  enemyRes: finiteNumber(settings.enemyRes, defaultSettings.enemyRes, 0, 100),
  enemySpd: finiteNumber(settings.enemySpd, defaultSettings.enemySpd, 0.01),
  candidates: typeof settings.candidates === 'boolean'
    ? settings.candidates
    : defaultSettings.candidates,
  visibleSkillColumns: Array.isArray(settings.visibleSkillColumns)
    ? settings.visibleSkillColumns.filter(value => typeof value === 'string')
    : [],
  visibleHealingColumns: Array.isArray(settings.visibleHealingColumns)
    ? settings.visibleHealingColumns.filter(value => typeof value === 'string')
    : [],
  memberName: typeof settings.memberName === 'string'
    ? settings.memberName
    : defaultSettings.memberName,
});

const readStoredSettings = () => {
  if(typeof window === 'undefined'){
    return normalizeSettings();
  }

  try{
    const stored = window.localStorage.getItem(storageKey);
    if(stored){
      return normalizeSettings(JSON.parse(stored));
    }
  }
  catch(error){
    // Browsers may disable storage; defaults still keep the calculator usable.
  }

  return normalizeSettings({
    type: readLegacyCookie('type') ?? defaultSettings.type,
    rarity: readLegacyCookie('rarity') ?? defaultSettings.rarity,
    memberName: readLegacyCookie('memberName') ?? defaultSettings.memberName,
  });
};

const writeStoredSettings = (settings) => {
  if(typeof window === 'undefined'){
    return;
  }

  try{
    window.localStorage.setItem(storageKey, JSON.stringify(normalizeSettings(settings)));
  }
  catch(error){
    // A storage failure should never block calculations.
  }
};

const SettingsStorageModel = {
  storageKey,
  defaults: defaultSettings,

  getAll: () => {
    const settings = readStoredSettings();
    writeStoredSettings(settings);
    return settings;
  },

  get: (key) => SettingsStorageModel.getAll()[key],

  update: (values) => {
    const settings = normalizeSettings({
      ...readStoredSettings(),
      ...values,
    });
    writeStoredSettings(settings);
    return settings;
  },
};

export { defaultSettings };
export default SettingsStorageModel;
