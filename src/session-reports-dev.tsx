import { createRoot } from "react-dom/client";
import StructuredSessionReports from "./pages/mentor/console/components/StructuredSessionReports";
let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
function attach() {
  const enabled = location.pathname.startsWith("/mentor/");
  if (enabled && !container) {
    container = document.createElement("div");
    container.className = "sr-runtime-root";
    document.body.appendChild(container);
    root = createRoot(container);
    root.render(<StructuredSessionReports />);
  } else if (!enabled && container) {
    root?.unmount();
    container.remove();
    container = null;
    root = null;
  }
}
attach();
setInterval(attach, 1000);
