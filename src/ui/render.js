// 화면 그리기: 날씨 카드, 포켓몬 카드

import { toShares } from '../scoring/score.js';

// 화면 요소들 (모듈 스크립트는 HTML을 다 읽은 뒤에 실행돼서 바로 찾을 수 있어요)
const $ = (id) => document.getElementById(id);

const wLocation = $('w-location');
const wTemp = $('w-temp');
const wLabel = $('w-label');
const wHint = $('w-hint');
const wOdds = $('w-odds');

const pImage = $('p-image');
const pStatus = $('p-status');
const pName = $('p-name');
const pLegend = $('p-legend');
const pShiny = $('p-shiny');
const pTypes = $('p-types');
const rerollButton = $('reroll-button');

const NBSP = ' '; // 빈 줄도 높이를 유지하게

// 날씨 분류별 표시 이름과 테마 색(bg: 배경, accent: 날씨 블록)
const WEATHER_INFO = {
  clear:        { label: '맑음',   bg: '#FFF4E0', accent: '#C2410C' },
  clouds:       { label: '흐림',   bg: '#EEF0F3', accent: '#5B6472' },
  fog:          { label: '안개',   bg: '#F0EEF6', accent: '#5B4A8A' },
  drizzle:      { label: '이슬비', bg: '#E6F4EE', accent: '#2F7D5B' },
  rain:         { label: '비',     bg: '#E3F0FB', accent: '#1C6FB8' },
  snow:         { label: '눈',     bg: '#EEF7FA', accent: '#22708C' },
  thunderstorm: { label: '뇌우',   bg: '#FFF8D6', accent: '#8A6500' },
};

// 맑은 날 배경/블록 색 (현재 기온 기준)
const CLEAR_THEMES = [
  { below: 5,        bg: '#EAF4FB', accent: '#1F6C9E' },
  { below: 15,       bg: '#F5F0E6', accent: '#7A5C2E' },
  { below: 25,       bg: '#EEF6E4', accent: '#3F7A1F' },
  { below: Infinity, bg: '#FFF4E0', accent: '#C2410C' },
];

// 타입 한국어 이름과 뱃지 색 (흰 배경에서 잘 읽히는 진한 색)
const TYPE_INFO = {
  normal:   { label: '노말',   color: '#5B6472' },
  fire:     { label: '불꽃',   color: '#C2410C' },
  water:    { label: '물',     color: '#1C6FB8' },
  electric: { label: '전기',   color: '#8A6500' },
  grass:    { label: '풀',     color: '#2F7D5B' },
  ice:      { label: '얼음',   color: '#22708C' },
  fighting: { label: '격투',   color: '#A02C2C' },
  poison:   { label: '독',     color: '#7B3FA0' },
  ground:   { label: '땅',     color: '#8A5A1F' },
  flying:   { label: '비행',   color: '#5B5FA8' },
  psychic:  { label: '에스퍼', color: '#B0306A' },
  bug:      { label: '벌레',   color: '#5F7A12' },
  rock:     { label: '바위',   color: '#7A6A3A' },
  ghost:    { label: '고스트', color: '#5B4A8A' },
  dragon:   { label: '드래곤', color: '#4B3FB5' },
  dark:     { label: '악',     color: '#3F3A36' },
  steel:    { label: '강철',   color: '#4F6470' },
  fairy:    { label: '페어리', color: '#A63C7E' },
};

function typeLabel(type) {
  return TYPE_INFO[type] ? TYPE_INFO[type].label : type;
}

// 날씨 테마 적용: CSS 변수만 바꾸면 배경, 블록, 버튼 색이 다 바뀌어요
function applyTheme(theme) {
  document.body.style.setProperty('--bg', theme.bg);
  document.body.style.setProperty('--accent', theme.accent);
}

// 타입 비중 표시: '불꽃 47% · 풀 40% · 물 13%' (높은 순)
function formatShares(scores) {
  const shares = toShares(scores);
  return Object.entries(shares)
    .sort((a, b) => b[1] - a[1])
    .map(([type, share]) => `${typeLabel(type)} ${Math.round(share * 100)}%`)
    .join(' · ');
}

// ---------- 날씨 카드 ----------

export function renderWeatherLoading(locationName) {
  wLocation.textContent = locationName;
  wTemp.textContent = '--°';
  wLabel.textContent = '불러오는 중';
  wHint.textContent = NBSP;
  wOdds.textContent = NBSP;
}

