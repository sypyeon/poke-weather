// 점수 계산 테스트 (v1 점수표 기준)
// 실행: npm test

import { describe, it, expect } from 'vitest';
import { classifyWeather, humidityScores, calcTypeScores, toShares, airGrade } from '../src/scoring/score.js';
import { bucketKey, buildBuckets, calcBucketWeights } from '../src/scoring/draw.js';

// 테스트용 가짜 포켓몬 n마리
const fake = (n, types) => Array.from({ length: n }, (_, i) => ({ id: i, ko: `${types}${i}`, types }));

describe('classifyWeather', () => {
  it('WMO 코드를 7개 분류로 나눈다', () => {
    expect(classifyWeather(0)).toBe('clear');
    expect(classifyWeather(3)).toBe('clouds');
    expect(classifyWeather(48)).toBe('fog');
    expect(classifyWeather(55)).toBe('drizzle');
    expect(classifyWeather(81)).toBe('rain');
    expect(classifyWeather(86)).toBe('snow');
    expect(classifyWeather(96)).toBe('thunderstorm');
  });

  it('표에 없는 코드는 흐림', () => {
    expect(classifyWeather(100)).toBe('clouds');
  });
});

describe('humidityScores', () => {
  it('습하면 물, 건조하면 땅·바위', () => {
    expect(humidityScores(60)).toEqual({ water: 1 });
    expect(humidityScores(100)).toEqual({ water: 5 });
    expect(humidityScores(50)).toEqual({});
    expect(humidityScores(40)).toEqual({ ground: 1, rock: 1 });
    expect(humidityScores(0)).toEqual({ ground: 5, rock: 5 });
  });
});

describe('calcTypeScores', () => {
  it('맑음 32°C 습도 50% → 풀 6, 불꽃 7', () => {
    expect(calcTypeScores('clear', 32, 50)).toEqual({ grass: 6, fire: 7 });
  });

  it('비 18°C 습도 95% → 물은 날씨와 습도 점수가 합쳐진다', () => {
    expect(calcTypeScores('rain', 18, 95)).toEqual({
      water: 14, normal: 3, fighting: 3, fairy: 3,
    });
  });

  it('눈 -2°C 습도 30% → 얼음 13, 땅·바위 2', () => {
    expect(calcTypeScores('snow', -2, 30)).toEqual({ ice: 13, ground: 2, rock: 2 });
  });
});

describe('airGrade', () => {
  it('PM10, PM2.5 중 더 나쁜 등급', () => {
    expect(airGrade(20, 10).grade).toBe('good');
    expect(airGrade(20, 40).grade).toBe('bad');       // PM2.5가 더 나쁨
    expect(airGrade(160, 10).grade).toBe('veryBad');  // PM10이 더 나쁨
  });

  it('경계값은 반올림 후 이하로 비교', () => {
    expect(airGrade(30.4, 15.4).grade).toBe('good');
    expect(airGrade(30.5, 0).grade).toBe('normal');
  });
});

describe('toShares', () => {
  it('합이 1이 되는 비율', () => {
    expect(toShares({ fire: 3, grass: 1 })).toEqual({ fire: 0.75, grass: 0.25 });
  });
});

describe('buildBuckets', () => {
  it('전설은 따로, 나머지는 정렬된 타입 이름으로 묶는다', () => {
    const { normal, legends } = buildBuckets([
      { id: 1, types: ['grass', 'poison'] },
      { id: 2, types: ['poison', 'grass'] },
      { id: 3, types: ['fire'], legend: true },
    ]);
    expect(Object.keys(normal)).toEqual(['grass+poison']);
    expect(normal['grass+poison']).toHaveLength(2);
    expect(legends.map((p) => p.id)).toEqual([3]);
  });

  it('bucketKey는 순서와 상관없이 같다', () => {
    expect(bucketKey(['water', 'fire'])).toBe(bucketKey(['fire', 'water']));
  });
});

describe('calcBucketWeights', () => {
  const weightOf = (result, key) => result.find((b) => b.key === key)?.weight;

  it('복합 묶음이 없으면 점수 높은 쪽 단일로 넘긴다', () => {
    const buckets = { fire: fake(25, ['fire']), grass: fake(3, ['grass']) };
    const result = calcBucketWeights({ fire: 3, grass: 1 }, buckets);
    expect(weightOf(result, 'fire')).toBeCloseTo(0.5625 + 0.375);
    // 3마리 묶음은 3/20만 남는다
    expect(weightOf(result, 'grass')).toBeCloseTo(0.0625 * (3 / 20));
  });

  it('복합 묶음이 있으면 2 × p1 × p2', () => {
    const buckets = {
      fire: fake(25, ['fire']),
      grass: fake(25, ['grass']),
      'fire+grass': fake(20, ['fire', 'grass']),
    };
    const result = calcBucketWeights({ fire: 3, grass: 1 }, buckets);
    expect(weightOf(result, 'fire')).toBeCloseTo(0.5625);
    expect(weightOf(result, 'grass')).toBeCloseTo(0.0625);
    expect(weightOf(result, 'fire+grass')).toBeCloseTo(0.375);
  });

  it('도감에 없는 타입은 결과에서 빠진다', () => {
    const result = calcBucketWeights({ fire: 1, dragon: 1 }, { fire: fake(20, ['fire']) });
    expect(result.map((b) => b.key)).toEqual(['fire']);
  });
});
