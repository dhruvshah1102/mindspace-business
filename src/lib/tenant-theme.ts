import type { OrganizationBranding } from '@/domain/types';

/** Injects a tenant's brand tokens as CSS variables at runtime — swapping a
 * tenant's palette is one Firestore write, no rebuild. See implementation.md §9. */
export function applyTenantBranding(branding: Partial<OrganizationBranding> | null | undefined) {
  const root = document.documentElement;
  if (!branding) return;
  if (branding.primary) root.style.setProperty('--ds-deep', branding.primary);
  if (branding.accent) root.style.setProperty('--ds-mint', branding.accent);
  if (branding.surface) root.style.setProperty('--ds-page', branding.surface);
  if (branding.appName) document.title = branding.appName;
}

export function clearTenantBranding() {
  const root = document.documentElement;
  ['--ds-deep', '--ds-mint', '--ds-page'].forEach((v) => root.style.removeProperty(v));
  document.title = 'MindSpace for Business';
}

export type AdminTheme = 'light' | 'dark';

export function setAdminTheme(theme: AdminTheme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-admin-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-admin-theme');
  }
  localStorage.setItem('mfb.adminTheme', theme);
}

export function getStoredAdminTheme(): AdminTheme {
  return (localStorage.getItem('mfb.adminTheme') as AdminTheme) ?? 'light';
}
