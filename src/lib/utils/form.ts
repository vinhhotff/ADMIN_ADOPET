type FormValue = FormDataEntryValue | null;

export function getText(value: FormValue) {
  if (!value) return null;
  const result = String(value).trim();
  return result.length ? result : null;
}

export function getNumber(value: FormValue) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getBoolean(value: FormValue) {
  if (value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'available', 'active'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'unavailable'].includes(normalized)) return false;
  return null;
}

