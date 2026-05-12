import type { SpecialStitchesSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { newId } from '../../utils/id';
import type { CustomStitch } from '../../domain/graph/types';

interface Props {
  section: SpecialStitchesSection;
}

function emptyCustomStitch(): CustomStitch {
  return {
    id: newId(),
    shortCode: 'HC',
    nameByLanguage: { pl: 'Pęczek kapturowy', en: 'Hood cluster' },
    description: {
      pl: 'Narzuć włóczkę na szydełko, wkłuj w następne oczko, wyciągnij pętelkę (3 pętle). Wkłuj w kolejne oczko, wyciągnij pętelkę (4 pętle). Przeciągnij włóczkę przez wszystkie 4 pętle.',
      en: 'Yarn over, insert hook in next stitch, draw up a loop (3 loops). Insert hook in following stitch, draw up a loop (4 loops). Draw yarn through all 4 loops on hook.',
    },
    symbol: { kind: 'preset', presetId: 'shell' },
  };
}

export function SpecialStitchesSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);

  function addEntry() {
    update({ ...section, entries: [...section.entries, { stitch: emptyCustomStitch(), photos: [] }] });
  }
  function removeEntry(id: string) {
    update({ ...section, entries: section.entries.filter((e) => e.stitch.id !== id) });
  }
  function updateEntry(id: string, patch: Partial<CustomStitch>) {
    update({
      ...section,
      entries: section.entries.map((e) =>
        e.stitch.id === id ? { ...e, stitch: { ...e.stitch, ...patch } } : e,
      ),
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Special Stitches</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading}
          onChange={(e) => update({ ...section, heading: e.target.value })}
        />
      </label>
      {section.entries.map((entry) => (
        <fieldset key={entry.stitch.id} style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
          <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>
            {entry.stitch.shortCode} — {entry.stitch.nameByLanguage.en}
          </legend>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Short code
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.shortCode}
              onChange={(e) => updateEntry(entry.stitch.id, { shortCode: e.target.value })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Name (EN)
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.nameByLanguage.en}
              onChange={(e) => updateEntry(entry.stitch.id, { nameByLanguage: { pl: entry.stitch.nameByLanguage.pl, en: e.target.value } })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Name (PL)
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.nameByLanguage.pl}
              onChange={(e) => updateEntry(entry.stitch.id, { nameByLanguage: { pl: e.target.value, en: entry.stitch.nameByLanguage.en } })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Description (EN)
            <textarea
              style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }}
              value={entry.stitch.description?.en ?? ''}
              onChange={(e) => updateEntry(entry.stitch.id, { description: { pl: entry.stitch.description?.pl ?? '', en: e.target.value } })}
            />
          </label>
          <label style={{ display: 'block' }}>
            Description (PL)
            <textarea
              style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }}
              value={entry.stitch.description?.pl ?? ''}
              onChange={(e) => updateEntry(entry.stitch.id, { description: { pl: e.target.value, en: entry.stitch.description?.en ?? '' } })}
            />
          </label>
          <button
            type="button"
            onClick={() => removeEntry(entry.stitch.id)}
            style={{ marginTop: 8, padding: '4px 8px', background: 'transparent', border: '1px solid #d4831a', color: '#d4831a', borderRadius: 3, cursor: 'pointer' }}
          >
            Remove this stitch
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={addEntry}
        style={{ marginTop: 8, padding: '8px 16px', background: '#5a4730', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        + Add special stitch
      </button>
    </div>
  );
}
