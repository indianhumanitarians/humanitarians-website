export function normalizePhone(value) {
  return typeof value === 'string' && /^\d{10}$/.test(value) ? value : null;
}

export function registrationLookupPhone(value) {
  if (typeof value !== 'string') return null;
  if (/^\+91\d{10}$/.test(value)) return value.slice(3);
  // The supplied export also contains an Australian mobile. Its domestic
  // 10-digit format starts with 0; retain that registration without a country selector.
  if (/^\+614\d{8}$/.test(value)) return '0' + value.slice(3);
  return normalizePhone(value);
}

export async function claimLookupSlot(storage, key, now = Date.now()) {
  // Storage INSERT is atomic across edge instances. Never use upsert for these slots.
  const window = Math.floor(now / (15 * 60 * 1000));
  for (let slot = 0; slot < 10; slot++) {
    const result = await storage(`limits/${window}/${key}/${slot}.json`, '{}');
    if (result === 'created') return true;
    if (result !== 'exists') throw new Error('Rate limit storage unavailable');
  }
  return false;
}
