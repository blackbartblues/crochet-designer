import { View } from '@react-pdf/renderer';
import { pdfTheme } from '../theme';

export function RuleOrnament() {
  return (
    <View
      style={{
        width: 40,
        height: pdfTheme.rules.thin,
        backgroundColor: pdfTheme.colors.rule,
        marginVertical: pdfTheme.spacing.rule,
        marginHorizontal: 'auto',
      }}
    />
  );
}
