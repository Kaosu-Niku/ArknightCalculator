const resolveAttackInterval = ({
  baseAttackTime,
  attackTimeRevision,
  talentAttackTimeRevision,
  attackSpeed,
  attackSpeedRevision,
  talentAttackSpeedRevision,
  traitAttackSpeedRevision,
}) => {
  return (baseAttackTime + attackTimeRevision + talentAttackTimeRevision)
    / ((attackSpeed
      + attackSpeedRevision
      + talentAttackSpeedRevision
      + traitAttackSpeedRevision) / 100);
};

const resolveAttackCount = (attackCount) => attackCount === 0 ? 1 : attackCount;

const resolveSkillDuration = (duration, durationOverride) => {
  const normalizedDuration = duration < 1 ? 1 : duration;
  return durationOverride ? durationOverride : normalizedDuration;
};

const resolveStreamInterval = (streamInterval, attackInterval) => {
  return streamInterval !== undefined && streamInterval !== 0
    ? streamInterval
    : attackInterval;
};

const resolveDamageStreamTotal = ({
  damage,
  interval,
  hitMultiplier = 1,
}, {
  attackCount,
  attackInterval,
  duration,
  times,
  ammoCount,
}) => {
  const damagePerAttack = (damage * hitMultiplier) * attackCount;

  // 明確段數優先於彈藥；兩者皆無時才依持續時間與間隔推算。
  if(times > 0){
    return damagePerAttack * times;
  }
  if(ammoCount > 0){
    return damagePerAttack * ammoCount;
  }
  if(duration === 1){
    return damagePerAttack;
  }

  return (damagePerAttack / resolveStreamInterval(interval, attackInterval))
    * duration;
};

const resolveTotalByStreams = (streams, schedule) => {
  return streams.reduce((total, stream) => {
    return total + resolveDamageStreamTotal(stream, schedule);
  }, 0);
};

const resolveDamageStreamRate = ({
  damage,
  interval,
  hitMultiplier = 1,
}, {
  attackCount,
  attackInterval,
}) => {
  const damagePerAttack = (damage * hitMultiplier) * attackCount;
  return damagePerAttack / resolveStreamInterval(interval, attackInterval);
};

const resolveDpsByStreams = (
  streams,
  schedule,
  total = resolveTotalByStreams(streams, schedule)
) => {

  if(schedule.times > 0){
    return total;
  }
  if(schedule.ammoCount > 0){
    const activeDuration = schedule.attackInterval * schedule.ammoCount;
    return activeDuration > 0 ? total / activeDuration : total;
  }
  if(schedule.isPermanent){
    return streams.reduce((sum, stream) => {
      return sum + resolveDamageStreamRate(stream, schedule);
    }, 0);
  }

  return total / schedule.duration;
};

export {
  resolveAttackInterval,
  resolveAttackCount,
  resolveSkillDuration,
  resolveDamageStreamTotal,
  resolveTotalByStreams,
  resolveDamageStreamRate,
  resolveDpsByStreams,
};
