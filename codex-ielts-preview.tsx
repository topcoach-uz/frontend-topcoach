// Development-only fixture account with the real TopCoach router and auth gates.
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { I18nextProvider } from "react-i18next";
import { createStore } from "./src/app/store";
import { changeTheme } from "./src/app/slices/layoutSlice";
import AntdProvider from "./src/lib/antd";
import RouterProvider from "./src/lib/router";
import i18n from "./src/lib/i18n";
import "./src/styles/global.scss";
import "./src/lib/fontawesome";
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
const store = createStore({
  preloadedState: { auth: { isAuthenticated: true, profile } },
});
store.dispatch(changeTheme("light"));
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AntdProvider>
      <I18nextProvider i18n={i18n}>
        <GoogleOAuthProvider clientId="local-preview">
          <RouterProvider />
        </GoogleOAuthProvider>
      </I18nextProvider>
    </AntdProvider>
  </Provider>,
);
