// app/history/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage, auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Loader2, History, LogOut, UserCircle, ImageIcon } from "lucide-react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import SearchAndFilterBar from "./SearchAndFilterBar";
import HistoryEntry from "./HistoryEntry";
import ShareModal from "./ShareModal";

export default function HistoryPage() {
  const { user, isAuthLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("All");

  // Share modal state
  const [shareEntry, setShareEntry] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/");
    }
  }, [isAuthLoading, user, router]);

  // Real-time user history from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "userHistory"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: any[] = [];
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setHistory(items);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch history.");
        setHistory([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Delete a history entry and its image from Storage
  const handleDelete = async (entry: any) => {
    if (!entry?.id || !entry?.photoFileName || !user) return;
    setDeletingId(entry.id);
    setError(null);

    try {
      await deleteDoc(doc(db, "userHistory", entry.id));
      const storageRef = ref(storage, `user_uploads/${user.uid}/${entry.photoFileName}`);
      await deleteObject(storageRef);
    } catch (err) {
      setError("Failed to delete entry or its image.");
    } finally {
      setDeletingId(null);
    }
  };

  // Download a history entry as PDF
  const handleDownloadPdf = async (entry: any) => {
    try {
      const docPdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
      });
      const pageWidth = docPdf.internal.pageSize.getWidth();
      const pageHeight = docPdf.internal.pageSize.getHeight();
      const margin = 40;

      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(24);
      const titleText = entry.title || "Photo Poet";
      const titleX = (pageWidth - docPdf.getTextWidth(titleText)) / 2;
      docPdf.text(titleText, titleX, margin);

      let imgSrc = entry.photoDataUri || entry.photoURL;
      const img = new window.Image();
      img.src = imgSrc;
      await new Promise<void>((resolve) => (img.onload = () => resolve()));

      const availableHeight = pageHeight / 2 - margin * 1.5;
      let imgWidth = pageWidth - margin * 2;
      let imgHeight = imgWidth * (img.height / img.width);
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * (img.width / img.height);
      }
      const xImg = (pageWidth - imgWidth) / 2;
      const yImg = margin + 20;
      docPdf.addImage(imgSrc, "JPEG", xImg, yImg, imgWidth, imgHeight);

      const yAfterImage = yImg + imgHeight + 30;
      docPdf.setFont("helvetica", "italic");
      docPdf.setFontSize(16);
      const styleText = `Style: ${entry.selectedStyle}`;
      docPdf.text(styleText, margin, yAfterImage);

      // Title and note
      let yTitle = yAfterImage + 22;
      if (entry.note) {
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(14);
        docPdf.text("Note: " + entry.note, margin, yTitle);
        yTitle += 20;
      }

      const yPoemStart = yTitle + 10;
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(12);
      const splitPoem = docPdf.splitTextToSize(
        entry.generatedPoem,
        pageWidth - margin * 2
      );
      docPdf.text(splitPoem, margin, yPoemStart);

      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(10);

      let footerText = "Generated: ";
      if (entry.createdAt?.toDate) {
        footerText += entry.createdAt.toDate().toLocaleDateString();
      } else if (entry.createdAt && typeof entry.createdAt === "string") {
        footerText += new Date(entry.createdAt).toLocaleDateString();
      } else {
        footerText += "Unknown";
      }

      const footerX = pageWidth - margin - docPdf.getTextWidth(footerText);
      const footerY = pageHeight - margin / 2;
      docPdf.text(footerText, footerX, footerY);

      const baseName = entry.photoFileName?.replace(/\.[^.]+$/, "") || "poem";
      const filename = `${entry.selectedStyle
        .toLowerCase()
        .replace(/\s+/g, "-")}_${baseName}.pdf`;
      docPdf.save(filename);
    } catch (err) {
      alert("Could not generate PDF. Please try again.");
    }
  };

  // Update title/note for entry
  const handleUpdateTitle = async (entry: any, newTitle: string, newNote: string) => {
    if (!entry?.id) return;
    try {
      await updateDoc(doc(db, "userHistory", entry.id), {
        title: newTitle,
        note: newNote,
      });
    } catch {
      alert("Failed to update title or note.");
    }
  };

  // Filtered and searched history (memoized for performance)
  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (selectedStyle !== "All") {
      filtered = filtered.filter((h) => h.selectedStyle === selectedStyle);
    }
    if (searchTerm.trim()) {
      const t = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (h) =>
          (h.title && h.title.toLowerCase().includes(t)) ||
          (h.note && h.note.toLowerCase().includes(t)) ||
          (h.generatedPoem && h.generatedPoem.toLowerCase().includes(t))
      );
    }
    return filtered;
  }, [history, selectedStyle, searchTerm]);

  if (isAuthLoading || (!user && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      {/* Nav Bar with Logout */}
      <nav className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <Link href="/" className="text-2xl font-headline font-bold text-primary">
            Photo Poet
          </Link>
        </div>
        {user && !user.isAnonymous && (
          <div className="flex items-center gap-2">
            <UserCircle className="h-7 w-7 text-primary" />
            <p className="text-base text-foreground font-medium hidden md:block">
              {user.email ?? "User"}
            </p>
            <Button
              onClick={() => auth && signOut(auth)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </nav>

      <header className="w-full max-w-4xl mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1">
          My History
        </h1>
        <p className="text-lg text-muted-foreground">
          Your collection of poetic photos and verses.
        </p>
      </header>

      <SearchAndFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
      />

      <main className="w-full max-w-4xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading history...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4" />
            <p>No history yet. Start by creating your first poem!</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {filteredHistory.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onDownload={handleDownloadPdf}
                onShare={(e) => {
                  setShareEntry(e);
                  setShareOpen(true);
                }}
                onUpdateTitle={handleUpdateTitle}
              />
            ))}
          </div>
        )}
      </main>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        entry={shareEntry}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Photo Poet. All rights reserved.</p>
      </footer>
    </div>
  );
}
