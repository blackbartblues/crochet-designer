/** Static "recent patterns" used in the welcome screen mockup. */
export interface SampleRecent {
  id: string;
  name: string;
  meta: string;
  thumbCss: string; // raw CSS for the thumbnail background
}

export const SAMPLE_RECENTS: readonly SampleRecent[] = [
  {
    id: 'czapka',
    name: 'Czapka zimowa',
    meta: '28 × 14 oczek · zmieniony 3 dni temu',
    thumbCss: `repeating-linear-gradient(45deg,
      var(--yarn-cream) 0, var(--yarn-cream) 10px,
      var(--yarn-pink) 10px, var(--yarn-pink) 20px)`,
  },
  {
    id: 'biezniki',
    name: 'Bieżnik na stół',
    meta: '42 × 6 oczek · zmieniony tydzień temu',
    thumbCss: `repeating-linear-gradient(0deg,
      var(--yarn-cream) 0, var(--yarn-cream) 8px,
      var(--yarn-sage) 8px, var(--yarn-sage) 12px,
      var(--yarn-cream) 12px, var(--yarn-cream) 24px,
      var(--yarn-mustard) 24px, var(--yarn-mustard) 28px)`,
  },
  {
    id: 'kocyk',
    name: 'Kocyk dla Zosi',
    meta: '36 × 24 oczek · zmieniony miesiąc temu',
    thumbCss: `radial-gradient(circle at 30% 30%, var(--yarn-pink) 20%, transparent 22%),
      radial-gradient(circle at 70% 70%, var(--yarn-pink) 20%, transparent 22%),
      repeating-linear-gradient(90deg,
        var(--yarn-cream) 0, var(--yarn-cream) 12px,
        var(--bg-sunken) 12px, var(--bg-sunken) 13px),
      var(--yarn-cream)`,
  },
];
