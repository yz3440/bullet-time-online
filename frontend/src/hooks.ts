import { signal } from '@preact/signals';

const MOBILE_BREAKPOINT = 768;
export const isMobile = signal(window.innerWidth < MOBILE_BREAKPOINT);

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  });
}
