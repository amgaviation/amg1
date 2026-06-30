export function normalizeEmailVerificationToken(value: string) {
  const token = value.replace(/\s/g, "");
  return /^\d{6}$/.test(token) ? token : null;
}
