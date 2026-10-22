// 앱 시작, 이벤트 연결

import './style.css';
import { loadSavedLocation, saveLocation } from './storage.js';
import { getCurrentPosition, reverseGeocode } from './api/place.js';
import { getWeather, searchCity } from './api/weather.js';
import { classifyWeather, calcTypeScores } from './scoring/score.js';
import { pickPokemon, rollShiny } from './scoring/draw.js';
import { getBuckets, isPokedexRequested } from './pokedex.js';
import {
  renderWeatherLoading, renderWeather, renderWeatherError,
  renderPokemonLoading, renderPokemon, renderPokemonError,
  lockReroll, unlockReroll, isRerollLocked,
} from './ui/render.js';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const gpsButton = document.getElementById('gps-button');
const rerollButton = document.getElementById('reroll-button');

// 저장된 위치가 없을 때 쓸 기본값 (서울 시청)
const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.978, name: '서울' };

// 주소 끝에 ?legend, ?shiny 를 붙이면 테스트용으로 항상 전설 이벤트 / 이로치가 나와요
const query = new URLSearchParams(window.location.search);
const FORCE_LEGEND = query.has('legend');
const FORCE_SHINY = query.has('shiny');

const SHINY_LOCK_SECONDS = 3;

// 지금 타입 점수 (다시 뽑기 버튼에서 사용)
let currentScores = null; // { fire: 7, grass: 6, water: 2 }

// 포켓몬만 다시 그리기
async function showPokemon(scores) {
  let shiny = false;

  // 잠금 중에 도시를 바꿔서 새로 뽑는 경우, 이전 카운트다운은 정리해요
  if (isRerollLocked()) unlockReroll();

  renderPokemonLoading(isPokedexRequested() ? '찾는 중...' : '도감 준비 중...');

  try {
    const buckets = await getBuckets();
    const pokemon = pickPokemon(scores, buckets, { forceLegend: FORCE_LEGEND });
    console.log('뽑힌 포켓몬:', pokemon);

    shiny = rollShiny(FORCE_SHINY);
    if (shiny) console.log('이로치 등장!');

    renderPokemon(pokemon, shiny);
  } catch (err) {
    console.error(err);
    renderPokemonError();
  } finally {
    if (shiny) lockReroll(SHINY_LOCK_SECONDS);
    else unlockReroll();
  }
}

// 위치를 받아서 날씨 → 포켓몬까지 화면에 그려요
async function showWeatherAndPokemon(location) {
  renderWeatherLoading(location.name);

  try {
    const weather = await getWeather(location.lat, location.lon);
    const category = classifyWeather(weather.code);
    console.log(`날씨 코드 ${weather.code} → ${category}`);

    // 화면에 보이는 숫자와 규칙 판단을 같은 값으로 맞춰요 (반올림)
    const temp = Math.round(weather.temperature);
    const humidity = Math.round(weather.humidity);
    const scores = calcTypeScores(category, temp, humidity);
    console.log('타입 점수:', scores);

    renderWeather({
      category, temp, humidity,
      maxTemp: weather.maxTemp,
      minTemp: weather.minTemp,
      scores,
    });

    currentScores = scores;
    await showPokemon(scores);
  } catch (err) {
    console.error(err);
    renderWeatherError();
  }
}

// ---------- 이벤트 ----------

// 위치를 고르면: 저장하고 → 검색 결과 지우고 → 다시 그리기
function selectLocation(location) {
  saveLocation(location);
  searchResults.replaceChildren();
  searchInput.value = '';
  showWeatherAndPokemon(location);
}

// 검색 결과 목록에 안내 문구 한 줄 보여주기
function showResultMessage(text) {
  const li = document.createElement('li');
  li.className = 'msg';
  li.textContent = text;
  searchResults.replaceChildren(li);
}

// 도시 검색
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // form 기본 동작(페이지 새로고침) 막기

  const text = searchInput.value.trim();
  if (!text) return;

  showResultMessage('검색 중...');
  try {
    const results = await searchCity(text);

    if (results.length === 0) {
      showResultMessage('결과가 없어요. 영어로도 검색해 보세요.');
      return;
    }

    // 결과마다 버튼을 만들어요.
    // 이름은 외부 데이터라 innerHTML 대신 textContent로 넣어요 (안전)
    searchResults.replaceChildren();
    for (const location of results) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = location.name;
      button.addEventListener('click', () => selectLocation(location));
      li.appendChild(button);
      searchResults.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    showResultMessage('검색에 실패했어요.');
  }
});

// 현재 위치 버튼
gpsButton.addEventListener('click', async () => {
  gpsButton.disabled = true;
  gpsButton.setAttribute('aria-label', '현재 위치 찾는 중');
  try {
    const location = await getCurrentPosition();

    // 지역 이름을 못 가져와도 날씨는 보여줘야 하니까 실패는 여기서 따로 잡아요
    try {
      const placeName = await reverseGeocode(location.lat, location.lon);
      if (placeName) location.name = placeName;
    } catch (err) {
      console.warn('지역 이름을 못 가져왔어요:', err.message);
    }

    selectLocation(location);
  } catch (err) {
    console.warn('위치를 못 가져왔어요:', err.message);
    showResultMessage('현재 위치를 찾지 못했어요. 도시 이름으로 검색해 주세요.');
  } finally {
    gpsButton.disabled = false;
    gpsButton.setAttribute('aria-label', '현재 위치');
  }
});

// 다시 뽑기: 날씨는 그대로, 포켓몬만 새로
rerollButton.addEventListener('click', () => {
  if (currentScores) showPokemon(currentScores);
});

// 앱 시작: 저장된 위치가 있으면 그걸, 없으면 서울로 바로 시작
showWeatherAndPokemon(loadSavedLocation() || DEFAULT_LOCATION);
