import { THEME_STORAGE_KEY } from './theme.types';

/**
 * Blocking snippet that applies the stored theme before first paint.
 *
 * Without this the page paints in light mode and then flips to dark once
 * Angular boots - a flash every single reload for dark-mode users. It has to
 * run synchronously in <head>, before any stylesheet paints, which is why it
 * is a raw string rather than app code.
 *
 * Keep it dependency-free and small; it is on the critical path.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem('${THEME_STORAGE_KEY}');
var t=s?JSON.parse(s):{};
var m=t.mode||'system';
var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
r.classList.toggle('dark',d);
r.dataset.accent=t.accent||'blue';
r.dataset.radius=t.radius||'md';
r.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;
