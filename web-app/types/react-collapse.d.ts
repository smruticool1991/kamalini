declare module 'react-collapse' {
  import { ReactNode } from 'react';

  export interface CollapseProps {
    isOpened: boolean;
    children?: ReactNode;
    theme?: Record<string, string>;
    initialStyle?: { height: string | number; overflow: string };
    onRest?: () => void;
    onWork?: () => void;
    checkTimeout?: number;
    springConfig?: Record<string, number>;
    hasNestedCollapse?: boolean;
  }

  export const Collapse: React.FC<CollapseProps>;
}
