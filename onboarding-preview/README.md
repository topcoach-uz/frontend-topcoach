# Onboarding design preview

Local, interactive implementation of the 41 onboarding screens from Figma
`llWdFhf7FnK7GvGMPYHvVr`, page `315:2` (desktop + mobile designs).

The web version adapts those flows to the existing website identity: shared
burgundy header styling, the actual `Logo` component, and the site’s DM Sans
font stack for both headings and body text. The onboarding header intentionally
keeps only the logo, language indicator, and Save & exit action.

With the existing Vite dev server running, open:

http://127.0.0.1:5173/onboarding-preview/

Use **Explore all 41 screens** to jump between account entry, bachelor’s,
master’s, mentor, and recovery screens. The default is the degree-choice screen.

## Boundaries

- Separate HTML entry; the production router and `/onboarding` are unchanged.
- No account creation, profile submission, email delivery, Telegram connection,
  Google sign-in, video service, or file upload. Integration actions are simulated.
- University suggestions use the existing local `public/world-universities.json`
  directory. Field suggestions reuse the app’s education data.
- Example answers are editable. Only whitelisted basic details are retained in
  this tab’s session storage. Credentials, contact details, uploads, and free-text
  answers are not persisted.
- The normal production build has not been configured to publish this preview.

## Checks

```sh
npx vitest run src/pages/onboarding-preview/model.test.ts
npx tsc --noEmit -p tsconfig.app.json
npx eslint src/pages/onboarding-preview/OnboardingPreview.tsx src/pages/onboarding-preview/model.ts src/pages/onboarding-preview/model.test.ts src/pages/onboarding-preview/main.tsx
```

Browser checks cover desktop and 390px mobile layouts, degree branching,
education suggestions, year validation, and review editing. The UI adds a small
preview banner to the Figma layout so simulated screens cannot be confused with
the live platform.
