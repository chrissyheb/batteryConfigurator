import React, { createContext, useContext , useId, useLayoutEffect, useRef, useState } from "react";
import { PathType } from "@/spec/builder";
import { hasErrorUnder } from "@/utils/errors";
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

  errorPrefixSet: Set<string>;
  path: PathType;

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
  errorPrefixSet,
  path,
  actionType,
  onAction,
  actionAriaLabel,
}: CollapsibleProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const panelId = useId();
  const headerId = `${panelId}-header`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  const ctxLevel = useHeadingLevel();
  const level = headingLevel ?? ctxLevel;
  const HeadingTag = `h${level}` as const;
  const hasChildren = React.Children.count(children) > 0;

  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  // Scrollt die gerade expandierte Card in den sichtbaren Bereich, damit man
  // nach dem Aufklappen (v.a. der letzten Card einer Liste) nicht manuell
  // nachscrollen muss.
  //
  // Wichtig bei verschachtelten Cards (Card-Stack): wenn z.B. "Battery" tief
  // innerhalb von BatteryInverterCard -> "Battery & Inverter" -> "Main"
  // aufgeklappt wird, müssen ALLE umgebenden .card-content-Container per
  // ResizeObserver (siehe useLayoutEffect unten) erst selbst nachwachsen,
  // damit sie die neue Card nicht mehr anschneiden - jeder dieser Container
  // hat seine eigene 0.3s-Transition, die zeitversetzt nacheinander abläuft.
  // Würden wir nur auf die eigene Card warten, wäre die Zielposition zwar
  // korrekt berechnet, die Card aber trotzdem noch von einem noch nicht
  // fertig gewachsenen Eltern-Container (overflow:hidden) abgeschnitten.
  // Deshalb warten wir hier, bis Größe/Position der Card UND aller
  // umschließenden .card-content-Container stabil sind, bevor wir einmalig
  // die nötige Scroll-Korrektur anwenden.
  const scrollIntoViewAfterExpand = () => {
    const el = rootRef.current;
    if (!el) return;

    const getAncestorCardContents = (start: HTMLElement): HTMLElement[] => {
      const result: HTMLElement[] = [];
      let node: HTMLElement | null = start.parentElement;
      while (node) {
        if (node.classList.contains('card-content')) { result.push(node); }
        node = node.parentElement;
      }
      return result;
    };

    const getStickyHeaderHeight = (): number => {
      const header = document.querySelector('header');
      return header ? header.getBoundingClientRect().height : 0;
    };

    const applyFinalScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const bottomMargin = 12;
      const topReserved = getStickyHeaderHeight() + 12; // Platz für den sticky Header oben
      const availableHeight = viewportHeight - topReserved - bottomMargin;

      let delta = 0;
      if (rect.height <= availableHeight) {
        // Card passt komplett in den sichtbaren Bereich
        if (rect.bottom > viewportHeight - bottomMargin) {
          delta = rect.bottom - (viewportHeight - bottomMargin);
        } else if (rect.top < topReserved) {
          delta = rect.top - topReserved; // negativ -> nach oben korrigieren (Sticky-Header verdeckt sonst die Card)
        }
      } else {
        // Card ist höher als der sichtbare Bereich -> Oberkante direkt unter dem Sticky-Header zeigen
        delta = rect.top - topReserved;
      }

      if (Math.abs(delta) > 0.5) { window.scrollBy({ top: delta, behavior: 'smooth' }); }
    };

    const watched = [el, ...getAncestorCardContents(el)];
    const maxWaitMs = 900; // Sicherheitsnetz; die eigentliche max-height-Transition ist 0.15s (siehe app.css)
    const start = performance.now();
    let lastHeights = watched.map((n) => n.getBoundingClientRect().height);
    let stableFrames = 0;

    const waitForSettle = () => {
      const heights = watched.map((n) => n.getBoundingClientRect().height);
      const changed = heights.some((h, i) => Math.abs(h - lastHeights[i]) > 0.5);
      lastHeights = heights;
      stableFrames = changed ? 0 : stableFrames + 1;

      if (stableFrames >= 2 || performance.now() - start > maxWaitMs) {
        applyFinalScroll();
        return;
      }
      requestAnimationFrame(waitForSettle);
    };

    requestAnimationFrame(waitForSettle);
  };

  const toggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) { scrollIntoViewAfterExpand(); }
  };


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
  }, [open, hasChildren]);

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
              scrollIntoViewAfterExpand();
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
    <div ref={rootRef} className={className + `${hasErrorUnder(errorPrefixSet, path) ? " has-error" : ""}`}>
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
            style={{ visibility: hasChildren ? "visible" : "hidden" }}
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

      {hasChildren &&
        <div
          ref={contentWrapperRef}
          id={panelId}
          className="card-content"
          role="region"
          aria-labelledby={headerId}
          style={{ maxHeight }} //, padding: hasChildren ? "12px" : "0" }}
        >
          <div ref={innerRef} className="card-content-inner">
            <HeadingSection>{children}</HeadingSection>
          </div>
        </div>
      }
    </div>
  );
}