// temp, humidity는 반올림한 값
export function renderWeather({ category, temp, humidity, maxTemp, minTemp, scores }) {
  const info = WEATHER_INFO[category];

  // 맑은 날은 기온에 따른 색, 나머지는 날씨 색
  applyTheme(category === 'clear' ? CLEAR_THEMES.find((t) => temp < t.below) : info);

  wTemp.textContent = `${temp}°`;
  wLabel.textContent = info.label;
  wHint.textContent =
    `최고 ${Math.round(maxTemp)}° · 최저 ${Math.round(minTemp)}° · 습도 ${humidity}%`;
  wOdds.textContent = `타입 비중  ${formatShares(scores)}`;
}

export function renderWeatherError() {
  wLabel.textContent = '날씨 오류';
  wHint.textContent = '날씨를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// ---------- 포켓몬 카드 ----------

// 스프라이트 주소: 도감 번호만 있으면 만들 수 있어요
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

// 시도할 이미지 주소를 순서대로 나열해요
//   이로치: 움직이는 이로치 → 정지 이로치 → (이로치 이미지가 없으면) 일반 이미지
//   일반:   움직이는 도트 → 정지 도트
function spriteUrls(id, shiny) {
  const normal = [
    `${SPRITES}/other/showdown/${id}.gif`,
    `${SPRITES}/${id}.png`,
  ];
  if (!shiny) return normal;
  return [
    `${SPRITES}/other/showdown/shiny/${id}.gif`,
    `${SPRITES}/shiny/${id}.png`,
    ...normal,
  ];
}

// 목록의 첫 주소부터 시도하고, 실패(404)하면 다음 주소로 넘어가요
function showSprite(id, alt, shiny) {
  const urls = spriteUrls(id, shiny);
  let index = 0;

  pImage.alt = alt;
  pImage.onerror = () => {
    index++;
    if (index < urls.length) {
      pImage.src = urls[index];
    } else {
      pImage.onerror = null; // 전부 실패하면 멈춰요 (무한 반복 방지)
    }
  };
  pImage.src = urls[0];
}

// 타입 뱃지 만들기
function renderTypes(types) {
  pTypes.replaceChildren();
  for (const type of types) {
    const info = TYPE_INFO[type] || { label: type, color: '#5B6472' };
    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = info.label;
    badge.style.color = info.color;
    pTypes.appendChild(badge);
  }
}

export function renderPokemonLoading(message) {
  rerollButton.disabled = true;
  pImage.removeAttribute('src');
  pStatus.textContent = message;
  pName.textContent = NBSP;
  pName.classList.remove('rainbow');
  pLegend.hidden = true;
  pShiny.hidden = true;
  renderTypes([]);
}

export function renderPokemon(pokemon, shiny) {
  showSprite(pokemon.id, shiny ? `${pokemon.ko} (이로치)` : pokemon.ko, shiny);
  pShiny.hidden = !shiny;
  pStatus.textContent = '';
  pName.textContent = pokemon.ko;
  pName.classList.toggle('rainbow', shiny); // 이로치면 무지개 이름
  pLegend.hidden = !pokemon.legend;
  renderTypes(pokemon.types);
}

export function renderPokemonError() {
  pStatus.textContent = '포켓몬을 찾지 못했어요';
}

// ---------- 다시 뽑기 버튼 ----------
// 이로치가 나오면 다시 뽑기 버튼을 잠깐 잠가요 (실수로 넘기지 않게)

const REROLL_LABEL = '다시 뽑기';
let lockTimer = null;

export function lockReroll(seconds) {
  let left = seconds;
  rerollButton.disabled = true;
  rerollButton.textContent = `${left}초 후 다시 뽑기`;

  // 1초마다 숫자를 줄이고, 0이 되면 풀어줘요
  lockTimer = setInterval(() => {
    left--;
    if (left > 0) {
      rerollButton.textContent = `${left}초 후 다시 뽑기`;
    } else {
      unlockReroll();
    }
  }, 1000);
}

export function unlockReroll() {
  clearInterval(lockTimer);
  lockTimer = null;
  rerollButton.disabled = false;
  rerollButton.textContent = REROLL_LABEL;
}

export function isRerollLocked() {
  return lockTimer !== null;
}
