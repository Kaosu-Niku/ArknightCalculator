const permanentMarkers = [
  '持续时间无限',
  '持續時間無限',
  '状态和初始状态间切换',
  '狀態和初始狀態間切換',
];

const isPermanentSkill = (skillData) => {
  const description = skillData?.description ?? '';
  return permanentMarkers.some(marker => description.includes(marker));
};

export { isPermanentSkill };
