// 도감 데이터 읽기
//
// 도감 데이터(public/pokedex.json)는 scripts/build-pokedex.mjs로 미리 만들어 둔 파일이에요.
//   [{ "name": "vulpix-alola", "id": 10103, "ko": "식스테일 (알로라폼)", "types": ["ice"] }, ...]
// 그래서 포켓몬을 뽑을 때 PokeAPI를 부를 필요가 없어요.

import { buildBuckets } from './scoring/draw.js';

// BASE_URL: 개발 서버와 배포(/poke-weather/) 모두에서 맞는 경로를 만들어줘요
const POKEDEX_URL = `${import.meta.env.BASE_URL}pokedex.json`;

let bucketsPromise = null; // 한 번 읽은 파일은 다시 읽지 않아요

// 도감을 이미 읽기 시작했는지 (로딩 문구를 고를 때 써요)
export function isPokedexRequested() {
  return bucketsPromise !== null;
}

export function getBuckets() {
  if (!bucketsPromise) {
    bucketsPromise = fetch(POKEDEX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`pokedex.json을 못 읽었어요: ${res.status}`);
        return res.json();
      })
      .then(buildBuckets);
    // 실패하면 다음에 다시 시도할 수 있게 비워둬요
    bucketsPromise.catch(() => { bucketsPromise = null; });
  }
  return bucketsPromise;
}
