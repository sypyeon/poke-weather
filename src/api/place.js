// 현재 위치 (버튼을 눌렀을 때만 사용)
// 콜백 방식인 getCurrentPosition을 Promise로 감싸요
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 기능을 지원하지 않아요'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        name: '현재 위치',
      }),
      (err) => reject(err),
      {
        timeout: 5000,          // 5초만 기다려요
        maximumAge: 10 * 60000, // 10분 안에 받은 위치가 있으면 재사용
      }
    );
  });
}

// 좌표 → 지역 이름 (역지오코딩)
// Open-Meteo는 이 방향을 지원하지 않아서 BigDataCloud의 무료 API를 써요.
// 키는 필요 없고, '사용자 기기에서 위치를 받은 직후' 부르는 용도로 만들어진 API예요.
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    localityLanguage: 'ko',
  });
  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
  if (!res.ok) throw new Error(`역지오코딩 오류: ${res.status}`);
  const data = await res.json();

  // city가 비어 있는 경우가 있어서 locality로 대체해요
  // 예: '성남시, 경기도'
  const place = data.city || data.locality;
  return [place, data.principalSubdivision].filter(Boolean).join(', ');
}
