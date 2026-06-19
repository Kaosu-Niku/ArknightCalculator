const normalizeProbability = (value, fallback = 1) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const probability = value > 1 && value <= 100 ? value / 100 : value;
  return Math.min(1, Math.max(0, probability));
};

const expectedAdditive = (value, probability = 1) => {
  return value * normalizeProbability(probability);
};

const expectedMultiplier = (value, probability = 1) => {
  return 1 + ((value - 1) * normalizeProbability(probability));
};

const conditionalAdditive = (enabled, value, probability = 1) => {
  return enabled ? expectedAdditive(value, probability) : 0;
};

const conditionalMultiplier = (enabled, value, probability = 1) => {
  return enabled ? expectedMultiplier(value, probability) : 1;
};

export {
  conditionalAdditive,
  conditionalMultiplier,
  expectedAdditive,
  expectedMultiplier,
  normalizeProbability,
};
