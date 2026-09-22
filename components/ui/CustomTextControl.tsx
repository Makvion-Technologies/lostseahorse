"use client";

import { SegmentedControl } from "./SegmentedControl";

export function CustomTextControl({
  value,
  onChange,
}: {
  value: "generated" | "custom";
  onChange: (value: "generated" | "custom") => void;
}) {
  return (
    <SegmentedControl
      compact
      ariaLabel="Passage source"
      layoutId="solo-passage"
      value={value}
      options={[
        { value: "generated", label: "Generated" },
        { value: "custom", label: "My passage" },
      ]}
      onChange={onChange}
    />
  );
}
