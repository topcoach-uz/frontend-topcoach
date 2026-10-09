import { defineConfig, mergeConfig } from "vite";
import original from "./vite.config";
const profile = {
  id: "ielts-preview-student",
  email: "preview@example.test",
  managementRole: "User",
  profile: {
    name: "Preview Student",
    role: "Student",
    media: [],
    studentProfile: { id: "ielts-preview-profile" },
  },
};
export default mergeConfig(
  original,
  defineConfig({
    cacheDir: "node_modules/.vite-ielts-preview",
    define: {
      "import.meta.env.VITE_API_HOST": JSON.stringify(""),
      "import.meta.env.VITE_APPLICANT_WORKSPACE_ENABLED":
        JSON.stringify("true"),
    },
    server: { host: "127.0.0.1", port: 5185, strictPort: true, proxy: {} },
    plugins: [
      {
        name: "local-ielts-preview",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith("/api")) {
              // All requests remain local; this preview never calls the production API.
              let data: unknown = [];
              if (req.url.split("?")[0] === "/api/users/me") data = profile;
              else if (req.url.includes("/user-preferences"))
                data = {
                  applicationSettings: { communityExperienceMode: true },
                };
              else if (req.url.includes("/subscription"))
                data = { status: "active" };
              else if (req.url.includes("/posts"))
                data = { items: [], total: 0, hasMore: false };
              else if (req.url.split("?")[0] === "/api/student-hub/overview")
                data = {
                  profile: {
                    id: "ielts-preview-profile",
                    name: "Preview Student",
                    targetDegree: "bachelor",
                    completionPercentage: 0,
                    currentSchool: null,
                    previousInstitution: null,
                    previousDegree: null,
                    previousField: null,
                    intendedField: null,
                    fieldUndecided: true,
                    destinations: [],
                    destinationUndecided: true,
                    intakeTerm: null,
                    intakeYear: null,
                  },
                  applications: {
                    state: "ready",
                    data: {
                      total: 0,
                      active: { total: 0, items: [] },
                      shortlist: { total: 0, items: [] },
                      nextDeadline: null,
                    },
                  },
                  tasks: {
                    state: "ready",
                    data: { total: 0, open: 0, items: [] },
                  },
                  documents: { state: "ready", data: { total: 0 } },
                  sessions: { state: "ready", data: { total: 0, next: null } },
                };
              else if (req.url.includes("/dashboard")) data = {};
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
              return;
            }
            if (
              req.url === "/" ||
              req.url?.startsWith("/student-hub") ||
              req.url?.startsWith("/privacy-policy") ||
              req.url?.startsWith("/terms-and-conditions")
            )
              req.url = "/codex-ielts-preview.html";
            next();
          });
        },
      },
    ],
  }),
);
