/**
 * Symbol library — a curated catalog of pattern symbols drawn from multiple textile crafts.
 *
 * Each entry has:
 *   - id:          stable string used in CustomStitchMeta.symbolRef and SVG sprite (`<use href="#${id}">`)
 *   - labelPl/En:  human-readable names
 *   - keywords:    extra search tokens (Polish + English) for the picker filter
 *
 * Categories:
 *   - crochet-adv:   advanced crochet (CYC + Japanese-style)
 *   - knitting:      basic knitting symbols
 *   - cross-stitch:  embroidery cross-stitch
 *   - embroidery:    general hand embroidery
 *   - geometric:     basic geometric shapes
 *   - decorative:    decorative / motif symbols
 *
 * The corresponding SVG `<symbol id="…">` definitions live in src/icons/SvgSprite.tsx.
 * Adding a new entry here without a matching sprite will render an empty box —
 * keep the two in sync.
 */

export type LibraryCategoryId =
  | 'crochet-adv'
  | 'knitting'
  | 'cross-stitch'
  | 'embroidery'
  | 'geometric'
  | 'decorative';

export interface LibrarySymbol {
  id: string;
  category: LibraryCategoryId;
  labelPl: string;
  labelEn: string;
  /** Suggested code that the user can adopt as a shortcut (1-3 letters). */
  suggestedCode?: string;
  /** Extra Polish + English search tokens. */
  keywords?: readonly string[];
}

export interface LibraryCategory {
  id: LibraryCategoryId;
  labelPl: string;
  labelEn: string;
}

export const LIBRARY_CATEGORIES: readonly LibraryCategory[] = [
  { id: 'crochet-adv',  labelPl: 'Szydełkowanie zaawansowane', labelEn: 'Advanced crochet' },
  { id: 'knitting',     labelPl: 'Dziewiarstwo',               labelEn: 'Knitting' },
  { id: 'cross-stitch', labelPl: 'Haft krzyżykowy',            labelEn: 'Cross stitch' },
  { id: 'embroidery',   labelPl: 'Haft tradycyjny',            labelEn: 'Embroidery' },
  { id: 'geometric',    labelPl: 'Geometryczne',               labelEn: 'Geometric' },
  { id: 'decorative',   labelPl: 'Dekoracyjne',                labelEn: 'Decorative' },
] as const;

