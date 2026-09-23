/** Explicit product-managed roster. Never infer this specialty from a
 * mentor's degree: having a master's degree is not the same as advising
 * master's applicants. */
export const MASTER_PROGRAM_MENTOR_EMAILS = [
  'ahmadullayevarabboy@gmail.com',
  'mamadjanovjamshidbek@gmail.com',
];

export const isMasterProgramMentorEmail = (email?: string | null) =>
  Boolean(email && MASTER_PROGRAM_MENTOR_EMAILS.includes(email.toLowerCase()));
