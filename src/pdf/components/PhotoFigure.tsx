import { Image, Text, View } from '@react-pdf/renderer';
import type { Photo } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

interface PhotoFigureProps {
  photo: Photo;
  caption?: string;
  width?: number;
}

export function PhotoFigure({ photo, caption, width = 200 }: PhotoFigureProps) {
  if (photo.storage.kind !== 'inline') {
    return null;
  }
  const src = `data:${photo.storage.mime};base64,${photo.storage.base64}`;
  return (
    <View style={{ marginVertical: pdfTheme.spacing.rule, alignItems: 'center' }}>
      <Image src={src} style={{ width, height: 'auto' }} />
      {caption && (
        <Text
          style={{
            fontFamily: pdfTheme.fonts.accent,
            fontSize: 9,
            color: pdfTheme.colors.inkSoft,
            marginTop: 4,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}
