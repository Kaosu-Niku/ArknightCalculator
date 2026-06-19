import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const UPSTREAM_REPOSITORY = 'Kengxxiao/ArknightsGameData';
const UPSTREAM_DATA_PATH = 'zh_CN/gamedata/excel';
const DATA_FILES = [
  'character_table.json',
  'skill_table.json',
  'uniequip_table.json',
  'battle_equip_table.json',
];
const DATA_DIRECTORY = path.resolve('public/json');
const REPORT_PATH = path.resolve('.game-data-sync-report.md');
const dryRun = process.argv.includes('--dry-run');

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'ArknightCalculator-data-sync',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  return response.text();
};

const resolveUpstreamCommit = async () => {
  const requestedRef = process.env.UPSTREAM_REF || 'master';
  const apiUrl = `https://api.github.com/repos/${UPSTREAM_REPOSITORY}/commits/${requestedRef}`;
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const commit = JSON.parse(await fetchText(apiUrl, { headers }));
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 12),
    date: commit.commit?.committer?.date ?? 'unknown',
    url: commit.html_url,
  };
};

const getEntryDictionary = (file, data) =>
  file === 'uniequip_table.json' ? data.equipDict : data;

const compareDictionaries = (file, localData, remoteData) => {
  const local = getEntryDictionary(file, localData);
  const remote = getEntryDictionary(file, remoteData);
  const localIds = new Set(Object.keys(local));
  const remoteIds = new Set(Object.keys(remote));
  const added = [...remoteIds].filter((id) => !localIds.has(id));
  const removed = [...localIds].filter((id) => !remoteIds.has(id));
  let changed = 0;

  for (const id of localIds) {
    if (remoteIds.has(id) && JSON.stringify(local[id]) !== JSON.stringify(remote[id])) {
      changed += 1;
    }
  }

  return {
    localCount: localIds.size,
    remoteCount: remoteIds.size,
    added,
    removed,
    changed,
  };
};

const collectBlackboardKeys = (value, keys = new Set()) => {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => collectBlackboardKeys(item, keys));
    return keys;
  }

  if (Array.isArray(value.blackboard)) {
    value.blackboard.forEach((entry) => {
      if (typeof entry?.key === 'string' && entry.key) keys.add(entry.key);
    });
  }

  Object.values(value).forEach((item) => collectBlackboardKeys(item, keys));
  return keys;
};

const getPlayableCharacters = (characters) =>
  Object.entries(characters).filter(
    ([id, character]) =>
      id.startsWith('char_') &&
      !['TOKEN', 'TRAP'].includes(character.profession),
  );

const buildCalculationScope = (data) => {
  const characters = getPlayableCharacters(data['character_table.json']);
  const characterIds = new Set(characters.map(([id]) => id));
  const skillIds = new Set(
    characters.flatMap(([, character]) =>
      (character.skills || []).map((skill) => skill.skillId).filter(Boolean),
    ),
  );
  const equips = Object.entries(data['uniequip_table.json'].equipDict).filter(
    ([, equip]) => characterIds.has(equip.charId),
  );

  return {
    characters: Object.fromEntries(characters),
    skills: Object.fromEntries(
      [...skillIds]
        .filter((id) => data['skill_table.json'][id])
        .map((id) => [id, data['skill_table.json'][id]]),
    ),
    equips: Object.fromEntries(equips),
    battleEquips: Object.fromEntries(
      equips
        .filter(([id]) => data['battle_equip_table.json'][id])
        .map(([id]) => [id, data['battle_equip_table.json'][id]]),
    ),
  };
};

const formatCharacter = ([id, character]) =>
  `| ${id} | ${character.name || '-'} | ${character.rarity || '-'} | ${character.subProfessionId || '-'} | ${character.isNotObtainable ? 'No' : 'Yes'} |`;

const buildReport = ({ commit, comparisons, localData, remoteData, missingBranches }) => {
  const newCharacters = getPlayableCharacters(remoteData['character_table.json']).filter(
    ([id]) => !localData['character_table.json'][id],
  );
  const localKeys = collectBlackboardKeys(buildCalculationScope(localData));
  const remoteKeys = collectBlackboardKeys(buildCalculationScope(remoteData));
  const newKeys = [...remoteKeys].filter((key) => !localKeys.has(key)).sort();
  const lines = [
    '# Game data sync report',
    '',
    `- Upstream: [${UPSTREAM_REPOSITORY}@${commit.shortSha}](${commit.url})`,
    `- Commit date: ${commit.date}`,
    `- Mode: ${dryRun ? 'dry run' : 'update'}`,
    '',
    '## File summary',
    '',
    '| File | Local | Upstream | Added | Changed | Removed |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const file of DATA_FILES) {
    const result = comparisons[file];
    lines.push(
      `| ${file} | ${result.localCount} | ${result.remoteCount} | ${result.added.length} | ${result.changed} | ${result.removed.length} |`,
    );
  }

  lines.push('', '## New character records', '');
  if (newCharacters.length) {
    lines.push('| ID | Name | Rarity | Branch | Obtainable |', '| --- | --- | --- | --- | --- |');
    lines.push(...newCharacters.map(formatCharacter));
  } else {
    lines.push('No new character records.');
  }

  lines.push('', '## New blackboard keys', '');
  lines.push(newKeys.length ? newKeys.map((key) => `- \`${key}\``).join('\n') : 'No new blackboard keys.');

  lines.push('', '## Validation', '');
  lines.push(
    missingBranches.length
      ? `Unknown branches: ${missingBranches.map((id) => `\`${id}\``).join(', ')}`
      : 'All playable character branches are mapped in `subProfessionId.json`.',
  );

  return `${lines.join('\n')}\n`;
};

const main = async () => {
  const commit = await resolveUpstreamCommit();
  const localData = {};
  const remoteData = {};
  const remoteText = {};
  const comparisons = {};

  for (const file of DATA_FILES) {
    const localPath = path.join(DATA_DIRECTORY, file);
    localData[file] = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    const rawUrl = `https://raw.githubusercontent.com/${UPSTREAM_REPOSITORY}/${commit.sha}/${UPSTREAM_DATA_PATH}/${file}`;
    remoteText[file] = await fetchText(rawUrl);
    remoteData[file] = JSON.parse(remoteText[file]);
    comparisons[file] = compareDictionaries(file, localData[file], remoteData[file]);
  }

  const branchMappings = JSON.parse(
    fs.readFileSync(path.join(DATA_DIRECTORY, 'subProfessionId.json'), 'utf8'),
  );
  const missingBranches = [
    ...new Set(
      getPlayableCharacters(remoteData['character_table.json'])
        .map(([, character]) => character.subProfessionId)
        .filter((branch) => branch && !branchMappings[branch]),
    ),
  ].sort();

  const report = buildReport({
    commit,
    comparisons,
    localData,
    remoteData,
    missingBranches,
  });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  process.stdout.write(report);

  const shrinkingFiles = DATA_FILES.filter(
    (file) => comparisons[file].remoteCount < comparisons[file].localCount,
  );
  if (shrinkingFiles.length) {
    throw new Error(`Upstream data unexpectedly shrank: ${shrinkingFiles.join(', ')}`);
  }
  if (missingBranches.length) {
    throw new Error(`Map new branches before syncing: ${missingBranches.join(', ')}`);
  }

  if (!dryRun) {
    for (const file of DATA_FILES) {
      fs.writeFileSync(path.join(DATA_DIRECTORY, file), remoteText[file], 'utf8');
    }
  }
};

main().catch((error) => {
  console.error(`\nGame data sync failed: ${error.message}`);
  process.exitCode = 1;
});
