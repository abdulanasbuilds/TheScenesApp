import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { CoverArt } from "@/components/ui";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Renders a real uploaded/seed image, falling back to the generated cover art.
 * Nothing here uploads bytes to a server: a chosen file is previewed with an
 * object URL for the current tab only.
 */
export function MediaCover({
  src,
  seed,
  hue,
  label,
  className,
  rounded = "rounded-xl",
  imgClassName,
}: {
  src?: string | null;
  seed: string;
  hue: number;
  label?: string;
  className?: string;
  rounded?: string;
  imgClassName?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const usable = src && src !== failedSource;

  if (usable) {
    return (
      <img
        src={src}
        alt={label ?? ""}
        loading="lazy"
        onError={() => setFailedSource(src ?? null)}
        className={cn("h-full w-full object-cover", rounded, className, imgClassName)}
      />
    );
  }

  return <CoverArt seed={seed} hue={hue} label={label} rounded={rounded} className={className} />;
}

export function MediaUploadField({
  label,
  hint,
  recommended,
  value,
  onChange,
  seed,
  hue,
  aspectClassName = "aspect-[1084/576]",
  previewClassName,
}: {
  label: string;
  hint?: string;
  recommended?: string;
  value?: string | null;
  onChange: (value: string, file?: File) => void;
  seed: string;
  hue: number;
  aspectClassName?: string;
  previewClassName?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Use an image under 2 MB.");
      return;
    }
    setError("");
    setFileName(file.name);
    onChange(URL.createObjectURL(file), file);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-bold text-slate-700">
          {label}
        </label>
        {recommended ? (
          <span className="text-[11px] text-slate-500">Recommended {recommended}</span>
        ) : null}
      </div>
      <div
        className={cn(
          "relative mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50",
          aspectClassName,
          previewClassName,
        )}
      >
        <MediaCover
          src={value}
          seed={seed}
          hue={hue}
          label={`${label} preview`}
          rounded="rounded-xl"
          className="absolute inset-0 h-full w-full"
          imgClassName="absolute inset-0"
        />
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0])}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Upload className="h-3.5 w-3.5" /> Choose image
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              setFileName("");
              onChange("");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <ImagePlus className="h-3.5 w-3.5" /> Sample image until you upload one
          </span>
        )}
      </div>
      {fileName ? (
        <p className="mt-1 truncate text-[11px] text-slate-500">Selected: {fileName}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-1 text-[11px] leading-4 text-slate-500">
        {hint ?? "Image upload storage is coming soon. Your selection previews in this tab."}
      </p>
    </div>
  );
}
