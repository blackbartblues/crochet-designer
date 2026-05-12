import type { InformationSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: InformationSection;
}

export function InformationSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Information</h2>
      <fieldset style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
        <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>Yarn</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Brand
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.brand ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, brand: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Weight (e.g. "Super fine")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.weight ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, weight: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Fiber (e.g. "100% cotton")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.fiber ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, fiber: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block' }}>
          Meterage per ball (e.g. "170 m")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.meterage ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, meterage: e.target.value || undefined } })} />
        </label>
      </fieldset>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Hook (e.g. "3 mm")
        <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.hook} onChange={(e) => update({ ...section, hook: e.target.value })} />
      </label>
      <fieldset style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
        <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>Gauge</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Stitches
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.stitches} onChange={(e) => update({ ...section, gauge: { ...section.gauge, stitches: Number(e.target.value) || 0 } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Rows
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.rows} onChange={(e) => update({ ...section, gauge: { ...section.gauge, rows: Number(e.target.value) || 0 } })} />
        </label>
        <label style={{ display: 'block' }}>
          Square (cm)
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.squareCm} onChange={(e) => update({ ...section, gauge: { ...section.gauge, squareCm: Number(e.target.value) || 0 } })} />
        </label>
      </fieldset>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Terms system
        <select style={{ display: 'block', width: '100%', padding: 6 }} value={section.termsSystem} onChange={(e) => update({ ...section, termsSystem: (e.target.value as 'US' | 'UK') })}>
          <option value="US">US terms</option>
          <option value="UK">UK terms</option>
        </select>
      </label>
      <label style={{ display: 'block' }}>
        Notes
        <textarea style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }} value={section.notes ?? ''} onChange={(e) => update({ ...section, notes: e.target.value || undefined })} />
      </label>
    </div>
  );
}
