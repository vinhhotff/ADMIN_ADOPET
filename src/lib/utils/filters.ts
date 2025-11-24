export type SearchParams = Record<string, string | string[] | undefined>;

export function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function toISOStringOrNull(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function includesInsensitive(source: string | null | undefined, keyword: string | null | undefined) {
  if (!keyword) return true;
  if (!source) return false;
  return source.toLowerCase().includes(keyword.toLowerCase());
}

