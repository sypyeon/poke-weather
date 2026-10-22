// 묶음 확률, 크기 보정, 전설/이로치 뽑기

import { FULL_BUCKET_SIZE, LEGEND_RATE, SHINY_RATE } from './config.js';
import { toShares } from './score.js';

// 배열에서 아무거나 하나 고르기
export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 가중치 랜덤: [{ weight, ... }] 중 weight에 비례해서 하나 고르기
export function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return items[items.length - 1]; // 소수점 오차 대비
}

// 묶음 이름: 'fire' 또는 'fire+grass' (알파벳 순으로 정렬해서 하나로 통일)
export function bucketKey(types) {
  return [...types].sort().join('+');
}

// 도감을 묶음별로 나눠요 (전설과 일반을 따로)
export function buildBuckets(pokedex) {
  const normal = {};
  const legends = [];
  for (const pokemon of pokedex) {
    if (pokemon.legend) {
      legends.push(pokemon);
      continue;
    }
    const key = bucketKey(pokemon.types);
    if (!normal[key]) normal[key] = [];
    normal[key].push(pokemon);
  }
  return { normal, legends };
}

// 점수 → 묶음별 확률
//
// 타입을 점수 비율대로 '두 번 뽑는다'고 생각해요.
//   같은 타입 두 번  → 단일 (확률 p²)
//   서로 다른 타입  → 복합 (확률 2 × p1 × p2)
// 복합인데 해당 포켓몬이 없으면 → 점수가 높은 쪽 단일로 넘겨요.
// 마지막으로 마릿수가 적은 묶음은 확률을 줄여요.
export function calcBucketWeights(scores, buckets) {
  const shares = toShares(scores);
  const types = Object.keys(shares);
  const weights = {};
  const add = (key, w) => {
    weights[key] = (weights[key] || 0) + w;
  };

  for (let i = 0; i < types.length; i++) {
    for (let j = i; j < types.length; j++) {
      const a = types[i];
      const b = types[j];
      if (a === b) {
        add(a, shares[a] * shares[a]);
        continue;
      }
      const w = 2 * shares[a] * shares[b];
      const key = bucketKey([a, b]);
      if (buckets[key]) add(key, w);
      else add(scores[a] >= scores[b] ? a : b, w); // 없는 조합 → 점수 높은 쪽 단일
    }
  }

  // 묶음 크기 보정 + 빈 묶음 제거
  const result = [];
  for (const [key, w] of Object.entries(weights)) {
    const members = buckets[key];
    if (!members) continue;
    const sizeFactor = Math.min(members.length, FULL_BUCKET_SIZE) / FULL_BUCKET_SIZE;
    result.push({ key, members, weight: w * sizeFactor });
  }
  return result;
}

// 포켓몬 한 마리 뽑기
// forceLegend: 테스트용으로 항상 전설 이벤트 발동 (?legend)
export function pickPokemon(scores, { normal, legends }, { forceLegend = false } = {}) {
  // 1) 전설 이벤트: 오늘 점수를 받은 타입만으로 이루어진 전설이 후보
  if (forceLegend || Math.random() < LEGEND_RATE) {
    const candidates = legends.filter((p) => p.types.every((t) => scores[t]));
    console.log(`전설 이벤트! 후보 ${candidates.length}마리`);
    if (candidates.length > 0) {
      return { ...randomItem(candidates), legend: true };
    }
  }

  // 2) 일반 뽑기: 묶음을 확률대로 고르고, 그 안에서 균등하게
  const bucketWeights = calcBucketWeights(scores, normal);
  if (bucketWeights.length === 0) throw new Error('후보 포켓몬이 없어요');

  const total = bucketWeights.reduce((sum, b) => sum + b.weight, 0);
  console.table(
    bucketWeights
      .map((b) => ({ 묶음: b.key, 마릿수: b.members.length, 확률: `${((b.weight / total) * 100).toFixed(1)}%` }))
      .sort((x, y) => parseFloat(y.확률) - parseFloat(x.확률))
  );

  const bucket = weightedPick(bucketWeights);
  return { ...randomItem(bucket.members), legend: false };
}

// 이로치 판정 (force: 테스트용으로 항상 이로치, ?shiny)
export function rollShiny(force = false) {
  return force || Math.random() < SHINY_RATE;
}
