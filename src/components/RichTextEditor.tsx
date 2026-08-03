/**
 * Lightweight rich text editor using contentEditable + execCommand.
 * No external dependencies. Returns HTML string via onChange.
 */
import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  X,
  Type,
} from "lucide-react";

export interface RichTextEditorProps {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  autoFocus?: boolean;
}

type ToolbarItem =
  | { kind: "button"; icon: React.ElementType; cmd: string; val?: string; title: string }
  | { kind: "link" }
  | { kind: "sep" };

const TOOLBAR: ToolbarItem[] = [
  { kind: "button", icon: Bold, cmd: "bold", title: "Bold (Ctrl+B)" },
  { kind: "button", icon: Italic, cmd: "italic", title: "Italic (Ctrl+I)" },
  { kind: "button", icon: Underline, cmd: "underline", title: "Underline" },
  { kind: "button", icon: Strikethrough, cmd: "strikeThrough", title: "Strikethrough" },
  { kind: "sep" },
  { kind: "button", icon: Type, cmd: "formatBlock", val: "h2", title: "Heading" },
  { kind: "sep" },
  { kind: "button", icon: List, cmd: "insertUnorderedList", title: "Bullet list" },
  { kind: "button", icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered list" },
  { kind: "button", icon: Quote, cmd: "formatBlock", val: "blockquote", title: "Quote" },
  { kind: "button", icon: Code2, cmd: "formatBlock", val: "pre", title: "Code block" },
  { kind: "sep" },
  { kind: "link" },
];

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write something…",
  minHeight = "110px",
  className = "",
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEmpty, setIsEmpty] = useState(!value);
  const didMount = useRef(false);

  // Initialise once on mount
  useEffect(() => {
    if (editorRef.current && !didMount.current) {
      editorRef.current.innerHTML = value;
      didMount.current = true;
      setIsEmpty(!value || value === "<br>");
    }
  }, []); // eslint-disable-line

  // External value reset (e.g. on form submit)
  useEffect(() => {
    if (value === "" && editorRef.current && editorRef.current.innerHTML !== "") {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
    }
  }, [value]);

  const exec = useCallback(
    (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      editorRef.current?.focus();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange],
  );

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const empty = html === "" || html === "<br>" || html === "<div><br></div>";
    setIsEmpty(empty);
    onChange(empty ? "" : html);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    exec("createLink", url);
    setLinkMode(false);
    setLinkUrl("");
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-accent/40 px-2 py-1.5">
        {TOOLBAR.map((item, i) => {
          if (item.kind === "sep") return <div key={i} className="mx-0.5 h-4 w-px bg-border" />;

          if (item.kind === "link") {
            return (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setLinkMode((v) => !v);
                }}
                title="Insert link"
                className={`rounded p-1.5 text-[13px] transition-colors ${linkMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <Link2 size={13} />
              </button>
            );
          }

          const Icon = item.icon;
          return (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                exec(item.cmd, item.val);
              }}
              title={item.title}
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* Link URL bar */}
      {linkMode && (
        <div className="flex items-center gap-2 border-b border-border bg-sky-50/60 px-3 py-1.5">
          <Link2 size={12} className="shrink-0 text-primary" />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertLink();
              }
              if (e.key === "Escape") {
                setLinkMode(false);
              }
            }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={insertLink}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkMode(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editable area */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-2.5 select-none text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          autoFocus={autoFocus}
          onInput={handleInput}
          onPaste={(e) => {
            // Strip unstyled paste formatting
            e.preventDefault();
            const text =
              e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
          }}
          style={{ minHeight }}
          className="px-3 py-2.5 text-sm text-foreground outline-none
            [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground
            [&_h3]:mt-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground
            [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5
            [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5
            [&_li]:my-0.5
            [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
            [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-accent [&_pre]:p-2.5 [&_pre]:font-mono [&_pre]:text-xs
            [&_code]:rounded [&_code]:bg-accent [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:font-semibold [&_em]:italic"
        />
      </div>
    </div>
  );
}

/** Strips HTML tags for plain-text length checks */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}
