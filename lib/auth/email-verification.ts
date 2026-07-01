export function normalizeEmailVerificationToken(value: string) {
  const token = value.replace(/\s/g, "");
  return /^[A-Za-z0-9_-]{6,128}$/.test(token) ? token : null;
}
