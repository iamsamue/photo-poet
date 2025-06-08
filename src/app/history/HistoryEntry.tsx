// app/history/HistoryEntry.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Share2, Edit2, Check, X } from "lucide-react";
import NextImage from "next/image";
import { Textarea } from "@/components/ui/textarea";

export default function HistoryEntry({
  entry,
  onDelete,
  onDownload,
  onShare,
  onUpdateTitle,
}: {
  entry: any;
  onDelete: (entry: any) => void;
  onDownload: (entry: any) => void;
  onShare: (entry: any) => void;
  onUpdateTitle: (entry: any, newTitle: string, newNote: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(entry.title || "");
  const [note, setNote] = useState(entry.note || "");

  const save = () => {
    onUpdateTitle(entry, title, note);
    setEditMode(false);
  };

  return (
    <div className="bg-card rounded-xl shadow-md p-6 flex flex-col md:flex-row gap-6 border border-primary/10">
      <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border-2 border-primary/20 shadow-inner bg-muted/30 mx-auto md:mx-0">
        <NextImage
          src={entry.photoDataUri || entry.photoURL}
          alt={entry.title || "User uploaded photo"}
          fill
          style={{ objectFit: "contain" }}
        />
      </div>
      <div className="flex-1 flex flex-col gap-3 justify-between">
        <div>
          {editMode ? (
            <div className="mb-2">
              <input
                className="mb-1 border rounded p-2 w-full font-semibold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="mb-1"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={save}>
                  <Check className="w-4 h-4 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold font-headline text-primary mb-1">
                {entry.title || "Untitled Poem"}
              </h3>
              {entry.note && <p className="text-base mb-2">{entry.note}</p>}
              <Button
                size="sm"
                variant="outline"
                className="mb-2"
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="w-4 h-4 mr-1" /> Edit Title/Note
              </Button>
            </>
          )}

          <span className="text-sm text-muted-foreground mb-1">
            Style: {entry.selectedStyle}
          </span>
          <div className="whitespace-pre-wrap bg-primary/5 rounded p-3 text-base mb-2 text-foreground/90">
            {entry.generatedPoem}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onDownload(entry)}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => onShare(entry)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="destructive" onClick={() => onDelete(entry)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Created:{" "}
          {entry.createdAt?.toDate
            ? entry.createdAt.toDate().toLocaleString()
            : entry.createdAt && typeof entry.createdAt === "string"
            ? new Date(entry.createdAt).toLocaleString()
            : "Unknown"}
        </p>
      </div>
    </div>
  );
}
