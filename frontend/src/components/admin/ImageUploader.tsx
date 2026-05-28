import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  label?: string;
  className?: string;
};

export function ImageUploader({ currentUrl, onChange, label = 'Imagen', className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [file, setFile] = useState<File | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onChange(f);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{label}</p>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 transition-colors hover:border-[#53AC30]/60"
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="h-48 w-full object-contain" />
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white shadow"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-neutral-500">
            <Upload className="size-6" />
            <p>Arrastra una imagen o haz clic para seleccionar</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {file ? (
        <p className="text-xs text-neutral-500">
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" /> Cambiar imagen
      </Button>
    </div>
  );
}
