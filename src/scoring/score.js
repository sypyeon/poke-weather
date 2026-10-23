// 조건 → 타입 점수 (순수 함수만 있어요. 테스트하기 쉽게)
//
// 날씨, 기온, 습도가 각각 타입에 점수를 줘요.
// 점수를 다 더한 다음 비율(%)로 바꿔서 뽑기 확률로 써요.

import { WEATHER_SCORES, TEMP_RULES, HUMIDITY_RULES, AIR_GRADES } from './config.js';

// 미세먼지 등급: PM10, PM2.5 중 더 나쁜 쪽 (값은 반올림해서 비교)
export function airGrade(pm10, pm25) {
  const index = (key, value) => AIR_GRADES.findIndex((g) => Math.round(value) <= g[key]);
  return AIR_GRADES[Math.max(index('pm10', pm10), index('pm25', pm25))];
}

// WMO 날씨 코드 → 우리 앱의 날씨 분류
export function classifyWeather(code) {
  if (code <= 1) return 'clear';                       // 0, 1
  if (code <= 3) return 'clouds';                      // 2, 3
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';         // 소나기
  if (code >= 85 && code <= 86) return 'snow';         // 눈 소나기
  if (code >= 95 && code <= 99) return 'thunderstorm';

  // 표에 없는 코드가 오면 앱이 멈추지 않게 흐림으로 처리
  console.warn('알 수 없는 날씨 코드:', code);
  return 'clouds';
}

export function humidityScores(humidity) {
  const { wetFrom, wetTypes, dryTo, dryTypes, step } = HUMIDITY_RULES;
  let types = [];
  let score = 0;
  if (humidity >= wetFrom) {
    types = wetTypes;
    score = 1 + Math.floor((humidity - wetFrom) / step);
  } else if (humidity <= dryTo) {
    types = dryTypes;
    score = 1 + Math.floor((dryTo - humidity) / step);
  }
  return Object.fromEntries(types.map((type) => [type, score]));
}

// 모든 조건의 점수를 합쳐요 → { fire: 7, grass: 6, water: 2 }
// temp, humidity는 화면에 보이는 값과 같게 반올림해서 넣어요
export function calcTypeScores(category, temp, humidity) {
  const scores = {};
  const add = (type, score) => {
    scores[type] = (scores[type] || 0) + score;
  };

  for (const [type, score] of Object.entries(WEATHER_SCORES[category])) {
    add(type, score);
  }
  for (const rule of TEMP_RULES) {
    const from = rule.from ?? -Infinity;
    const to = rule.to ?? Infinity;
    if (temp < from || temp >= to) continue;
    const score = rule.perDegree ? rule.score + rule.perDegree * (temp - from) : rule.score;
    for (const type of rule.types) add(type, score);
  }
  for (const [type, score] of Object.entries(humidityScores(humidity))) {
    add(type, score);
  }
  return scores;
}

// 점수 → 비율 (합이 1이 되게)
export function toShares(scores) {
  const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const shares = {};
  for (const [type, score] of Object.entries(scores)) shares[type] = score / total;
  return shares;
}
