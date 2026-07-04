export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  const normalized =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) :
    digits.length === 11 && digits.startsWith('0') ? digits.slice(1) :
    digits;
  return /^[6-9]\d{9}$/.test(normalized);
}
