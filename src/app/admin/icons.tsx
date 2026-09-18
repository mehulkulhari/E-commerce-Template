/* Simple stroke icons for the admin nav and tables. Pure SVG, no client code. */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IcoDash = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-4H4zM13 8h7V4h-7z" /></svg>;
export const IcoBox = () => <svg viewBox="0 0 24 24" {...P}><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
export const IcoBag = () => <svg viewBox="0 0 24 24" {...P}><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
export const IcoTag = () => <svg viewBox="0 0 24 24" {...P}><path d="M3 12l9-9 9 9-9 9z" /><circle cx="9" cy="9" r="1.4" /></svg>;
export const IcoCog = () => <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>;
export const IcoOut = () => <svg viewBox="0 0 24 24" {...P}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9" /></svg>;
export const IcoPlus = () => <svg viewBox="0 0 24 24" {...P}><path d="M12 5v14M5 12h14" /></svg>;
export const IcoTrash = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>;
export const IcoStore = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6" /></svg>;
