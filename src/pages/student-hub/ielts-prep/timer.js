// Pure helpers for the practice timer.

// Per-skill exam timing. Writing is overridden per task on a single task page.
export const EXAM_TIMING = {
  listening: {
    minutes: 30,
    label: "Listening",
    note: "30 minutes of audio. In the computer-delivered test you also get about 2 minutes at the end to review your answers.",
  },
  reading: {
    minutes: 60,
    label: "Reading",
    note: "60 minutes for all three passages. There is no extra time to transfer answers.",
  },
  writing: {
    minutes: 60,
    label: "Writing",
    note: "60 minutes in total. Spend about 20 minutes on Task 1 and 40 minutes on Task 2.",
  },
};

export const WRITING_TASK_MINUTES = { 1: 20, 2: 40 };

// Timing shown in the start panel. A single writing task uses the task time;
// the full mock keeps the 60 minute section.
export function timingFor(skill, part, mock = false) {
  const base = EXAM_TIMING[skill];
  if (!base) return null;
  if (skill === "writing" && !mock && WRITING_TASK_MINUTES[part]) {
    const minutes = WRITING_TASK_MINUTES[part];
    return {
      ...base,
      minutes,
      label: `Writing Task ${part}`,
      note: `Spend about ${minutes} minutes on this task. In the full test, Writing is 60 minutes in total.`,
    };
  }
  return base;
}

// A stored deadline that had already passed when we first saw it belongs to an
// earlier attempt: discard it silently instead of announcing "Time is up".
// `seenLiveDeadline` is the deadline we watched while it was still in the future.
export function expiryAction(clock, seenLiveDeadline, now) {
  if (!clock || !clock.deadline || clock.deadline > now) return "none";
  return seenLiveDeadline === clock.deadline ? "announce" : "discard";
}
