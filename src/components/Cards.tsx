import React, { createContext, useContext , useId, useLayoutEffect, useRef, useState } from "react";
import { Trash2, ListPlus } from "lucide-react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HeadingLevelContext = createContext<HeadingLevel>(2); // z.B. Standard: h2

function clampHeading(level: number): HeadingLevel {
  if (level < 1) return 1;
  if (level > 6) return 6;
  return level as HeadingLevel;
}

/** Liefert das aktuelle Heading-Level (z.B. 2 für h2) */
export function useHeadingLevel() {
  return useContext(HeadingLevelContext);
}

/**
 * Startet eine neue "Section": Kinder bekommen automatisch Level+1
 * Beispiel: aktuelles Level 2 -> Kinder sehen Level 3
 */
export function HeadingSection({ children }: { children: React.ReactNode }) {
  const level = useHeadingLevel();
  const next = clampHeading(level + 1);

  return (
    <HeadingLevelContext.Provider value={next}>
      {children}
    </HeadingLevelContext.Provider>
  );
}

/** Optional: Root für eine Seite/Area, um Startlevel zu setzen */
export function HeadingRoot({
  level = 2,
  children,
}: {
  level?: HeadingLevel;
  children: React.ReactNode;
}) {
  return (
    <HeadingLevelContext.Provider value={level}>
      {children}
    </HeadingLevelContext.Provider>
  );
}


// Später erweiterbar: "edit" | "duplicate" | "menu" | ...
export type BuiltInAction = "delete" | "add";


export type CollapsibleProps = {
  title: string;
  defaultOpen?: boolean;

  headingLevel?: HeadingLevel;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  className?: string;
  children: React.ReactNode;

  /** Optional: eingebaute Aktion rechts im Header */
  actionType?: BuiltInAction;

  /** Callback für eingebaute Aktionen */
  onAction?: (type: BuiltInAction) => void;

  /** Optional: a11y Label überschreiben */
  actionAriaLabel?: string;
};

export function Collapsible({
  title,
  defaultOpen = false,
  headingLevel,
  open: controlledOpen,
  onOpenChange,
  className = "",
  children,
  actionType,
  onAction,
  actionAriaLabel,
}: CollapsibleProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const panelId = useId();
  const headerId = `${panelId}-header`;

  const innerRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  const ctxLevel = useHeadingLevel();
  const level = headingLevel ?? ctxLevel;
  const HeadingTag = `h${level}` as const;

  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  const toggle = () => setOpen(!open);

  // sorgt dafür, dass Parent (z.B. Stack) bei Änderungen in Child-Collapsibles mitwächst
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const update = () => setMaxHeight(open ? `${el.scrollHeight}px` : "0px");
    update();

    if (!open) return;

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Built-in Action Renderer (später leicht erweiterbar)
  const renderAction = () => {
    if (!actionType) return null;

    switch (actionType) {
      case "add":
        return (
          <button
            type="button"
            className="icon-button"
            aria-label={actionAriaLabel ?? `${title} add`}
            title={actionAriaLabel ?? "add"}
            onClick={(e) => {
              e.stopPropagation(); // verhindert Toggle
              setOpen(true);
              onAction?.("add");
            }}
          >
            <ListPlus size={18} aria-hidden="true" />
          </button>
        );
      case "delete":
        return (
          <button
            type="button"
            className="icon-button danger"
            aria-label={actionAriaLabel ?? `${title} delete`}
            title={actionAriaLabel ?? "delete"}
            onClick={(e) => {
              e.stopPropagation(); // verhindert Toggle
              onAction?.("delete");
            }}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        );
      default:
        return null;
    }
  };

  const actionNode = renderAction();

  return (
    <div className={className}>
      <HeadingTag className="card-heading">
        <div className="card-header">
          <button
            id={headerId}
            type="button"
            className="card-toggle-btn"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? `${title} expand` : `${title} collapse`}
            title={open ? "collapse" : "expand"}
          >
            <span aria-hidden="true">{open ? "−" : "+"}</span>
          </button>

          <span className="card-title">{title}</span>

          {actionNode && (
            <div
              className="card-header-action"
              onClick={(e) => e.stopPropagation()}
            >
              {actionNode}
            </div>
          )}
        </div>
      </HeadingTag>

      <div
        id={panelId}
        className="card-content"
        role="region"
        aria-labelledby={headerId}
        style={{ maxHeight }}
      >
        <div ref={innerRef} className="card-content-inner">
          <HeadingSection>{children}</HeadingSection>
        </div>
      </div>
    </div>
  );
}