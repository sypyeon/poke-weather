// 위치 저장/불러오기 (localStorage)
// 사생활 보호 모드 등에서는 localStorage가 에러를 낼 수 있어서 try/catch로 감싸요

const STORAGE_KEY = 'pokemon-weather:location';

export function loadSavedLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveLocation(location) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // 저장 못 해도 앱은 계속 동작해요
  }
}
