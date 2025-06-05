
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { analyzePhotoThemes } from "@/ai/flows/analyze-photo-themes";
import type { AnalyzePhotoThemesOutput } from "@/ai/flows/analyze-photo-themes";
import { generatePoemFromThemes } from "@/ai/flows/generate-poem-from-themes";
import type { GeneratePoemFromThemesOutput } from "@/ai/flows/generate-poem-from-themes";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UploadCloud, Download, Loader2, Image as ImageIcon, FileText, LogOut, BookUser, UserCircle, History } from "lucide-react";

const poeticStyles = ["Haiku", "Limerick", "Sonnet", "Free Verse", "Ode", "Ballad", "Epic"];

export default function PhotoPoetPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(poeticStyles[0]);
  const [generatedPoem, setGeneratedPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poemKey, setPoemKey] = useState(0);

  const { user, auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) {
        router.push("/auth");
      } else {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);


  useEffect(() => {
    if (generatedPoem) {
      setPoemKey(prevKey => prevKey + 1);
    }
  }, [generatedPoem]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photoFile || !photoPreview) {
      setError("Please upload a photo first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPoem(null);

    try {
      const analysisResult: AnalyzePhotoThemesOutput = await analyzePhotoThemes({ photoDataUri: photoPreview });
      if (!analysisResult.themes || !analysisResult.emotions) {
        throw new Error("Could not analyze photo themes and emotions.");
      }
      
      const poemResult: GeneratePoemFromThemesOutput = await generatePoemFromThemes({
        themes: analysisResult.themes,
        emotions: analysisResult.emotions,
        style: selectedStyle,
      });
      
      setGeneratedPoem(poemResult.poem);

      if (user && poemResult.poem && photoPreview && photoFile) {
        try {
          await addDoc(collection(db, "userHistory"), {
            userId: user.uid,
            photoPreview: photoPreview,
            photoFileName: photoFile.name,
            selectedStyle: selectedStyle,
            generatedPoem: poemResult.poem,
            createdAt: serverTimestamp(),
          });
        } catch (saveError) {
          console.error("Error saving history:", saveError);
          // Optionally, inform the user that history saving failed, e.g., using a toast.
        }
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during poem generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (photoPreview && photoFile) {
      const imgLink = document.createElement('a');
      imgLink.href = photoPreview;
      imgLink.download = photoFile.name || 'photo.png';
      document.body.appendChild(imgLink);
      imgLink.click();
      document.body.removeChild(imgLink);
    }

    if (generatedPoem) {
      const poemBlob = new Blob([generatedPoem], { type: 'text/plain;charset=utf-8' });
      const poemUrl = URL.createObjectURL(poemBlob);
      const poemLink = document.createElement('a');
      poemLink.href = poemUrl;
      poemLink.download = `${selectedStyle.toLowerCase().replace(' ', '-')}-poem.txt`;
      document.body.appendChild(poemLink);
      poemLink.click();
      document.body.removeChild(poemLink);
      URL.revokeObjectURL(poemUrl);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your canvas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <header className="w-full max-w-6xl mb-8 md:mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-7 w-7 text-primary"/>
              <p className="text-lg text-foreground font-medium">Welcome, {user.email}</p>
            </div>
            <Link href="/history" passHref>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" />
                My History
              </Button>
            </Link>
          </div>
          <Button onClick={() => auth && signOut(auth)} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <BookUser className="h-12 w-12 text-primary" />
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary">Photo Poet</h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mt-1">Transform your photos into lyrical masterpieces.</p>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center text-primary">
              <UploadCloud className="mr-3 h-8 w-8" />
              Craft Your Verse
            </CardTitle>
            <CardDescription className="text-muted-foreground">Upload a photo and select a poetic style to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="photo-upload" className="text-base font-medium text-foreground">Upload Photo</Label>
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
                <Label htmlFor="style-select" className="text-base font-medium text-foreground">Poetic Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger id="style-select" className="w-full mt-1 text-foreground">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {poeticStyles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full text-lg py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isLoading || !photoFile}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : "Generate Poem"}
              </Button>

              {error && (
                <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md border border-destructive/30">{error}</p>
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
            <CardDescription className="text-muted-foreground">Behold the photo that inspired, and the poem it birthed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {photoPreview && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-inner bg-muted/30">
                <NextImage src={photoPreview} alt="Uploaded photo preview" layout="fill" objectFit="contain" data-ai-hint="user uploaded image"/>
              </div>
            )}
            {!photoPreview && !generatedPoem && (
               <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full rounded-lg bg-muted/20 border-2 border-dashed border-muted/50">
                <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/70" />
                <p>Your photo and poem will appear here.</p>
              </div>
            )}
            
            {generatedPoem && (
              <div key={poemKey} className="p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in-0 duration-1000">
                <h3 className="text-xl font-semibold font-headline mb-2 text-primary">{selectedStyle} Poem</h3>
                <Textarea
                  readOnly
                  value={generatedPoem}
                  className="w-full h-64 text-base bg-transparent border-none focus-visible:ring-0 resize-none whitespace-pre-wrap leading-relaxed text-foreground/90"
                  aria-label="Generated poem"
                />
              </div>
            )}

            {(photoPreview || generatedPoem) && (
              <Button onClick={handleDownload} variant="outline" className="w-full text-lg py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
                <Download className="mr-2 h-5 w-5" />
                Download Results
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
