// 화면 그리기: 날씨 카드, 포켓몬 카드

import { toShares } from '../scoring/score.js';
import { WEATHER_INFO, typeInfo, skyGradient, pokemonGradient } from './theme.js';

// 화면 요소들 (모듈 스크립트는 HTML을 다 읽은 뒤에 실행돼서 바로 찾을 수 있어요)
const $ = (id) => document.getElementById(id);

const wCard = $('w-card');
const wLocation = $('w-location');
const wTime = $('w-time');
const wTemp = $('w-temp');
const wLabel = $('w-label');
const wHilo = $('w-hilo');
const wFeels = $('w-feels');
const wHum = $('w-hum');
const wPm = $('w-pm');
const wPmValue = $('w-pm-value');
const wWind = $('w-wind');
const wBar = $('w-bar');
const wOdds = $('w-odds');
const wIcons = wCard.querySelectorAll('[data-icon]');

const pCard = $('p-card');
const pImage = $('p-image');
const pStatus = $('p-status');
const pName = $('p-name');
const pLegend = $('p-legend');
const pShiny = $('p-shiny');
const pTypes = $('p-types');
const rerollButton = $('reroll-button');

const NBSP = ' '; // 빈 줄도 높이를 유지하게
const EMPTY = '--';

// ---------- 날씨 카드 ----------

// 날씨 아이콘: 이름이 같은 것 하나만 보여줘요 (null이면 전부 숨김)
// <svg>에는 .hidden 속성이 없어서 hidden 속성을 직접 붙였다 뗐다 해요
function showIcon(name) {
  for (const icon of wIcons) icon.toggleAttribute('hidden', icon.dataset.icon !== name);
}

// 오늘 나타나는 타입: 비율 막대 + 범례 (높은 순)
function renderOdds(scores) {
  const shares = Object.entries(toShares(scores)).sort((a, b) => b[1] - a[1]);
  const segments = [];
  const items = [];

  for (const [type, share] of shares) {
    const info = typeInfo(type);
    const pct = `${Math.round(share * 100)}%`;

    const segment = document.createElement('div');
    segment.style.width = `${share * 100}%`;
    segment.style.background = info.light;
    segments.push(segment);

    const item = document.createElement('span');
    const dot = document.createElement('span');
    dot.className = 'odds-dot';
    dot.style.background = info.light;
    item.append(dot, `${info.label} ${pct}`);
    items.push(item);
  }

  wBar.replaceChildren(...segments);
  wOdds.replaceChildren(...items);
}

function renderAir(air) {
  if (!air) {
    wPm.textContent = EMPTY;
    wPmValue.textContent = '';
    return;
  }
  wPm.textContent = air.grade.label;
  wPmValue.textContent = `PM10 ${Math.round(air.pm10)} · PM2.5 ${Math.round(air.pm25)}`;
}

export function renderWeatherLoading(locationName) {
  wLocation.textContent = locationName;
  wTime.textContent = '';
  wTemp.textContent = '--°';
  wLabel.textContent = '불러오는 중';
  wHilo.textContent = NBSP;
  wFeels.textContent = EMPTY;
  wHum.textContent = EMPTY;
  wWind.textContent = EMPTY;
  renderAir(null);
  wBar.replaceChildren();
  wOdds.replaceChildren();
  showIcon(null);
}

// temp, humidity는 반올림한 값 / air는 못 받았으면 null
export function renderWeather({
  category, isDay, time, temp, humidity, feelsLike, wind, maxTemp, minTemp, air, scores,
}) {
  const info = WEATHER_INFO[category];

  wCard.style.background = skyGradient(category, isDay);
  // 맑은 밤에는 해 대신 달
  showIcon(info.icon === 'sun' && !isDay ? 'moon' : info.icon);

  wTime.textContent = `${isDay ? '낮' : '밤'} ${time}`;
  wTemp.textContent = `${temp}°`;
  wLabel.textContent = info.label;
  wHilo.textContent = `최고 ${Math.round(maxTemp)}° · 최저 ${Math.round(minTemp)}°`;
  wFeels.textContent = `${Math.round(feelsLike)}°`;
  wHum.textContent = `${humidity}%`;
  wWind.textContent = `${wind.toFixed(1)}m/s`;
  renderAir(air);
  renderOdds(scores);
}

export function renderWeatherError() {
  wLabel.textContent = '날씨 오류';
  wHilo.textContent = '날씨를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
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

// 타입 뱃지 만들기 (진한 타입색 알약)
function renderTypes(types) {
  const badges = types.map((type) => {
    const info = typeInfo(type);
    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = info.label;
    badge.style.background = info.dark;
    return badge;
  });
  pTypes.replaceChildren(...badges);
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
  pCard.style.background = pokemonGradient(pokemon.types);
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
