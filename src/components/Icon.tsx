import { ICON_PATHS, hasIcon } from "@/lib/icons";

interface IconProps {
  name: string;
  className?: string;
  /** accessible label; without it the icon is decorative (aria-hidden) */
  label?: string;
}

/** Line icon from the shared library (falls back to "sparkle" for unknown names). */
export function Icon({ name, className, label }: IconProps) {
  const body = hasIcon(name) ? ICON_PATHS[name] : ICON_PATHS.sparkle;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const, focusable: "false" as const };
  return (
    <svg
      className={"ico" + (className ? " " + className : "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
      // static, trusted path data from our own icon set
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
