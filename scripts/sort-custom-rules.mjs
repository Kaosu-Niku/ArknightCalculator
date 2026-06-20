import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const characterData = JSON.parse(read('public/json/character_table.json'));
const skillData = JSON.parse(read('public/json/skill_table.json'));
const characters = Object.values(characterData);
const characterRank = new Map(characters.map((character, index) => [character.name, index]));
const skillRank = new Map();

characters.forEach((character) => {
  (character.skills ?? []).forEach(({ skillId }, index) => {
    const name = skillData[skillId]?.levels?.at(-1)?.name;
    if(name) skillRank.set(`${character.name}-${name}`, index);
  });
});

const operatorOf = (caseName) => caseName.split('-')[0];
const operatorOrder = (name) => characterRank.get(name) ?? Number.MAX_SAFE_INTEGER;
const skillOrder = (name) => (
  (operatorOrder(operatorOf(name)) * 100) + (skillRank.get(name) ?? 99)
);

const stableSort = (items, rank) => items
  .map((item, index) => ({ item, index }))
  .sort((left, right) => (
    (rank(left.item.name) - rank(right.item.name)) || (left.index - right.index)
  ))
  .map(({ item }) => item);

const sortPropertyBlock = (source, startMarker, endMarker, indent, rank) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if(start < 0 || end < 0) throw new Error(`Cannot find ${startMarker.trim()}`);

  const contentStart = start + startMarker.length;
  const block = source.slice(contentStart, end);
  const expression = new RegExp(`^ {${indent}}'([^']+)':`, 'gm');
  const matches = [...block.matchAll(expression)];
  if(!matches.length) return source;

  const entries = matches.map((match, index) => ({
    name: match[1],
    text: block.slice(match.index, matches[index + 1]?.index ?? block.length),
  }));
  const sortedBlock = block.slice(0, matches[0].index)
    + stableSort(entries, rank).map(({ text }) => text).join('');
  return source.slice(0, contentStart) + sortedBlock + source.slice(end);
};

const sortStringSet = (source, startMarker, endMarker, rank) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if(start < 0 || end < 0) throw new Error(`Cannot find ${startMarker.trim()}`);

  const contentStart = start + startMarker.length;
  const block = source.slice(contentStart, end);
  const entries = [...block.matchAll(/^  '([^']+)',\r?$/gm)]
    .map((match) => ({ name: match[1] }));
  const sortedBlock = `\n${stableSort(entries, rank)
    .map(({ name }) => `  '${name}',`)
    .join('\n')}\n`;
  return source.slice(0, contentStart) + sortedBlock + source.slice(end);
};

const updates = [];

let skillRules = read('src/model/skillEffectRules.js');
skillRules = sortPropertyBlock(
  skillRules,
  'const skillEffectRuleFactories = {',
  '};\n\nconst emptyEffects',
  2,
  skillOrder
);
skillRules = sortStringSet(
  skillRules,
  'const conditionalSkillEffects = new Set([',
  ']);\n\nconst SkillEffectRulesModel',
  skillOrder
);
updates.push(['src/model/skillEffectRules.js', skillRules]);

let skillCustom = read('src/model/SkillCustomCalculator.js');
skillCustom = sortPropertyBlock(
  skillCustom,
  'skillNotListToBasic: {',
  '  },\n\n  createSkillEffectRule',
  4,
  skillOrder
);
updates.push(['src/model/SkillCustomCalculator.js', skillCustom]);

let talentRules = read('src/model/talentEffectRules.js');
talentRules = sortPropertyBlock(
  talentRules,
  'const flatTalentRuleFactories = {',
  '};\n\nexport const resolveFlatTalentBonuses',
  2,
  operatorOrder
);
talentRules = sortPropertyBlock(
  talentRules,
  'const talentEffectRuleFactories = {',
  '};\n\nexport const talentExcludedAttributes',
  2,
  operatorOrder
);
talentRules = sortPropertyBlock(
  talentRules,
  'export const talentExcludedAttributes = {',
  '};\n\nconst TalentEffectRulesModel',
  2,
  operatorOrder
);
updates.push(['src/model/talentEffectRules.js', talentRules]);

const changed = updates.filter(([file, content]) => content !== read(file));
if(process.argv.includes('--check')){
  if(changed.length){
    console.error(`Custom rules are out of order: ${changed.map(([file]) => file).join(', ')}`);
    process.exitCode = 1;
  }
  else{
    console.log('Custom rules follow JSON data order.');
  }
}
else{
  changed.forEach(([file, content]) => fs.writeFileSync(file, content, 'utf8'));
  console.log(`Sorted ${changed.length} custom rule files.`);
}
