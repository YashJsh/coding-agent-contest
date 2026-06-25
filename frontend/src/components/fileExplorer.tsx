import { useState } from "react";

type File = {
  name: string;
  content: string;
};

export default function FileExplorer({
  files,
}: {
  files: File[];
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(
    files[0] ?? null
  );

  return (
    <div className="h-full flex">
      {/* File list */}
      <div className="w-64 border-r p-4 space-y-2">
        <h2>Files</h2>

        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setSelectedFile(file)}
            className="block w-full text-left border p-2"
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* File content */}
      <div className="flex-1 p-4">
        {selectedFile ? (
          <>
            <h3>{selectedFile.name}</h3>

            <pre className="mt-4 whitespace-pre-wrap">
              {selectedFile.content}
            </pre>
          </>
        ) : (
          <p>No file selected</p>
        )}
      </div>
    </div>
  );
}
