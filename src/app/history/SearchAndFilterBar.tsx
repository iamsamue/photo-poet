// app/history/SearchAndFilterBar.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const poeticStyles = [
  "All",
  "Haiku",
  "Limerick",
  "Sonnet",
  "Free Verse",
  "Ode",
  "Ballad",
  "Epic",
];

export default function SearchAndFilterBar({
  searchTerm,
  setSearchTerm,
  selectedStyle,
  setSelectedStyle,
}: {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-8 w-full">
      <Input
        placeholder="Search by title, note, or poem..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1"
      />
      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Style" />
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
  );
}
