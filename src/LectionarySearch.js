import React, { useState } from 'react';
import { Search } from 'lucide-react';

// Sample reading class structure
class Reading {
  constructor(text, date, source) {
    this.text = text;
    this.date = date;
    this.source = source;
  }
}

const LectionarySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isVerseSearch, setIsVerseSearch] = useState(false);

  // Sample data - replace with your actual readings
  const readings = [
    new Reading(
      "The Lord said to Moses: Go up this mountain...",
      "2025-01-20",
      "Exodus 3:1-12"
    ),
    new Reading(
      "Salvation belongs to our God who sits upon the throne.",
      "2025-01-21",
      "Revelation 7:10"
    ),
    // Add more readings here
  ];

  const parseVerseReference = (reference) => {
    // Match format like "Genesis 1:1" or "Gen 1:1"
    const match = reference.match(/^(\w+)\s+(\d+):(\d+)$/);
    if (!match) return null;
    return {
      book: match[1],
      chapter: match[2],
      verse: match[3]
    };
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const verseReference = parseVerseReference(searchQuery);
    setIsVerseSearch(!!verseReference);

    if (verseReference) {
      // Search by verse reference
      const results = readings.filter(reading => {
        const readingRef = parseVerseReference(reading.source);
        return readingRef && 
               readingRef.book.toLowerCase().startsWith(verseReference.book.toLowerCase()) &&
               readingRef.chapter === verseReference.chapter &&
               readingRef.verse === verseReference.verse;
      });
      setSearchResults(results);
    } else {
      // Search by keyword
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const results = readings.filter(reading =>
        searchTerms.every(term => 
          reading.text.toLowerCase().includes(term) ||
          reading.source.toLowerCase().includes(term)
        )
      );
      setSearchResults(results);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Catholic Lectionary Search</h1>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter search term or verse (e.g., 'mountain' or 'Genesis 1:1')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      <div>
        {searchResults.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">
              {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'} found
              {isVerseSearch ? ' for verse reference:' : ' for search term:'}
              <span className="ml-2 font-normal">{searchQuery}</span>
            </h3>
            {searchResults.map((result, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{result.source}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{result.text}</p>
              </div>
            ))}
          </>
        ) : searchQuery ? (
          <p className="text-gray-500">No results found for: {searchQuery}</p>
        ) : null}
      </div>
    </div>
  );
};

export default LectionarySearch;