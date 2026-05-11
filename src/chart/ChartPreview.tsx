import type { Pattern } from '../domain/graph/types';
import { renderRadialChart } from './renderRadial';
import { renderLinearChart } from './renderLinear';

interface ChartPreviewProps {
  pattern: Pattern;
}

export function ChartPreview({ pattern }: ChartPreviewProps) {
  switch (pattern.shape) {
    case 'radial':
      return renderRadialChart(pattern);
    case 'rectangular':
      return renderLinearChart(pattern);
    case 'freeform':
      return renderRadialChart(pattern);
  }
}
