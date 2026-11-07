# Master’s applicant experience — Figma audit

Updated 23 September 2026 against the available Master’s frames in the TopCoach Frontend Figma file. This is a route and implementation audit; it is not a claim of pixel parity. Live signed-in QA awaits the local database and API.

| Route or surface | Figma reference | Status | Finding |
| --- | --- | --- | --- |
| Overview | `395:961`, `395:1440` | Aligned | Master-specific introduction, prior-degree summary, toolkit and document guidance exist. |
| Applications list / new / detail / edit | `403:484`, `403:1448`, `405:243` | Implemented; QA pending | Saved applications persist a program ID; verified program selections work without a separate university-catalogue response. |
| Tasks and timeline | `405:1866`, `405:787` | Aligned | The applicant timeline renders dated application and task milestones from the legacy timeline link. |
| Academic profile | `406:533` | Aligned | Previous institution, degree, field, graduation, GPA/scale and experience replace undergraduate test and curriculum fields. |
| Activities profile | `406:1064`, `410:5037` | Aligned | Shared experience UI uses graduate-appropriate examples for Master’s applicants. |
| Documents and upload | `406:2676`, `406:3211` | Implemented; QA pending | Search, application/draft filters, private new uploads and assigned-mentor access use persisted backend records. Legacy public uploads are flagged and must be replaced before sharing. |
| Statements and review | `406:3734`, `406:4238`, `406:4760` | Implemented; QA pending | Text statement versions and uploaded-document review now have Preview, Feedback and Versions, private downloads, new file versions and mentor review state. |
| Master program shortlist | `515:2314`, `515:2892` | Implemented; data pending | Search returns graduate programs and their universities; saved items persist program IDs. Catalogue records require verified admin entry. |
| Program detail | `515:2314` | Implemented; data pending | Verified eligibility, language evidence, funding, intake, deadline, source and verification date appear when records contain them; missing facts say “Verification needed.” |
| Program comparison | `515:2892` | Implemented; QA pending | Compares saved graduate programs using verified records and the applicant’s own notes. |
| My Learning and admissions | `408:2`, `406:7342` | Partial | SAT navigation is hidden for Master’s. Learning catalogue content is shared and has no verified graduate suitability metadata. |
| Research preparation | `406:7851`, `410:3537`, `406:8376` | Shared | Available as shared learning; no source evidence requires it for every Master’s applicant. |
| Community, Full Support and locked states | `407:2`, `407:4842`, `407:9442` | Implemented behind flag; QA pending | Full Support suppresses SAT for Master’s. The applicant-enabled Research access route has the Figma in-page enrollment explanation. |
| Settings, billing and rewards | `407:4312`, `407:6925`, `407:1154` | Shared | No Master-specific mismatch found. |
| Mobile | No Master mobile frames | Needs browser QA | The responsive shell and drawer exist, but the Figma source provides no Master mobile references for pixel comparison. |

## Data and QA prerequisites

Run the additive backend migrations, add sourced graduate program records through the admin API, and verify the default applicant workspace in the QA environment. The code deliberately leaves unsupported program facts as “Verification needed.” The local Postgres/API are currently stopped, so entitlement, upload, reviewer and mobile behavior still need signed-in browser QA. Graduate-specific course suitability remains unknown; the admissions course is shared content.
