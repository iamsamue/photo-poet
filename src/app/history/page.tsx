
"use client";

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, FileText, ArrowLeft, BookUser, History as HistoryIcon } from 'lucide-react';

interface HistoryItem {
  id: string;
  userId: string;
  photoPreview: string;
  photoFileName: string;
  selectedStyle: string;
  generatedPoem: string;
  createdAt: Timestamp | null; // Allow null for createdAt initially
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { user, auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) {
        router.push('/auth');
      } else {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const q = query(
            collection(db, 'userHistory'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const userHistory: HistoryItem[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure createdAt is treated as Timestamp or null
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : null;
            userHistory.push({ id: doc.id, ...data, createdAt } as HistoryItem);
          });
          setHistory(userHistory);
        } catch (error) {
          console.error("Error fetching history: ", error);
          // Handle error display if needed
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <header className="w-full max-w-6xl mb-8 md:mb-12">
        <div className="flex justify-start items-center mb-6">
          <Link href="/" passHref>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-2">
                <HistoryIcon className="h-12 w-12 text-primary" />
                <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary">Your Poetic Journey</h1>
            </div>
          <p className="text-lg md:text-xl text-muted-foreground mt-1">Revisit your inspired creations.</p>
        </div>
      </header>

      <main className="w-full max-w-6xl">
        {isLoadingHistory && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}
        {!isLoadingHistory && history.length === 0 && (
          <Card className="shadow-lg rounded-xl border border-border">
            <CardContent className="py-10 text-center">
              <ImageIcon className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">No history found.</p>
              <p className="text-sm text-muted-foreground">Start creating poems to see your history here!</p>
            </CardContent>
          </Card>
        )}
        {!isLoadingHistory && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {history.map((item) => (
              <Card key={item.id} className="shadow-xl rounded-xl overflow-hidden flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-2xl text-primary flex items-center">
                    <FileText className="mr-2 h-6 w-6" />
                    {item.selectedStyle} Poem
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {item.createdAt && typeof item.createdAt.toDate === 'function' ? (
                      <>
                        Created on: {item.createdAt.toDate().toLocaleDateString()} at {item.createdAt.toDate().toLocaleTimeString()}
                      </>
                    ) : (
                      'Date not available'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col space-y-4">
                  {item.photoPreview && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border border-primary/20 bg-muted/30">
                      <NextImage src={item.photoPreview} alt={item.photoFileName || "Uploaded photo"} layout="fill" objectFit="contain" data-ai-hint="historical image" />
                    </div>
                  )}
                  <Textarea
                    readOnly
                    value={item.generatedPoem}
                    className="w-full flex-grow text-sm bg-transparent border-none focus-visible:ring-0 resize-none whitespace-pre-wrap leading-relaxed text-foreground/90"
                    aria-label="Generated poem"
                    rows={8}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Photo Poet. All rights reserved.</p>
      </footer>
    </div>
  );
}
