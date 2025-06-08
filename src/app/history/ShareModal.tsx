// app/history/ShareModal.tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Twitter, Mail } from "lucide-react";
import { useState } from "react";

export default function ShareModal({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: any;
}) {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const poemText = `Title: ${entry.title || "Untitled"}\n${entry.generatedPoem}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(poemText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const handleWebShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: entry.title || "Photo Poet",
          text: poemText,
          url: shareUrl,
        })
        .catch(() => {});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Poem</DialogTitle>
        </DialogHeader>
        <div className="mb-2">
          <textarea
            className="w-full p-2 rounded border"
            rows={6}
            readOnly
            value={poemText}
          />
        </div>
        <div className="flex gap-2 flex-wrap mb-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            {copied ? "Copied!" : "Copy Poem"}
          </Button>
          <Button
            variant="outline"
            onClick={handleWebShare}
            disabled={!navigator.share}
          >
            <Mail className="w-4 h-4 mr-1" />
            Web Share
          </Button>
          {/* You can add more actual sharing integrations here if desired */}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
