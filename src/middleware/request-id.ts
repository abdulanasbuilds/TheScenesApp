import { createMiddleware } from "@tanstack/react-start";

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveRequestId(value: string | null | undefined): string {
  return value && value.length <= 36 && REQUEST_ID.test(value)
    ? value.toLowerCase()
    : crypto.randomUUID();
}

export const requestIdMiddleware = createMiddleware().server(async ({ request, next }) => {
  const requestId = resolveRequestId(request.headers.get("x-request-id"));
  const result = await next({ context: { requestId } });
  result.response.headers.set("x-request-id", requestId);
  return result;
});
