"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface HistoryItem {
  photoURL: string;
  generatedPoem: string;
  // Add other properties you might want to display
}

export default function SharedHistoryPage() {
  const { shareId } = useParams();
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSharedItem = async () => {
      if (!shareId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const q = query(collection(db, 'uploads'), where('shareableId', '==', shareId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Assuming there's only one item per shareableId
          const itemData = querySnapshot.docs[0].data() as HistoryItem;
          setHistoryItem(itemData);
        } else {
          setHistoryItem(null); // Item not found
        }
      } catch (error) {
        console.error('Error fetching shared item:', error);
        setHistoryItem(null); // Handle error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedItem();
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-primary">Loading shared item...</p>
      </div>
    );
  }

  if (!historyItem) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Shared item not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-xl p-6 border border-border">
        <h1 className="text-3xl font-headline font-bold text-primary mb-4 text-center">Shared Creation</h1>
        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="md:w-1/2 mb-6 md:mb-0">
            {historyItem.photoURL ? (
              <img src={historyItem.photoURL} alt="Shared Photo" className="rounded-md object-cover w-full h-auto" />
            ) : (
              <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          <div className="md:w-1/2">
            <h2 className="text-xl font-semibold text-foreground mb-2">The Poem:</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{historyItem.generatedPoem}</p>
          </div>
        </div>
      </div>
    </div>
  );
}