import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const objectKeys = (source, startMarker, endMarker, indent = 2) => {
  const block = source.split(startMarker)[1]?.split(endMarker)[0] ?? '';
  const expression = new RegExp(`^ {${indent}}'([^']+)':`, 'gm');
  return [...block.matchAll(expression)].map((match) => match[1]);
};

const characterData = JSON.parse(read('public/json/character_table.json'));
const skillData = JSON.parse(read('public/json/skill_table.json'));
const skillRulesSource = read('src/model/skillEffectRules.js');
const skillCustomSource = read('src/model/SkillCustomCalculator.js');
const healingRulesSource = read('src/model/healingSkillEffectRules.js');
const talentRulesSource = read('src/model/talentEffectRules.js');
const overviewPath = 'docs/custom-key-reference/05-Custom適配案例總覽.txt';

const characters = Object.values(characterData);
const characterRank = new Map(characters.map((character, index) => [character.name, index]));
const skillRank = new Map();
characters.forEach((character) => {
  (character.skills ?? []).forEach(({ skillId }, index) => {
    const name = skillData[skillId]?.levels?.at(-1)?.name;
    if(name){
      skillRank.set(`${character.name}-${name}`, index);
    }
  });
});

const stableOrder = (names, rank) => names
  .map((name, index) => ({ name, index }))
  .sort((left, right) => (
    (rank(left.name) - rank(right.name)) || (left.index - right.index)
  ))
  .map(({ name }) => name);

const operatorOf = (caseName) => caseName.split('-')[0];
const skillRuleNames = objectKeys(
  skillRulesSource,
  'const skillEffectRuleFactories = {',
  '};\n\nconst emptyEffects'
);
const skillExcludedNames = objectKeys(
  skillCustomSource,
  'skillNotListToBasic: {',
  '  },\n\n  createSkillEffectRule',
  4
);
const skillRules = new Set(skillRuleNames);
const skillExclusions = new Set(skillExcludedNames);
const skillCases = stableOrder(
  [...new Set([...skillRuleNames, ...skillExcludedNames])],
  (name) => (
    (characterRank.get(operatorOf(name)) ?? Number.MAX_SAFE_INTEGER) * 100
    + (skillRank.get(name) ?? 99)
  )
);

const groupedSkills = new Map();
skillCases.forEach((caseName) => {
  const separator = caseName.indexOf('-');
  const operator = caseName.slice(0, separator);
  const skill = caseName.slice(separator + 1);
  const label = skillExclusions.has(caseName) && !skillRules.has(caseName)
    ? `${skill} [僅排除]`
    : skill;
  if(!groupedSkills.has(operator)) groupedSkills.set(operator, []);
  groupedSkills.get(operator).push(label);
});
const skillIndex = [...groupedSkills]
  .map(([operator, skills]) => `${operator}：${skills.join('、')}`)
  .join('\n');
const healingRuleNames = objectKeys(
  healingRulesSource,
  'const healingSkillEffectRuleFactories = {',
  '};\n\nconst HealingSkillEffectRulesModel'
);
const healingCases = stableOrder(
  healingRuleNames,
  (name) => (
    (characterRank.get(operatorOf(name)) ?? Number.MAX_SAFE_INTEGER) * 100
    + (skillRank.get(name) ?? 99)
  )
);
const groupedHealingSkills = new Map();
healingCases.forEach((caseName) => {
  const separator = caseName.indexOf('-');
  const operator = caseName.slice(0, separator);
  const skill = caseName.slice(separator + 1);
  if(!groupedHealingSkills.has(operator)) groupedHealingSkills.set(operator, []);
  groupedHealingSkills.get(operator).push(skill);
});
const healingSkillIndex = [...groupedHealingSkills]
  .map(([operator, skills]) => `${operator}：${skills.join('、')}`)
  .join('\n');

const talentRuleNames = objectKeys(
  talentRulesSource,
  'const talentEffectRuleFactories = {',
  '};\n\nexport const talentExcludedAttributes'
);
const talentExcludedNames = objectKeys(
  talentRulesSource,
  'export const talentExcludedAttributes = {',
  '};\n\nconst TalentEffectRulesModel'
);
const flatTalentNames = objectKeys(
  talentRulesSource,
  'const flatTalentRuleFactories = {',
  '};\n\nexport const resolveFlatTalentBonuses'
);
const orderedTalentRules = stableOrder(
  talentRuleNames,
  (name) => characterRank.get(name) ?? Number.MAX_SAFE_INTEGER
);
const talentRuleSet = new Set(talentRuleNames);
const orderedTalentExclusions = stableOrder(
  talentExcludedNames.filter((name) => !talentRuleSet.has(name)),
  (name) => characterRank.get(name) ?? Number.MAX_SAFE_INTEGER
);

const replaceSection = (source, startMarker, endMarker, content) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if(start < 0 || end < 0){
    throw new Error(`Cannot locate generated section: ${startMarker.trim()}`);
  }
  return `${source.slice(0, start + startMarker.length)}${content}\n\n${source.slice(end)}`;
};

const currentOverview = read(overviewPath);
let overview = currentOverview;
const talentOperatorCount = new Set([
  ...talentRuleNames,
  ...talentExcludedNames,
  ...flatTalentNames,
]).size;
overview = overview
  .replace(
    /- 技能 custom：.*$/m,
    `- 技能 custom：${skillCases.length} 個技能案例，${groupedSkills.size} 位幹員。`
  )
  .replace(
    /- 天賦 custom：.*$/m,
    `- 天賦 custom：${talentOperatorCount} 位幹員（${talentRuleNames.length} 位有明確效果規則；部分幹員同時也有錯誤 key 排除）。`
  );
overview = replaceSection(
  overview,
  '一、技能 Custom\n---------------\n\n',
  '技能 custom 目前處理的主要類型：',
  skillIndex
);
overview = replaceSection(
  overview,
  '二、治療 Custom\n---------------\n\n',
  '治療 custom 目前處理的主要類型：',
  healingSkillIndex
);
overview = replaceSection(
  overview,
  '有明確效果規則\n----------------\n',
  '固定值特殊規則',
  `\n${orderedTalentRules.join('、')}`
);
overview = replaceSection(
  overview,
  '僅排除錯誤原始 Key\n--------------------\n',
  '同時具有明確規則與排除項目的幹員',
  `\n${orderedTalentExclusions.join('、')}`
);
if(process.argv.includes('--check')){
  if(overview !== currentOverview){
    console.error(`${overviewPath} is out of date. Run npm run custom:docs.`);
    process.exitCode = 1;
  }
  else{
    console.log(`${overviewPath} is up to date.`);
  }
}
else{
  fs.writeFileSync(overviewPath, overview, 'utf8');
  console.log(`Updated ${overviewPath}`);
}

console.log(`Skills: ${skillCases.length}; healing skills: ${healingCases.length}; talent rules: ${orderedTalentRules.length}; talent-only exclusions: ${orderedTalentExclusions.length}`);
