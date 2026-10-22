// 출현 점수표 (v1)
//
// 점수 숫자는 전부 여기에만 있어요. 로직은 score.js, draw.js에 있어요.
// 점수를 바꿀 때는 이 파일만 고치면 돼요.

// 날씨 분류 → 타입 점수
// 비, 뇌우, 눈처럼 날씨가 뚜렷한 날은 점수를 크게 줘요
export const WEATHER_SCORES = {
  clear:        { grass: 6 },
  clouds:       { flying: 6 },
  fog:          { ghost: 6, psychic: 6 },
  drizzle:      { bug: 6 },
  rain:         { water: 10 },
  snow:         { ice: 10 },
  thunderstorm: { electric: 10 },
};

// 현재 기온 → 타입 점수
// 구간이 겹쳐도 돼요. 해당하는 구간의 타입이 전부 점수를 받아요.
// (from 이상, to 미만 / perDegree: from에서 1°C 오를 때마다 더하는 점수)
export const TEMP_RULES = [
  { to: 5,             types: ['ice'],                score: 3 },
  { from: 0,  to: 10,  types: ['steel'],              score: 3 },
  { from: 5,  to: 20,  types: ['normal', 'fighting'], score: 3 },
  { from: 15, to: 25,  types: ['fairy'],              score: 3 },
  { from: 20, to: 30,  types: ['grass'],              score: 3 },
  { from: 25, to: 30,  types: ['bug'],                score: 3 },
  // 불꽃: 30°에서 5점, 1°마다 +1점
  { from: 30,          types: ['fire'],               score: 5, perDegree: 1 },
];

// 습도 → 타입 점수
// 습함: wetFrom%에서 1점, step%마다 +1점 → 물
// 건조: dryTo%에서 1점, step% 내려갈 때마다 +1점 → 땅, 바위
export const HUMIDITY_RULES = {
  wetFrom: 60,
  wetTypes: ['water'],
  dryTo: 40,
  dryTypes: ['ground', 'rock'],
  step: 10,
};

// 묶음 크기 보정: 이 마릿수보다 적은 묶음은 그만큼 확률이 줄어요
// (2마리짜리 묶음 → 확률 10%만 남음)
export const FULL_BUCKET_SIZE = 20;

// 전설·환상 이벤트 확률 (일반 뽑기 전에)
export const LEGEND_RATE = 0.02;

// 이로치 확률 (뽑은 뒤에)
export const SHINY_RATE = 0.01;
