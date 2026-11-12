import "server-only";
import { isIP } from "node:net";

const DEVELOPMENT_BASE_URL = "http://localhost:3000";

export class QrPublicUrlConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrPublicUrlConfigurationError";
  }
}

function isPrivateIpv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  const [a, b, c] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();

  if (
    normalized === "::" ||
    normalized === "::1" ||
    /^[fcfd]/.test(normalized) || // unique-local fc00::/7
    /^fe[89ab]/.test(normalized) || // link-local fe80::/10
    normalized.startsWith("ff") // multicast is not a public site address
  ) {
    return true;
  }

  // URL normalizes IPv4-mapped IPv6 literals to hexadecimal groups.
  const mappedIpv4 = normalized.match(/^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/);
  if (mappedIpv4) {
    const first = Number.parseInt(mappedIpv4[1], 16);
    const second = Number.parseInt(mappedIpv4[2], 16);
    const hostV4 = [first >> 8, first & 255, second >> 8, second & 255].join(".");
    return isPrivateIpv4(hostV4);
  }

  return false;
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  if (isIP(host) === 4) return isPrivateIpv4(host);
  if (isIP(host) === 6) return isPrivateIpv6(host);

  return (
    !host.includes(".") ||
    [
      ".localhost",
      ".local",
      ".internal",
      ".lan",
      ".home",
      ".home.arpa",
      ".test",
      ".invalid",
      ".example",
      ".example.com",
      ".example.net",
      ".example.org",
      ".onion",
    ].some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
    )
  );
}

export function getQrPublicBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredUrl = process.env.QR_PUBLIC_BASE_URL?.trim();

  if (!configuredUrl) {
    if (isProduction) {
      throw new QrPublicUrlConfigurationError(
        "Falta configurar QR_PUBLIC_BASE_URL. Configura la URL HTTPS pública del sitio antes de generar códigos QR.",
      );
    }

    return DEVELOPMENT_BASE_URL;
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new QrPublicUrlConfigurationError(
      "QR_PUBLIC_BASE_URL debe ser una URL absoluta válida, por ejemplo http://localhost:3000 en desarrollo.",
    );
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new QrPublicUrlConfigurationError(
      "QR_PUBLIC_BASE_URL debe contener solo el origen del sitio, sin credenciales, ruta, parámetros ni fragmento.",
    );
  }

  if (isProduction && parsed.protocol !== "https:") {
    throw new QrPublicUrlConfigurationError(
      "En producción, QR_PUBLIC_BASE_URL debe usar HTTPS.",
    );
  }

  if (isProduction && isLocalHostname(parsed.hostname)) {
    throw new QrPublicUrlConfigurationError(
      "En producción, QR_PUBLIC_BASE_URL no puede apuntar a localhost, una IP privada ni un nombre de red local.",
    );
  }

  return parsed.origin;
}

export function getPublicQrUrl(code: string): string {
  const baseUrl = getQrPublicBaseUrl();
  return new URL(`/r/${encodeURIComponent(code)}`, baseUrl).toString();
}

// Los códigos de una tirada física quedan impresos y no se pueden corregir.
// Exigimos un origen de producción HTTPS explícito incluso al ejecutar en dev.
export function getPrintQrUrl(code: string): string {
  const configuredUrl = process.env.QR_PUBLIC_BASE_URL?.trim();
  if (!configuredUrl) {
    throw new QrPublicUrlConfigurationError(
      "Configura QR_PUBLIC_BASE_URL con el dominio HTTPS de producción antes de exportar un lote para impresión.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new QrPublicUrlConfigurationError(
      "QR_PUBLIC_BASE_URL debe ser un origen HTTPS válido para imprimir.",
    );
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash ||
    isLocalHostname(parsed.hostname)
  ) {
    throw new QrPublicUrlConfigurationError(
      "Los QR de impresión requieren un origen HTTPS público, sin rutas, credenciales ni parámetros.",
    );
  }

  return new URL(`/r/${encodeURIComponent(code)}`, parsed.origin).toString();
}
