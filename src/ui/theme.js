// 화면 색·이름 데이터 (UI v2 시안 "하늘 + 타입 그라데이션")

// 날씨 분류별 이름, 아이콘, 하늘 그라데이션 [위, 아래]
// 이슬비는 시안에 없어서 비 색을 같이 써요
const RAIN_SKY = { day: ['#47627F', '#2C4560'], night: ['#263650', '#111A2B'] };

export const WEATHER_INFO = {
  clear:        { label: '맑음',   icon: 'sun',   sky: { day: ['#2F7CC4', '#1A5A9E'], night: ['#26326B', '#111838'] } },
  clouds:       { label: '흐림',   icon: 'cloud', sky: { day: ['#5E7487', '#3E5163'], night: ['#3A4556', '#1F2632'] } },
  fog:          { label: '안개',   icon: 'cloud', sky: { day: ['#6B7682', '#4A535E'], night: ['#3E4550', '#22272E'] } },
  drizzle:      { label: '이슬비', icon: 'rain',  sky: RAIN_SKY },
  rain:         { label: '비',     icon: 'rain',  sky: RAIN_SKY },
  snow:         { label: '눈',     icon: 'snow',  sky: { day: ['#5E809E', '#3D5F7E'], night: ['#33476A', '#1A2540'] } },
  thunderstorm: { label: '뇌우',   icon: 'bolt',  sky: { day: ['#45405F', '#26223A'], night: ['#2E2A45', '#151325'] } },
};

// 타입 한국어 이름과 색 (dark: 뱃지·카드 진한 쪽, light: 카드 밝은 쪽·비율 막대)
// ground, rock, dragon, dark의 밝은 색은 시안에 없어서 임시 값이에요
export const TYPE_INFO = {
  normal:   { label: '노말',   dark: '#5B6472', light: '#B9C0CA' },
  fire:     { label: '불꽃',   dark: '#C2410C', light: '#F5A15F' },
  water:    { label: '물',     dark: '#1C6FB8', light: '#6FB3EE' },
  electric: { label: '전기',   dark: '#8A6500', light: '#F4CF4F' },
  grass:    { label: '풀',     dark: '#2F7D5B', light: '#7CC48A' },
  ice:      { label: '얼음',   dark: '#22708C', light: '#9BDDE8' },
  fighting: { label: '격투',   dark: '#A02C2C', light: '#E07B6E' },
  poison:   { label: '독',     dark: '#7B3FA0', light: '#C08FDA' },
  ground:   { label: '땅',     dark: '#8A5A1F', light: '#D9B37A' }, // 임시
  flying:   { label: '비행',   dark: '#5B5FA8', light: '#A9B3F0' },
  psychic:  { label: '에스퍼', dark: '#B0306A', light: '#F08DB5' },
  bug:      { label: '벌레',   dark: '#5F7A12', light: '#B5CE5A' },
  rock:     { label: '바위',   dark: '#7A6A3A', light: '#CBBE8A' }, // 임시
  ghost:    { label: '고스트', dark: '#5B4A8A', light: '#A897D6' },
  dragon:   { label: '드래곤', dark: '#4B3FB5', light: '#9C92EE' }, // 임시
  dark:     { label: '악',     dark: '#3F3A36', light: '#9A918A' }, // 임시
  steel:    { label: '강철',   dark: '#4F6470', light: '#AFC0CA' },
  fairy:    { label: '페어리', dark: '#A63C7E', light: '#F2A9D3' },
};

const UNKNOWN_TYPE = { dark: '#5B6472', light: '#B9C0CA' };

export function typeInfo(type) {
  return TYPE_INFO[type] || { label: type, ...UNKNOWN_TYPE };
}

export function skyGradient(category, isDay) {
  const [top, bottom] = WEATHER_INFO[category].sky[isDay ? 'day' : 'night'];
  return `linear-gradient(170deg, ${top} 0%, ${bottom} 100%)`;
}

// 포켓몬 카드 배경
//   단일: 160deg, 밝은색 → 진한색
//   복합: 135deg, A밝은 0%, A진한 40%, B진한 60%, B밝은 100%
export function pokemonGradient(types) {
  const [a, b] = types.map(typeInfo);
  if (!b) return `linear-gradient(160deg, ${a.light} 0%, ${a.dark} 100%)`;
  return `linear-gradient(135deg, ${a.light} 0%, ${a.dark} 40%, ${b.dark} 60%, ${b.light} 100%)`;
}
