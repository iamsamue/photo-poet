"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { analyzePhotoThemes } from "@/ai/flows/analyze-photo-themes";
import type { AnalyzePhotoThemesOutput } from "@/ai/flows/analyze-photo-themes";
import NextImage from "next/image";
import { generatePoemFromThemes } from "@/ai/flows/generate-poem-from-themes";
import type { GeneratePoemFromThemesOutput } from "@/ai/flows/generate-poem-from-themes";
import {
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  FileText,
  LogOut,
  BookUser,
  UserCircle,
  History,
  Download,
} from "lucide-react";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";

import { jsPDF } from "jspdf";

const poeticStyles = [
  "Haiku",
  "Limerick",
  "Sonnet",
  "Free Verse",
  "Ode",
  "Ballad",
  "Epic",
];

export default function PhotoPoetPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(
    poeticStyles[0]
  );
  const [generatedPoem, setGeneratedPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poemKey, setPoemKey] = useState(0);

  const { user, auth, isAuthLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Handle file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setPhotoFile(file);
      setError(null);
      setGeneratedPoem(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  // Build a PDF from the in-memory preview + generatedPoem with nicer styling
  const handleDownloadPdf = async () => {
    if (!photoPreview || !generatedPoem) return;

    try {
      const docPdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
      });

      const pageWidth = docPdf.internal.pageSize.getWidth();
      const pageHeight = docPdf.internal.pageSize.getHeight();
      const margin = 40; // wider margin for nicer look

      // 1. Title at top
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(24);
      const titleText = "Photo Poet";
      const titleX = (pageWidth - docPdf.getTextWidth(titleText)) / 2;
      docPdf.text(titleText, titleX, margin);

      // 2. Add the image, constrained to roughly top half minus space for title
      const img = new Image();
      img.src = photoPreview;
      await new Promise<void>((resolve) => (img.onload = () => resolve()));

      // Compute max dimensions: top half of page minus title space
      const availableHeight = pageHeight / 2 - margin * 1.5;
      let imgWidth = pageWidth - margin * 2;
      let imgHeight = imgWidth * (img.height / img.width);
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * (img.width / img.height);
      }
      const xImg = (pageWidth - imgWidth) / 2;
      const yImg = margin + 20; // a bit below title
      docPdf.addImage(photoPreview, "JPEG", xImg, yImg, imgWidth, imgHeight);

      // 3. Poem style as subtitle, below the image
      const yAfterImage = yImg + imgHeight + 30;
      docPdf.setFont("helvetica", "italic");
      docPdf.setFontSize(16);
      const styleText = `Style: ${selectedStyle}`;
      docPdf.text(styleText, margin, yAfterImage);

      // 4. Poem body, normal font
      const yPoemStart = yAfterImage + 20;
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(12);
      const splitPoem = docPdf.splitTextToSize(
        generatedPoem,
        pageWidth - margin * 2
      );
      docPdf.text(splitPoem, margin, yPoemStart);

      // 5. Footer or small note at bottom
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(10);
      const footerText = `Generated on ${new Date().toLocaleDateString()}`;
      const footerX = pageWidth - margin - docPdf.getTextWidth(footerText);
      const footerY = pageHeight - margin / 2;
      docPdf.text(footerText, footerX, footerY);

      // 6. Finally save with a filename
      const baseName = photoFile?.name?.replace(/\.[^.]+$/, "") || "poem";
      const filename = `${selectedStyle
        .toLowerCase()
        .replace(/\s+/g, "-")}_${baseName}.pdf`;
      docPdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Could not generate PDF. Please try again.");
    }
  };

  // Handle “Generate Poem” form submission
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!user) return;

    if (!photoFile || !photoPreview) {
      setError("Please upload a photo first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPoem(null);

    try {
      const analysisResult: AnalyzePhotoThemesOutput =
        await analyzePhotoThemes({ photoDataUri: photoPreview });

      if (!analysisResult.themes || !analysisResult.emotions) {
        throw new Error("Could not analyze photo themes and emotions.");
      }

      const poemResult: GeneratePoemFromThemesOutput =
        await generatePoemFromThemes({
          themes: analysisResult.themes,
          emotions: analysisResult.emotions,
          style: selectedStyle,
        });

      setGeneratedPoem(poemResult.poem);
      setIsLoading(false);

      // Fire‐and‐forget: upload + Firestore write (including photoDataUri)
      (async () => {
        try {
          const storageRef = ref(
            storage,
            `user_uploads/${user.uid}/${photoFile.name}`
          );
          const uploadTask = await uploadBytes(storageRef, photoFile);
          const downloadURL = await getDownloadURL(uploadTask.ref);

          await addDoc(collection(db, "userHistory"), {
            userId: user.uid,
            photoFileName: photoFile.name,
            photoURL: downloadURL,
            photoDataUri: photoPreview, // ◀︎ store the data URI
            selectedStyle,
            generatedPoem: poemResult.poem,
            createdAt: serverTimestamp(),
          });
        } catch (saveError) {
          console.error("Error saving history (background):", saveError);
        }
      })();
    } catch (err: unknown) {
      console.error("Generation error", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during poem generation."
      );
      setIsLoading(false);
    }
  };

  // Re‐render when poem changes
  useEffect(() => {
    if (generatedPoem) {
      setPoemKey((prev) => prev + 1);
    }
  }, [generatedPoem]);

  // Avoid SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <header className="w-full max-w-6xl mb-8 md:mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BookUser className="h-10 w-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              Photo Poet
            </h1>
          </div>

          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-2">
              <UserCircle className="h-7 w-7 text-primary" />
              <p className="text-lg text-foreground font-medium hidden md:block">
                Welcome, {user.email ?? "User"}
              </p>

              <Link href="/history" passHref>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  My History
                </Button>
              </Link>
              <Link href="/history" passHref>
                <Button variant="outline" size="sm" className="md:hidden p-1">
                  <History className="h-4 w-4" />
                </Button>
              </Link>

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
          ) : (
            <Link href="/auth" passHref>
              <Button variant="default" size="sm">
                Sign Up / Login
              </Button>
            </Link>
          )}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <BookUser className="h-12 w-12 text-primary" />
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary">
              Photo Poet
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mt-1">
            Transform your photos into lyrical masterpieces.
          </p>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center text-primary">
              <UploadCloud className="mr-3 h-8 w-8" />
              Craft Your Verse
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload a photo and select a poetic style to begin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="photo-upload" className="text-base font-medium text-foreground">
                  Upload Photo
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="style-select" className="text-base font-medium text-foreground">
                  Poetic Style
                </Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger id="style-select" className="w-full mt-1 text-foreground">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {poeticStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full text-lg py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                disabled={isLoading || !photoFile}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Poem"
                )}
              </Button>

              {error && (
                <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md border border-destructive/30">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center text-accent">
              <FileText className="mr-3 h-8 w-8" />
              Your Masterpiece
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Behold the photo that inspired, and the poem it birthed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {photoPreview && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-inner bg-muted/30">
                <NextImage
                  src={photoPreview}
                  alt="Uploaded photo preview"
                  fill
                  style={{ objectFit: "contain" }}
                  data-ai-hint="user uploaded image"
                />
              </div>
            )}

            {!photoPreview && !generatedPoem && (
              <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full rounded-lg bg-muted/20 border-2 border-dashed border-muted/50">
                <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/70" />
                <p>Your photo and poem will appear here.</p>
              </div>
            )}

            {generatedPoem && (
              <div
                key={poemKey}
                className="p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in-0 duration-1000"
              >
                <h3 className="text-xl font-semibold font-headline mb-2 text-primary">
                  {selectedStyle} Poem
                </h3>
                <Textarea
                  readOnly
                  value={generatedPoem}
                  className="w-full h-64 text-base bg-transparent border-none focus-visible:ring-0 resize-none whitespace-pre-wrap leading-relaxed text-foreground/90"
                  aria-label="Generated poem"
                />
              </div>
            )}

            {(photoPreview || generatedPoem) && (
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                className="w-full text-lg py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                disabled={isLoading || !generatedPoem}
              >
                <Download className="mr-2 h-5 w-5" />
                Download as PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Photo Poet. All rights reserved.</p>
      </footer>
    </div>
  );
}
