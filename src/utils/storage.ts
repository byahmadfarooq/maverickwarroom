const KEYS = {
  prospects: 'lbc_prospects',
  inbound: 'lbc_inbound',
  clients: 'lbc_clients',
  posts: 'lbc_posts',
  tasks: 'lbc_tasks',
  settings: 'lbc_settings',
} as const;

export function loadFromStorage<T>(key: keyof typeof KEYS, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: keyof typeof KEYS, data: T): void {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export function clearAllStorage(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    const raw = localStorage.getItem(key);
    data[name] = raw ? JSON.parse(raw) : null;
  });
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    Object.entries(KEYS).forEach(([name, key]) => {
      if (data[name] !== undefined && data[name] !== null) {
        localStorage.setItem(key, JSON.stringify(data[name]));
      }
    });
    return true;
  } catch {
    return false;
  }
}
