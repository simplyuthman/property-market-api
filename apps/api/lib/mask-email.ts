/**
 * Masks an email address to domain-only format (e.g. "***@example.com").
 * Used to ensure visitor email privacy across all public API viewing endpoints.
 */
export function maskEmail(email: string): string {
  if (!email) {
    return "***";
  }

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) {
    return "***";
  }

  const domain = email.slice(atIndex + 1);
  return `***@${domain}`;
}
