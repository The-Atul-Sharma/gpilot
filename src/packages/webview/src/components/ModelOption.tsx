interface ModelOptionProps {
  value: string;
  label: string;
}

export function ModelOption({ value, label }: ModelOptionProps) {
  return <option value={value}>{label}</option>;
}