export const LIBRARY_SYMBOLS: readonly LibrarySymbol[] = [
  // ===== Advanced crochet =====
  { id: 'lib-fpdc',     category: 'crochet-adv', labelPl: 'słupek od przodu',   labelEn: 'front post double crochet', suggestedCode: 'FPdc', keywords: ['warkocz', 'cable', 'front post'] },
  { id: 'lib-bpdc',     category: 'crochet-adv', labelPl: 'słupek od tyłu',     labelEn: 'back post double crochet',  suggestedCode: 'BPdc', keywords: ['warkocz', 'cable', 'back post'] },
  { id: 'lib-fphdc',    category: 'crochet-adv', labelPl: 'półsłupek od przodu', labelEn: 'front post half double crochet', suggestedCode: 'FPh', keywords: [] },
  { id: 'lib-bphdc',    category: 'crochet-adv', labelPl: 'półsłupek od tyłu',  labelEn: 'back post half double crochet', suggestedCode: 'BPh', keywords: [] },
  { id: 'lib-trtr',     category: 'crochet-adv', labelPl: 'słupek poczwórny',   labelEn: 'triple treble crochet',     suggestedCode: 'trt', keywords: ['quadruple'] },
  { id: 'lib-picot',    category: 'crochet-adv', labelPl: 'pikotek',            labelEn: 'picot',                     suggestedCode: 'pic', keywords: ['ozdobne'] },
  { id: 'lib-magic',    category: 'crochet-adv', labelPl: 'kółko magiczne',     labelEn: 'magic ring',                suggestedCode: 'mr',  keywords: ['amigurumi', 'start'] },
  { id: 'lib-popcorn',  category: 'crochet-adv', labelPl: 'popcorn',            labelEn: 'popcorn stitch',            suggestedCode: 'pop', keywords: ['relief', 'puff'] },
  { id: 'lib-bobble',   category: 'crochet-adv', labelPl: 'bobel',              labelEn: 'bobble stitch',             suggestedCode: 'bo',  keywords: ['relief', 'puff'] },
  { id: 'lib-puff',     category: 'crochet-adv', labelPl: 'splot puff',         labelEn: 'puff stitch',               suggestedCode: 'pf',  keywords: ['relief'] },
  { id: 'lib-shell',    category: 'crochet-adv', labelPl: 'muszelka',           labelEn: 'shell stitch',              suggestedCode: 'sh',  keywords: ['fan'] },
  { id: 'lib-vstitch',  category: 'crochet-adv', labelPl: 'splot V',            labelEn: 'V stitch',                  suggestedCode: 'V',   keywords: [] },
  { id: 'lib-cluster3', category: 'crochet-adv', labelPl: 'klaster 3 słupków',  labelEn: '3-stitch cluster',          suggestedCode: 'cl3', keywords: ['cluster'] },
  { id: 'lib-cluster4', category: 'crochet-adv', labelPl: 'klaster 4 słupków',  labelEn: '4-stitch cluster',          suggestedCode: 'cl4', keywords: ['cluster'] },
  { id: 'lib-revsc',    category: 'crochet-adv', labelPl: 'półsłupek wsteczny', labelEn: 'reverse single crochet',    suggestedCode: 'rev', keywords: ['crab', 'rakowy'] },
  { id: 'lib-fsc',      category: 'crochet-adv', labelPl: 'fundament SC',       labelEn: 'foundation single crochet', suggestedCode: 'fsc', keywords: [] },
  { id: 'lib-fdc',      category: 'crochet-adv', labelPl: 'fundament DC',       labelEn: 'foundation double crochet', suggestedCode: 'fdc', keywords: [] },

  // ===== Knitting =====
  { id: 'lib-knit',     category: 'knitting', labelPl: 'oczko prawe',     labelEn: 'knit',         suggestedCode: 'k',   keywords: ['stockinette'] },
  { id: 'lib-purl',     category: 'knitting', labelPl: 'oczko lewe',      labelEn: 'purl',         suggestedCode: 'p',   keywords: [] },
  { id: 'lib-k2tog',    category: 'knitting', labelPl: '2 razem prawe',   labelEn: 'k2tog',        suggestedCode: 'k2t', keywords: ['decrease'] },
  { id: 'lib-ssk',      category: 'knitting', labelPl: 'ssk',             labelEn: 'slip slip knit', suggestedCode: 'ssk', keywords: ['decrease'] },
  { id: 'lib-yo',       category: 'knitting', labelPl: 'narzut',          labelEn: 'yarn over',    suggestedCode: 'yo',  keywords: ['lace'] },
  { id: 'lib-cableL',   category: 'knitting', labelPl: 'warkocz w lewo',  labelEn: 'cable left',   suggestedCode: 'cL',  keywords: ['cable'] },
  { id: 'lib-cableR',   category: 'knitting', labelPl: 'warkocz w prawo', labelEn: 'cable right',  suggestedCode: 'cR',  keywords: ['cable'] },

  // ===== Cross stitch =====
  { id: 'lib-xfull',    category: 'cross-stitch', labelPl: 'pełny krzyż',     labelEn: 'full cross',     suggestedCode: 'X',   keywords: ['krzyżyk'] },
  { id: 'lib-xhalf',    category: 'cross-stitch', labelPl: 'pół krzyż',       labelEn: 'half cross',     suggestedCode: 'hX',  keywords: [] },
  { id: 'lib-xquarter', category: 'cross-stitch', labelPl: 'ćwierć krzyż',    labelEn: 'quarter cross',  suggestedCode: 'qX',  keywords: [] },
  { id: 'lib-back',     category: 'cross-stitch', labelPl: 'ścieg za igłą',   labelEn: 'backstitch',     suggestedCode: 'bk',  keywords: [] },

  // ===== Embroidery =====
  { id: 'lib-chain',    category: 'embroidery', labelPl: 'łańcuszek hafciarski', labelEn: 'chain stitch',   suggestedCode: 'ch',  keywords: [] },
  { id: 'lib-french',   category: 'embroidery', labelPl: 'supełek francuski',    labelEn: 'french knot',    suggestedCode: 'fk',  keywords: ['knot'] },
  { id: 'lib-satin',    category: 'embroidery', labelPl: 'satyna',               labelEn: 'satin stitch',   suggestedCode: 'sat', keywords: [] },
  { id: 'lib-stem',     category: 'embroidery', labelPl: 'łodyga',               labelEn: 'stem stitch',    suggestedCode: 'st',  keywords: [] },

  // ===== Geometric =====
  { id: 'lib-circle',   category: 'geometric', labelPl: 'koło',         labelEn: 'circle',    suggestedCode: 'O',  keywords: [] },
  { id: 'lib-circleF',  category: 'geometric', labelPl: 'koło pełne',   labelEn: 'circle filled', suggestedCode: 'o', keywords: [] },
  { id: 'lib-square',   category: 'geometric', labelPl: 'kwadrat',      labelEn: 'square',    suggestedCode: 'sq', keywords: [] },
  { id: 'lib-squareF',  category: 'geometric', labelPl: 'kwadrat pełny', labelEn: 'square filled', suggestedCode: 'sq', keywords: [] },
  { id: 'lib-triangle', category: 'geometric', labelPl: 'trójkąt',      labelEn: 'triangle',  suggestedCode: 'tri', keywords: [] },
  { id: 'lib-diamond',  category: 'geometric', labelPl: 'romb',         labelEn: 'diamond',   suggestedCode: 'rh', keywords: [] },
  { id: 'lib-hex',      category: 'geometric', labelPl: 'sześciokąt',   labelEn: 'hexagon',   suggestedCode: 'hx', keywords: [] },
  { id: 'lib-star',     category: 'geometric', labelPl: 'gwiazda',      labelEn: 'star',      suggestedCode: 'st', keywords: ['gwiazdka'] },
  { id: 'lib-cross',    category: 'geometric', labelPl: 'krzyż',        labelEn: 'cross',     suggestedCode: 'X',  keywords: [] },
  { id: 'lib-plus',     category: 'geometric', labelPl: 'plus',         labelEn: 'plus',      suggestedCode: '+',  keywords: [] },

  // ===== Decorative =====
  { id: 'lib-heart',    category: 'decorative', labelPl: 'serduszko',  labelEn: 'heart',  suggestedCode: 'H', keywords: [] },
  { id: 'lib-flower',   category: 'decorative', labelPl: 'kwiatek',    labelEn: 'flower', suggestedCode: 'fl', keywords: [] },
  { id: 'lib-leaf',     category: 'decorative', labelPl: 'listek',     labelEn: 'leaf',   suggestedCode: 'lf', keywords: [] },
  { id: 'lib-snowflake',category: 'decorative', labelPl: 'śnieżynka',  labelEn: 'snowflake', suggestedCode: 'sn', keywords: [] },
  { id: 'lib-sun',      category: 'decorative', labelPl: 'słoneczko',  labelEn: 'sun',    suggestedCode: 'su', keywords: [] },
  { id: 'lib-moon',     category: 'decorative', labelPl: 'księżyc',    labelEn: 'moon',   suggestedCode: 'mn', keywords: [] },
  { id: 'lib-wave',     category: 'decorative', labelPl: 'fala',       labelEn: 'wave',   suggestedCode: 'wv', keywords: [] },
  { id: 'lib-dot',      category: 'decorative', labelPl: 'kropka',     labelEn: 'dot',    suggestedCode: '.',  keywords: [] },
] as const;

