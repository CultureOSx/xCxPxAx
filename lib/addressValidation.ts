type AddressValidationOptions = {
  required?: boolean;
  fieldLabel?: string;
  minLength?: number;
  maxLength?: number;
  requireStreetNumber?: boolean;
};

const DEFAULT_LABEL = 'Address';
const ADDRESS_ALLOWED_CHARS = /^[A-Za-z0-9\s,'./#()-]+$/;
const PLACE_ALLOWED_CHARS = /^[A-Za-z\s'.-]+$/;

export function normalizeAddressText(value: string | null | undefined): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function validateAddressLine(
  value: string | null | undefined,
  options: AddressValidationOptions = {},
): string | null {
  const label = options.fieldLabel ?? DEFAULT_LABEL;
  const required = options.required ?? false;
  const minLength = options.minLength ?? 6;
  const maxLength = options.maxLength ?? 140;
  const requireStreetNumber = options.requireStreetNumber ?? false;
  const normalized = normalizeAddressText(value);

  if (!normalized) {
    return required ? `${label} is required.` : null;
  }
  if (normalized.length < minLength) return `${label} is too short.`;
  if (normalized.length > maxLength) return `${label} is too long.`;
  if (!ADDRESS_ALLOWED_CHARS.test(normalized)) return `${label} contains invalid characters.`;

  if (requireStreetNumber) {
    const hasNumber = /\d/.test(normalized);
    const hasWord = /[A-Za-z]/.test(normalized);
    if (!hasNumber || !hasWord) return `${label} should include a street number and street name.`;
  }

  return null;
}

export function validatePlaceName(
  value: string | null | undefined,
  label: 'City' | 'State' | 'Country',
): string | null {
  const normalized = normalizeAddressText(value);
  if (!normalized) return `${label} is required.`;
  if (normalized.length < 2) return `${label} is too short.`;
  if (normalized.length > 80) return `${label} is too long.`;
  if (!PLACE_ALLOWED_CHARS.test(normalized)) return `${label} contains invalid characters.`;
  return null;
}
