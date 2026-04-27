interface ModelOptionProps {
  provider: string;
  model: string;
  label: string;
}

/** Single <option> in the ModelSwitcher dropdown. Uses provider:model as value. */
export function ModelOption({ provider, model, label }: ModelOptionProps) {
  return <option value={`${provider}:${model}`}>{label}</option>;
}