const SYMBOL_BY_ID: ReadonlyMap<string, LibrarySymbol> = new Map(
  LIBRARY_SYMBOLS.map((s) => [s.id, s] as const),
);

const VALID_IDS: ReadonlySet<string> = new Set(LIBRARY_SYMBOLS.map((s) => s.id));

export function findLibrarySymbol(id: string): LibrarySymbol | undefined {
  return SYMBOL_BY_ID.get(id);
}

export function isValidLibrarySymbolId(id: string): boolean {
  return VALID_IDS.has(id);
}

export function symbolsByCategory(category: LibraryCategoryId): readonly LibrarySymbol[] {
  return LIBRARY_SYMBOLS.filter((s) => s.category === category);
}

/**
 * Filter library symbols by free-text query against label and keywords.
 * Case-insensitive; matches against PL, EN, and keywords.
 */
export function searchLibrarySymbols(query: string): readonly LibrarySymbol[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return LIBRARY_SYMBOLS;
  return LIBRARY_SYMBOLS.filter((s) => {
    if (s.labelPl.toLowerCase().includes(q)) return true;
    if (s.labelEn.toLowerCase().includes(q)) return true;
    if (s.keywords && s.keywords.some((k) => k.toLowerCase().includes(q))) return true;
    if (s.suggestedCode && s.suggestedCode.toLowerCase().includes(q)) return true;
    return false;
  });
}
