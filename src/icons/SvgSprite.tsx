/**
 * Hidden SVG sprite — mounted once in <App>.
 * Components reference symbols via <svg><use href="#sym-XX" /></svg>
 * or <svg><use href="#ui-XX" /></svg>.
 */
export function SvgSprite() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {/* ===== CYC Crochet stitch symbols ===== */}

        <symbol id="sym-ch" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="4.5" ry="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </symbol>

        <symbol id="sym-slst" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="3" ry="5.5" fill="currentColor" />
        </symbol>

        <symbol id="sym-sc" viewBox="0 0 24 24">
          <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-hdc" viewBox="0 0 24 24">
          <line x1="5" y1="4" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-dc" viewBox="0 0 24 24">
          <line x1="5" y1="4" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-tr" viewBox="0 0 24 24">
          <line x1="5" y1="4" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-dtr" viewBox="0 0 24 24">
          <line x1="5" y1="3" x2="19" y2="3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="3" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-inc" viewBox="0 0 24 24">
          <line x1="6" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="6" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        <symbol id="sym-dec" viewBox="0 0 24 24">
          <line x1="6" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </symbol>

        {/* ===== UI icons (Lucide-inspired) ===== */}

        <symbol id="ui-file-new" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="12" x2="12" y2="18" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </symbol>

        <symbol id="ui-folder-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </symbol>

        <symbol id="ui-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </symbol>

        <symbol id="ui-export" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </symbol>

        <symbol id="ui-undo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 14 4 9 9 4" />
          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </symbol>

        <symbol id="ui-redo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 14 20 9 15 4" />
          <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
        </symbol>

        <symbol id="ui-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </symbol>

        <symbol id="ui-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </symbol>

        <symbol id="ui-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </symbol>

        <symbol id="ui-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </symbol>

        <symbol id="ui-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </symbol>

        <symbol id="ui-arrow-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </symbol>

        <symbol id="ui-corner-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 10 4 15 9 20" />
          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </symbol>

        <symbol id="ui-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </symbol>

        <symbol id="ui-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </symbol>

        <symbol id="ui-yarn-ball" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 9 C 8 14, 14 14, 20.5 9" />
          <path d="M3.5 15 C 8 10, 14 10, 20.5 15" />
          <path d="M9 3.5 C 14 8, 14 14, 9 20.5" />
          <path d="M15 3.5 C 10 8, 10 14, 15 20.5" />
        </symbol>

        <symbol id="ui-language" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </symbol>

        <symbol id="ui-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </symbol>

        <symbol id="ui-pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </symbol>

        <symbol id="ui-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </symbol>

        <symbol id="ui-keyboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="10" x2="6" y2="10.01" />
          <line x1="10" y1="10" x2="10" y2="10.01" />
          <line x1="14" y1="10" x2="14" y2="10.01" />
          <line x1="18" y1="10" x2="18" y2="10.01" />
          <line x1="6" y1="14" x2="6" y2="14.01" />
          <line x1="18" y1="14" x2="18" y2="14.01" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </symbol>

        {/* Welcome illustration */}
        <symbol id="illust-welcome" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="80" cy="120" r="42" />
          <path d="M48 100 C 70 130, 90 130, 112 100" />
          <path d="M48 140 C 70 110, 90 110, 112 140" />
          <path d="M70 80 C 95 110, 95 130, 70 160" />
          <path d="M90 80 C 65 110, 65 130, 90 160" />
          <path d="M120 90 Q 140 60, 155 50" />
          <line x1="155" y1="50" x2="180" y2="25" />
          <path d="M180 25 Q 188 20, 184 30" />
        </symbol>
      </defs>
    </svg>
  );
}
