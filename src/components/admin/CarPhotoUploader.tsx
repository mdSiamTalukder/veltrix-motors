"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VEHICLE_IMAGES,
  formatBytes,
} from "@/lib/validation";

export type CarImageDraft =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; preview: string };

type CarPhotoUploaderProps = {
  images: CarImageDraft[];
  onChange: (next: CarImageDraft[]) => void;
  disabled?: boolean;
};

const ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

const EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif)$/i;

export default function CarPhotoUploader({
  images,
  onChange,
  disabled = false,
}: CarPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.kind === "new") {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (disabled || !fileList || fileList.length === 0) {
      return;
    }

    const incoming = Array.from(fileList);
    const accepted: CarImageDraft[] = [];
    const problems: string[] = [];
    const remaining = MAX_VEHICLE_IMAGES - images.length;

    if (remaining <= 0) {
      setError(`You can add up to ${MAX_VEHICLE_IMAGES} photos per car.`);
      return;
    }

    for (const file of incoming) {
      if (accepted.length >= remaining) {
        problems.push(`Only ${MAX_VEHICLE_IMAGES} photos are allowed per car.`);
        break;
      }

      const mimeOk = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
        file.type,
      );
      const extensionOk = EXTENSION_PATTERN.test(file.name);

      if (!mimeOk && !extensionOk) {
        problems.push(`"${file.name}" is not a JPEG, PNG, WebP, or GIF.`);
        continue;
      }

      if (file.size === 0) {
        problems.push(`"${file.name}" is empty and cannot be uploaded.`);
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        problems.push(
          `"${file.name}" is larger than ${formatBytes(MAX_IMAGE_BYTES)}.`,
        );
        continue;
      }

      accepted.push({
        id: crypto.randomUUID(),
        kind: "new",
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      onChange([...images, ...accepted]);
    }

    setError(problems.join(" "));
  }

  function removeImage(id: string) {
    const target = images.find((image) => image.id === id);

    if (target?.kind === "new") {
      URL.revokeObjectURL(target.preview);
    }

    onChange(images.filter((image) => image.id !== id));
    setError("");
  }

  function makeCover(id: string) {
    const target = images.find((image) => image.id === id);

    if (!target) {
      return;
    }

    onChange([target, ...images.filter((image) => image.id !== id)]);
  }

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  return (
    <div className="form-control gap-2 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-text font-medium">Car Photos</span>
        <span className="text-xs opacity-55">
          {images.length}/{MAX_VEHICLE_IMAGES} · up to{" "}
          {formatBytes(MAX_IMAGE_BYTES)} each
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="btn btn-outline w-full gap-2 border-dashed sm:w-auto"
      >
        <UploadCloud size={18} />
        Upload Car Photos
      </button>

      <div
        role="button"
        tabIndex={0}
        aria-label="Drag and drop car photos here, or click to browse"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed px-4 py-7 text-center text-sm transition ${
          dragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-base-300 text-base-content/60 hover:border-primary/60"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <ImagePlus size={26} className="opacity-70" />
        <span className="font-medium">
          Drag &amp; drop photos here
        </span>
        <span className="text-xs opacity-60">
          JPEG, PNG, WebP or GIF. The first photo is used as the cover.
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-box border border-base-300 bg-base-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.kind === "new" ? image.preview : image.url}
                alt={`Vehicle photo ${index + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />

              {index === 0 && (
                <span className="badge badge-primary badge-sm absolute left-2 top-2 gap-1 border-0">
                  <Star size={11} />
                  Cover
                </span>
              )}

              <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                {index !== 0 && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => makeCover(image.id)}
                    className="btn btn-xs flex-1 gap-1"
                  >
                    <Star size={12} />
                    Cover
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeImage(image.id)}
                  className="btn btn-error btn-xs flex-1 gap-1 text-white"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  );
}
