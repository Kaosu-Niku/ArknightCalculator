import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readSource = (file) => fs.readFileSync(file, 'utf8');
const unique = (values) => [...new Set(values)];
const cleanDescription = (description) => String(description ?? '')
  .replace(/<[^>]+>/g, '')
  .replace(/\\n/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const objectKeys = (source, startMarker, endMarker, indent = 2) => {
  const block = source.split(startMarker)[1]?.split(endMarker)[0] ?? '';
  const expression = new RegExp(`^ {${indent}}'([^']+)':`, 'gm');
  return [...block.matchAll(expression)].map((match) => match[1]);
};

const characterData = readJson('public/json/character_table.json');
const skillData = readJson('public/json/skill_table.json');
const skillRuleSource = readSource('src/model/skillEffectRules.js');
const skillCustomSource = readSource('src/model/SkillCustomCalculator.js');
const talentRuleSource = readSource('src/model/talentEffectRules.js');

const skillRules = objectKeys(
  skillRuleSource,
  'const skillEffectRuleFactories = {',
  '};\n\nconst emptyEffects'
);
const excludedSkills = objectKeys(
  skillCustomSource,
  'skillNotListToBasic: {',
  '  },\n\n  createSkillEffectRule',
  4
);
const talentRules = objectKeys(
  talentRuleSource,
  'const talentEffectRuleFactories = {',
  '};\n\nexport const talentExcludedAttributes'
);
const excludedTalents = objectKeys(
  talentRuleSource,
  'export const talentExcludedAttributes = {',
  '};\n\nconst TalentEffectRulesModel'
);
const coveredSkills = new Set([...skillRules, ...excludedSkills]);
const coveredTalents = new Set([...talentRules, ...excludedTalents]);

const playableCharacters = Object.entries(characterData).filter(([id, character]) => (
  id.startsWith('char_')
  && !character.isNotObtainable
  && !['TOKEN', 'TRAP'].includes(character.profession)
  && character.rarity !== 'TIER_1'
  && character.skills?.length
));

const skillPatterns = {
  nonstandardDamageScale: (description, keys) => (
    /(物理|法术|真实)伤害/.test(description)
    && !keys.includes('atk_scale')
    && keys.some((key) => (
      (key.includes('atk_scale') || key.includes('damage_scale'))
      && !['atk_scale', 'damage_scale'].includes(key)
    ))
  ),
  multiHit: (description, keys) => (
    /(二连击|三连击|四连击|五连击|六连击|七连击|八连击|九连击|十连击|连续攻击|攻击(?:[2-9]|10|二|三|四|五|六|七|八|九|十)次|(?:[2-9]|10|二|三|四|五|六|七|八|九|十)次攻击)/.test(description)
    && !keys.includes('times')
  ),
  periodicDamage: (description) => (
    /(每秒|每0\.|每1秒|持续受到)/.test(description)
    && /(伤害|损伤)/.test(description)
  ),
  stopsAttacking: (description) => description.includes('停止攻击'),
  damageType: (description) => (
    /(伤害类型变为|造成法术伤害|造成物理伤害|真实伤害)/.test(description)
  ),
  stagedOrStacked: (description) => /(第二次|逐渐|达到最大|最多叠加)/.test(description),
};

const skillCandidates = [];
for (const [characterId, character] of playableCharacters) {
  for (const skillReference of character.skills) {
    const skill = skillData[skillReference.skillId];
    const level = skill?.levels?.at(-1);
    if (!level) continue;

    const checkName = `${character.name}-${level.name}`;
    if (coveredSkills.has(checkName)) continue;

    const description = cleanDescription(level.description);
    const keys = (level.blackboard ?? []).map((item) => item.key);
    const flags = Object.entries(skillPatterns)
      .filter(([, matches]) => matches(description, keys))
      .map(([flag]) => flag);
    if (!flags.length) continue;

    skillCandidates.push({
      characterId,
      operator: character.name,
      skillId: skillReference.skillId,
      skill: level.name,
      flags,
      duration: level.duration,
      blackboard: Object.fromEntries(
        (level.blackboard ?? []).map((item) => [item.key, item.value])
      ),
      description,
    });
  }
}

const talentPatterns = {
  conditionalStandardKey: (description, keys) => (
    keys.some((key) => [
      'atk', 'def', 'max_hp', 'attack_speed', 'damage_scale', 'atk_scale',
      'magic_resistance', 'base_attack_time',
    ].includes(key))
    && /(时|后|若|如果|生命|范围内|周围|概率|几率|部署|技能期间|受到|击倒|阻挡)/.test(description)
  ),
  stacked: (description, keys) => (
    keys.some((key) => /stack|cnt/.test(key))
    && /(叠加|每层|最多|逐渐)/.test(description)
  ),
  extraDamage: (description) => (
    /(额外造成|每秒造成|反弹|受到.*伤害|替身|召唤物)/.test(description)
    && /(物理|法术|真实|元素|损伤|伤害)/.test(description)
  ),
  teamBuff: (description) => /(所有|友方|其他.*干员|职业干员|编入队伍)/.test(description),
  probability: (description, keys) => (
    keys.some((key) => key.includes('prob')) || /(概率|几率)/.test(description)
  ),
};

const talentCandidates = [];
for (const [characterId, character] of playableCharacters) {
  if (coveredTalents.has(character.name)) continue;

  for (const talent of character.talents ?? []) {
    const candidate = talent.candidates?.at(-1);
    if (!candidate?.description) continue;
    const description = cleanDescription(candidate.description);
    const keys = (candidate.blackboard ?? []).map((item) => item.key);
    const flags = Object.entries(talentPatterns)
      .filter(([, matches]) => matches(description, keys))
      .map(([flag]) => flag);
    if (!flags.length) continue;

    talentCandidates.push({
      characterId,
      operator: character.name,
      talent: candidate.name,
      flags,
      blackboard: Object.fromEntries(
        (candidate.blackboard ?? []).map((item) => [item.key, item.value])
      ),
      description,
    });
  }
}

const flagCounts = (candidates) => candidates.reduce((counts, candidate) => {
  candidate.flags.forEach((flag) => {
    counts[flag] = (counts[flag] ?? 0) + 1;
  });
  return counts;
}, {});

const report = {
  summary: {
    playableOperators: playableCharacters.length,
    totalSkills: playableCharacters.reduce(
      (total, [, character]) => total + character.skills.length,
      0
    ),
    coveredSkillCases: coveredSkills.size,
    coveredTalentOperators: coveredTalents.size,
    skillCandidates: skillCandidates.length,
    talentCandidates: talentCandidates.length,
    skillFlagCounts: flagCounts(skillCandidates),
    talentFlagCounts: flagCounts(talentCandidates),
  },
  skillCandidates,
  talentCandidates,
};

if (process.argv.includes('--summary')) {
  console.log(JSON.stringify(report.summary, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}
