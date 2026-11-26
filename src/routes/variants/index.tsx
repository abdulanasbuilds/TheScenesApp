import { createFileRoute } from "@tanstack/react-router";

const variants = [
  {
    href: "/variants/call-sheet",
    name: "Call sheet",
    summary: "Warm paper editorial. Clay ink, Georgia display, banner hero, ruled tables.",
  },
  {
    href: "/variants/night-studio",
    name: "Night studio",
    summary: "Warm charcoal stage. Amber accent, Trebuchet display, screenshot stage hero, light bands.",
  },
  {
    href: "/variants/catalogue",
    name: "Catalogue",
    summary: "Stone paper index. Green accent, Verdana display, community roster as the hero, forest band.",
  },
];

const strip = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "1rem",
  alignItems: "center",
  padding: "0.5rem 1.25rem",
  background: "#16150f",
  color: "#eef2ea",
  fontFamily: '"Courier New", monospace',
  fontSize: "0.875rem",
};

const main = {
  maxWidth: "60rem",
  margin: "0 auto",
  padding: "4rem 1.25rem",
  fontFamily: "Georgia, serif",
  color: "#16150f",
};

const card = {
  display: "block",
  padding: "1.5rem",
  marginBottom: "1.25rem",
  border: "1px solid #c3c6ba",
  background: "#ffffff",
  color: "inherit",
  textDecoration: "none",
};

function VariantPicker() {
  return (
    <div>
      <aside style={strip} aria-label="Variant preview navigation">
        <span>Variant preview</span>
        <a href="/variants" aria-current="page" style={{ color: "#ffffff" }}>
          All variants
        </a>
        <a href="/variants/call-sheet" style={{ color: "#b9c7ba" }}>
          Call sheet
        </a>
        <a href="/variants/night-studio" style={{ color: "#b9c7ba" }}>
          Night studio
        </a>
        <a href="/variants/catalogue" style={{ color: "#b9c7ba" }}>
          Catalogue
        </a>
      </aside>
      <main style={main}>
        <h1 style={{ fontSize: "2.25rem", lineHeight: 1.15, margin: "0 0 0.75rem" }}>
          Landing page variants
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            lineHeight: 1.6,
            margin: "0 0 2rem",
            maxWidth: "48ch",
          }}
        >
          Three isolated directions for the marketing landing page. Same sections, same copy, same
          search action — different visual systems. This picker is test chrome and is removed once a
          variant is promoted.
        </p>
        {variants.map((variant) => (
          <a key={variant.href} href={variant.href} style={card}>
            <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>{variant.name}</h2>
            <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "#3d3b33" }}>
              {variant.summary}
            </p>
          </a>
        ))}
        <p style={{ fontFamily: '"Courier New", monospace', fontSize: "0.875rem", color: "#63614f" }}>
          The current production landing page stays at <a href="/">/</a> until a variant is chosen.
        </p>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/variants/")({
  head: () => ({ meta: [{ title: "The Scenes — variant preview picker" }] }),
  component: VariantPicker,
});
