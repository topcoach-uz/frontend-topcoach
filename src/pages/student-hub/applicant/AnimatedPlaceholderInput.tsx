import { useState } from "react";
import { Input, type InputProps } from "antd";
import { useRotatingPlaceholder } from "./rotatingPlaceholder";

interface Props extends Omit<InputProps, "placeholder"> {
  /** Examples cycled while the input is idle and empty. */
  examples: readonly string[];
  /** Placeholder shown when idle motion is off, focused or filled. */
  staticPlaceholder: string;
  /** Required: the accessible name never depends on the animated text. */
  "aria-label": string;
}

/** antd Input whose placeholder types through examples; static while focused, filled or under reduced motion. */
export function AnimatedPlaceholderInput({ examples, staticPlaceholder, onFocus, onBlur, value, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const idle = !focused && !String(value ?? "");
  const placeholder = useRotatingPlaceholder(examples, staticPlaceholder, idle);
  return <Input
    {...rest}
    value={value}
    className={`animated-placeholder-input ${rest.className ?? ""}`.trim()}
    placeholder={placeholder}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }}
    onBlur={(event) => { setFocused(false); onBlur?.(event); }}
  />;
}
