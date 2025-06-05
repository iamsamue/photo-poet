"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import NextImage from "next/image";
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
import { UploadCloud, Download, Loader2, Image as ImageIcon, FileText } from "lucide-react";

const poeticStyles = ["Haiku", "Limerick", "Sonnet", "Free Verse", "Ode", "Ballad", "Epic"];

export default function PhotoPoetPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(poeticStyles[0]);
  const [generatedPoem, setGeneratedPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poemKey, setPoemKey] = useState(0); // For re-triggering animation

  const { user, auth } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="mb-8 md:mb-12 text-center">
        {user ? (
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg">Welcome, {user.email}</p>
            <Button onClick={() => auth && signOut(auth)} variant="outline">Sign Out</Button>
          </div>
        ) : null}

        <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary">Photo Poet</h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-2">Transform your photos into lyrical masterpieces.</p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center">
              <UploadCloud className="mr-3 h-8 w-8 text-primary" />
              Craft Your Verse
            </CardTitle>
            <CardDescription>Upload a photo and select a poetic style to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="photo-upload" className="text-base font-medium">Upload Photo</Label>
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
                <Label htmlFor="style-select" className="text-base font-medium">Poetic Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger id="style-select" className="w-full mt-1">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {poeticStyles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !photoFile}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : "Generate Poem"}
              </Button>

              {error && (
                <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center">
              <FileText className="mr-3 h-8 w-8 text-accent" />
              Your Masterpiece
            </CardTitle>
            <CardDescription>Behold the photo that inspired, and the poem it birthed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {photoPreview && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-inner">
                <NextImage src={photoPreview} alt="Uploaded photo preview" layout="fill" objectFit="contain" data-ai-hint="user uploaded image"/>
              </div>
            )}
            {!photoPreview && !generatedPoem && (
               <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                <ImageIcon className="h-16 w-16 mb-4" />
                <p>Your photo and poem will appear here.</p>
              </div>
            )}
            
            {generatedPoem && (
              <div key={poemKey} className="p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in-0 duration-1000">
                <h3 className="text-xl font-semibold font-headline mb-2 text-primary">{selectedStyle} Poem</h3>
                <Textarea
                  readOnly
                  value={generatedPoem}
                  className="w-full h-64 text-base bg-transparent border-none focus-visible:ring-0 resize-none whitespace-pre-wrap leading-relaxed"
                  aria-label="Generated poem"
                />
              </div>
            )}

            {(photoPreview || generatedPoem) && (
              <Button onClick={handleDownload} variant="outline" className="w-full text-lg py-6" disabled={isLoading}>
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
