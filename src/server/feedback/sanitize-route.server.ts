import "@tanstack/react-start/server-only";

/**
 * P4-S4 route data minimization.
 *
 * Feedback recipients receive only the page pathname. Query strings, fragments and any query value
 * that could plausibly be sensitive (a token, email, redirect target, tracking parameter or
 * fragment identifier) are never sent, logged or recorded. This is applied after the schema has
 * already accepted the full internal route, so an operator never receives user-controlled query
 * text.
 *
 * The route is validated before this function is called; if something unexpected slips through, the
 * pathname stays within the internal scope of this application and no external link is created.
 */

/** Return only the internal pathname. Query text, hash and absolute URL fragments are dropped. */
export function sanitizeFeedbackRoute(fullRoute: string): string {
  const queryIndex = fullRoute.indexOf("?");
  const fragmentIndex = fullRoute.indexOf("#");
  const boundaries = [queryIndex, fragmentIndex].filter((index) => index >= 0);
  const cutIndex = boundaries.length > 0 ? Math.min(...boundaries) : fullRoute.length;
  return fullRoute.slice(0, cutIndex);
}
