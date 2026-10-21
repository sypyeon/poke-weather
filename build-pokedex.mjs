// 도감 데이터(pokedex.json) 만들기
// 사용법: 이 폴더에서  node build-pokedex.mjs   (Node 18 이상)
//
// PokeAPI에 요청을 1,000번 정도 보내서 필요한 정보만 뽑아 파일 하나로 저장해요.
// 한 번만 돌리면 되고, 새 포켓몬이 나왔을 때만 다시 돌리면 돼요.
// PokeAPI 공정 사용 정책을 지키려고 동시에 10개까지만 요청해요.

import { writeFile } from 'node:fs/promises';

const API = 'https://pokeapi.co/api/v2';
const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];
const FORM_LABELS = { alola: '알로라', galar: '가라르', hisui: '히스이', paldea: '팔데아' };
const CONCURRENCY = 10;

// 실패하면 잠깐 쉬었다가 최대 3번 다시 시도
async function getJSON(url, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// items를 limit개씩 동시에 처리하기 (Promise.all에 동시 실행 개수 제한을 건 버전)
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// '.../pokemon/25/' → 25
function idFromUrl(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

// 메가진화, 거다이맥스, 토템 폼은 빼요
function isNormalForm(name) {
  return !/-(mega|gmax|totem)/.test(name);
}

async function main() {
  console.log('1/3 타입 목록 받는 중');
  const typeLists = await mapLimit(TYPES, CONCURRENCY, (t) => getJSON(`${API}/type/${t}`));

  // { charizard: ['fire', 'flying'], ... }  slot 순서(1번 타입, 2번 타입)를 지켜요
  const typeTable = {};
  TYPES.forEach((type, i) => {
    for (const entry of typeLists[i].pokemon) {
      const name = entry.pokemon.name;
      if (!typeTable[name]) typeTable[name] = [];
      typeTable[name][entry.slot - 1] = type;
    }
  });

  console.log('2/3 종 목록 받는 중');
  const speciesIndex = await getJSON(`${API}/pokemon-species?limit=10000`);

  console.log(`3/3 종 상세 받는 중 (${speciesIndex.results.length}개, 몇 분 걸려요)`);
  const speciesList = await mapLimit(speciesIndex.results, CONCURRENCY, (s) => getJSON(s.url));

  const pokedex = [];
  for (const species of speciesList) {
    const koEntry = species.names.find((n) => n.language.name === 'ko');
    const ko = koEntry ? koEntry.name : species.name;

    // varieties: 이 종에 속한 모든 폼 (식스테일 → vulpix, vulpix-alola)
    for (const variety of species.varieties) {
      const name = variety.pokemon.name;
      if (!isNormalForm(name)) continue;

      const types = (typeTable[name] || []).filter(Boolean);
      if (types.length === 0) continue;

      const form = Object.keys(FORM_LABELS).find((key) => name.includes(`-${key}`));
      pokedex.push({
        name,
        id: idFromUrl(variety.pokemon.url),
        ko: form ? `${ko} (${FORM_LABELS[form]}폼)` : ko,
        types,
      });
    }
  }

  pokedex.sort((a, b) => a.id - b.id);

  // 한 줄에 한 마리씩 저장 → git에서 변경 내역 보기 편해요
  const text = '[\n' + pokedex.map((p) => JSON.stringify(p)).join(',\n') + '\n]\n';
  await writeFile('pokedex.json', text);
  console.log(`완료: ${pokedex.length}마리 → pokedex.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
