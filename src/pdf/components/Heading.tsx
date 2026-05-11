import { Text, View } from '@react-pdf/renderer';
import { pdfTheme } from '../theme';

interface HeadingProps {
  children: string;
  kind?: 'display' | 'section';
}

export function Heading({ children, kind = 'section' }: HeadingProps) {
  return (
    <View style={{ alignItems: 'center', marginBottom: pdfTheme.spacing.section }}>
      <Text
        style={{
          fontFamily: pdfTheme.fonts.display,
          fontSize: kind === 'display' ? 32 : 22,
          letterSpacing: 2,
          color: pdfTheme.colors.ink,
        }}
      >
        {children}
      </Text>
      <View
        style={{
          width: 60,
          height: 1,
          backgroundColor: pdfTheme.colors.rule,
          marginTop: 6,
        }}
      />
    </View>
  );
}
