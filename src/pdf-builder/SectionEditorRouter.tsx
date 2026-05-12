import type { Section } from '../pdf/document/types';
import { TitleSectionEditor } from './editors/TitleSectionEditor';
import { ThanksSectionEditor } from './editors/ThanksSectionEditor';
import { InformationSectionEditor } from './editors/InformationSectionEditor';

interface Props {
  section: Section | null;
}

export function SectionEditorRouter({ section }: Props) {
  if (!section) {
    return (
      <div style={{ padding: 24, fontStyle: 'italic', color: '#7a6347', fontFamily: 'Georgia, serif' }}>
        Select a section from the outline to edit it.
      </div>
    );
  }
  switch (section.kind) {
    case 'title':       return <TitleSectionEditor section={section} />;
    case 'thanks':      return <ThanksSectionEditor section={section} />;
    case 'information': return <InformationSectionEditor section={section} />;
    default:
      return (
        <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
          <h2 style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>Editor: {section.kind}</h2>
          <p style={{ color: '#7a6347', fontSize: 13 }}>
            Editor for "{section.kind}" is implemented in a subsequent task.
          </p>
        </div>
      );
  }
}
