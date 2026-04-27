import { layout } from '../styles.js';

interface FileLocationProps {
  file: string;
  line: number;
}

/** Monospace label showing the file path and 1-based line number. */
export function FileLocation({ file, line }: FileLocationProps) {
  return (
    <span style={layout.monospace}>
      {file}:{line}
    </span>
  );
}
