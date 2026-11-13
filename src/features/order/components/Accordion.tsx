import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

interface AccProps {
  id: string;
  icon: string;
  title: string;
  desc: string;
  defaultOpen?: boolean;
  /** shows a "required" badge */
  req?: boolean;
  /** short status at the end of the header ("2/5", "ורוד פודרה") */
  status?: string;
  done?: boolean;
  /** opens the group (e.g. when it contains a validation error); bump to re-open */
  openSignal?: number;
  children: ReactNode;
}

/** A collapsible group of questions with a live status, built on <details>. */
export function Accordion({ id, icon, title, desc, defaultOpen, req, status, done, openSignal, children }: AccProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);
  return (
    <details className={"acc" + (done ? " is-done" : "")} data-acc={id} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="acc__sum">
        <span className="acc__ico" aria-hidden="true"><Icon name={icon} /></span>
        <span className="acc__t">
          <b>
            {title}
            {req && <span className="acc__req">חובה</span>}
          </b>
          <small>{desc}</small>
        </span>
        <span className="acc__state" data-acc-state={id}>{status || ""}</span>
        <span className="acc__chev" aria-hidden="true"><Icon name="plus" /></span>
      </summary>
      <div className="acc__body">{children}</div>
    </details>
  );
}
