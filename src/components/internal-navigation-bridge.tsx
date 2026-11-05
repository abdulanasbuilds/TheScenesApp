import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

function internalHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Keeps existing semantic anchors and GET forms progressively enhanced while
 * routing same-origin navigation through TanStack Router. This preserves the
 * fixture store between screens instead of reloading the whole document.
 */
export function InternalNavigationBridge() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.dataset.appReady = "true";

    const navigate = (href: string) => {
      void router.navigate({ href });
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navigate(internalHref(url));
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;

      const form = event.target;
      if ((form.method || "get").toLowerCase() !== "get") return;

      const url = new URL(form.action || window.location.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const data = new FormData(form, event.submitter ?? undefined);
      for (const [key, value] of data.entries()) {
        if (typeof value === "string") url.searchParams.append(key, value);
      }

      event.preventDefault();
      navigate(internalHref(url));
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    return () => {
      delete document.documentElement.dataset.appReady;
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
    };
  }, [router]);

  return null;
}
