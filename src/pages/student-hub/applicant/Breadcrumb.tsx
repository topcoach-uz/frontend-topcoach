import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Compass } from "lucide-react";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import "./applicantPages.scss";

/** Flatten fragments so a trail written as `<>a<span>/</span>b</>` still splits. */
function flattenTrail(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap((child) =>
    isValidElement(child) && child.type === Fragment
      ? flattenTrail((child as ReactElement<{ children?: ReactNode }>).props.children)
      : [child],
  );
}
function isTrailSeparator(node: ReactNode) {
  if (typeof node === "string") return node.trim() === "/";
  if (!isValidElement(node) || node.type !== "span") return false;
  const inner = (node as ReactElement<{ children?: ReactNode }>).props.children;
  return typeof inner === "string" && inner.trim() === "/";
}
/** Split a page trail into its segments at every "/" separator. */
function trailSegments(children: ReactNode): ReactNode[][] {
  const segments: ReactNode[][] = [[]];
  for (const node of flattenTrail(children)) {
    if (isTrailSeparator(node)) segments.push([]);
    else segments[segments.length - 1].push(node);
  }
  return segments.filter((segment) =>
    segment.some((node) => (typeof node === "string" ? node.trim() !== "" : node != null)),
  );
}

/**
 * Page trail, styled like the Admissions Program header: a "My journey"
 * badge, chevron separators, earlier steps as quiet links, current page bold.
 */
export function Breadcrumb({ children }: { children: ReactNode }) {
  const segments = trailSegments(children);
  return (
    <>
      <nav className="applicant-breadcrumb" aria-label="Breadcrumb">
        <Link to="/student-hub/overview" className="applicant-breadcrumb__badge">
          <Compass size={13} aria-hidden />
          My journey
        </Link>
        {segments.map((segment, index) => {
          const current = index === segments.length - 1;
          return (
            <Fragment key={index}>
              <ChevronRight size={14} className="applicant-breadcrumb__sep" aria-hidden />
              <span
                className={current ? "applicant-breadcrumb__current" : "applicant-breadcrumb__step"}
                aria-current={current ? "page" : undefined}
              >
                {segment}
              </span>
            </Fragment>
          );
        })}
      </nav>
      <ApplicantMobileTrail>{children}</ApplicantMobileTrail>
    </>
  );
}
