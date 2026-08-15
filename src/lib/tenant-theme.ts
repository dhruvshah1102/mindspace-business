import type { OrganizationBranding } from '@/domain/types';

/** Tenant tokens that get overridden per-branding. Kept in one place so the
 * admin dark-mode toggle can cleanly undo/redo them (see below). */
const BRANDED_VARS = ['--ds-deep', '--ds-mint', '--ds-page'] as const;

let lastBranding: Partial<OrganizationBranding> | null | undefined = null;

/** Injects a tenant's brand tokens as CSS variables at runtime — swapping a
 * tenant's palette is one Firestore write, no rebuild. See implementation.md §9.
 *
 * These are applied as an *inline* style on <html>, which always wins over a
 * stylesheet rule regardless of specificity — including the
 * `html[data-admin-theme="dark"]` dark-surface override below. So branding is
 * only ever inlined while the admin surface is light; `setAdminTheme` removes
 * it going into dark and restores it coming back, instead of leaving a
 * light-mode surface color permanently pinned over the dark palette.
 */
export function applyTenantBranding(branding: Partial<OrganizationBranding> | null | undefined) {
  lastBranding = branding;
  if (getStoredAdminTheme() === 'dark') return; // dark palette owns these vars until toggled back
  inlineBranding(branding);
}

function inlineBranding(branding: Partial<OrganizationBranding> | null | undefined) {
  const root = document.documentElement;
  if (!branding) return;
  if (branding.primary) root.style.setProperty('--ds-deep', branding.primary);
  if (branding.accent) root.style.setProperty('--ds-mint', branding.accent);
  if (branding.surface) root.style.setProperty('--ds-page', branding.surface);
  if (branding.appName) document.title = branding.appName;
}

export function clearTenantBranding() {
  const root = document.documentElement;
  BRANDED_VARS.forEach((v) => root.style.removeProperty(v));
  document.title = 'MindSpace for Business';
  lastBranding = null;
}

export type AdminTheme = 'light' | 'dark';

export function setAdminTheme(theme: AdminTheme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    // Let the stylesheet's dark values win — an inlined light-mode surface
    // would otherwise out-rank them forever.
    BRANDED_VARS.forEach((v) => root.style.removeProperty(v));
    root.setAttribute('data-admin-theme', 'dark');
  } else {
    root.removeAttribute('data-admin-theme');
    inlineBranding(lastBranding);
  }
  localStorage.setItem('mfb.adminTheme', theme);
}

export function getStoredAdminTheme(): AdminTheme {
  return (localStorage.getItem('mfb.adminTheme') as AdminTheme) ?? 'light';
}
