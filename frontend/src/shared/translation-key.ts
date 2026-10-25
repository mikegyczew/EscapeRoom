export function translationKeyFor(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  }

  return `copy.${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
