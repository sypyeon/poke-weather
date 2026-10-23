// 도시 이름 → 좌표 (Open-Meteo 지오코딩 API, 키 필요 없음)
export async function searchCity(query) {
  const params = new URLSearchParams({
    name: query,
    count: 5,
    language: 'ko',
  });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error(`지오코딩 API 오류: ${res.status}`);
  const data = await res.json();

  // 결과가 없으면 results 필드 자체가 없어요
  return (data.results || []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    // '광주, 경기도, 대한민국'처럼 구분할 수 있게 지역명까지 붙여요
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));
}

// Open-Meteo에서 현재 날씨 가져오기
export async function getWeather(lat, lon) {
  // URLSearchParams를 쓰면 ?a=1&b=2 같은 쿼리 문자열을 안전하게 만들어줘요
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min', // 오늘 최고/최저기온 (표시용)
    wind_speed_unit: 'ms',                          // 바람은 m/s로
    forecast_days: 1,
    timezone: 'auto',                               // current.time이 그 지역 시각으로 와요
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  // fetch는 404, 500 같은 에러 응답에도 '성공'으로 끝나요.
  // 그래서 res.ok로 직접 확인해야 해요.
  if (!res.ok) throw new Error(`날씨 API 오류: ${res.status}`);

  const data = await res.json();
  console.log('날씨 원본 응답:', data);

  // 필요한 값만 골라서 돌려줘요
  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    feelsLike: data.current.apparent_temperature,
    wind: data.current.wind_speed_10m,
    maxTemp: data.daily.temperature_2m_max[0],
    minTemp: data.daily.temperature_2m_min[0],
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time.slice(11, 16), // '2026-10-23T14:15' → '14:15'
  };
}

// Open-Meteo에서 현재 미세먼지 가져오기 (㎍/㎥)
export async function getAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'pm10,pm2_5',
  });
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  if (!res.ok) throw new Error(`미세먼지 API 오류: ${res.status}`);
  const data = await res.json();
  return {
    pm10: data.current.pm10,
    pm25: data.current.pm2_5,
  };
}
