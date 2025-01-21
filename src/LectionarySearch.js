import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

// Date formatting function
const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 6) return 'Invalid Date';
  const month = dateStr.substring(0, 2);
  const day = dateStr.substring(2, 4);
  const year = '20' + dateStr.substring(4, 6);  // Add '20' prefix for year
  return `${month}/${day}/${year}`;
};

const ResultCard = ({ reading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = reading.text.slice(0, 100) + (reading.text.length > 100 ? '...' : '');
  
  return (
    <div className="mb-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-blue-600">{reading.source}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {formatDate(reading.date)}
            </span>
            {isExpanded ? 
              <ChevronUp className="w-4 h-4 text-gray-500" /> : 
              <ChevronDown className="w-4 h-4 text-gray-500" />
            }
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-line">
          {isExpanded ? reading.text : previewText}
        </p>
      </div>
    </div>
  );
};

const LectionarySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isVerseSearch, setIsVerseSearch] = useState(false);
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce function to limit how often we search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearchInput = React.useCallback(
    debounce((value) => {
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }

      if (value.includes(',')) {
        // Split by comma and trim whitespace
        const searchTerms = value.toLowerCase().split(',').map(term => term.trim());
        const results = readings.filter(reading =>
          searchTerms.every(term => 
            reading.text.toLowerCase().includes(term) ||
            reading.source.toLowerCase().includes(term)
          )
        );
        setSearchResults(results);
      } else {
        // Exact phrase search
        const results = readings.filter(reading =>
          reading.text.toLowerCase().includes(value.toLowerCase()) ||
          reading.source.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(results);
      }
    }, 300),
    [readings]
  );
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const loadReadings = async () => {
      try {
        setDebugInfo('Attempting to load readings...');
        const response = await fetch('/lectionary-search/readings.json');
        setDebugInfo(prev => prev + `\nFetch response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDebugInfo(prev => prev + '\nParsed JSON successfully');

        // Filter out invalid readings
        const validReadings = [];
        const skippedReadings = [];

        data.forEach((reading, index) => {
          const hasValidText = reading.text && reading.text.trim() !== '';
          const hasValidDate = reading.date && reading.date.trim() !== '';
          const hasValidSource = reading.source && reading.source.trim() !== '';

          if (hasValidText && hasValidDate && hasValidSource) {
            validReadings.push(reading);
          } else {
            skippedReadings.push({
              index,
              source: reading.source || 'No source',
              date: reading.date || 'No date',
              reason: [
                !hasValidText && 'Missing text',
                !hasValidDate && 'Missing date',
                !hasValidSource && 'Missing source'
              ].filter(Boolean).join(', ')
            });
          }
        });

        setDebugInfo(prev => prev + `\nTotal readings found: ${data.length}`);
        setDebugInfo(prev => prev + `\nValid readings: ${validReadings.length}`);
        
        if (skippedReadings.length > 0) {
          setDebugInfo(prev => prev + '\n\nSkipped readings:');
          skippedReadings.forEach(({ index, source, date, reason }) => {
            setDebugInfo(prev => prev + `\n[${index}] ${source} (${date}): ${reason}`);
          });
        }

        setReadings(validReadings);
        setIsLoading(false);

      } catch (err) {
        console.error('Error loading readings:', err);
        setError(`Error loading readings: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadReadings();
  }, []);

  const parseVerseReference = (reference) => {
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
      const results = readings.filter(reading => {
        const readingRef = parseVerseReference(reading.source);
        return readingRef && 
               readingRef.book.toLowerCase().startsWith(verseReference.book.toLowerCase()) &&
               readingRef.chapter === verseReference.chapter &&
               readingRef.verse === verseReference.verse;
      });
      setSearchResults(results);
    } else {
      // Check if it's a comma-delimited search
      if (searchQuery.includes(',')) {
        // Split by comma and trim whitespace
        const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim());
        const results = readings.filter(reading =>
          searchTerms.every(term => 
            reading.text.toLowerCase().includes(term) ||
            reading.source.toLowerCase().includes(term)
          )
        );
        setSearchResults(results);
      } else {
        // Exact phrase search
        const results = readings.filter(reading =>
          reading.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reading.source.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Catholic Lectionary Search
          </h1>
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded text-sm">
              Failed to load readings. Please try again later.
            </div>
          )}
          <p className="text-gray-600 mb-8">
            Search by exact phrase, verse reference (e.g., "Genesis 1:1"), or multiple terms separated by commas (e.g., "Peter, Andrew")
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 shadow-lg rounded-lg overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Type an exact phrase or multiple terms separated by commas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchInput(e.target.value);
                }}
                className="flex-1 p-4 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSearchInput(searchQuery)}
                className={`px-6 py-4 bg-blue-500 text-white flex items-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                } transition-colors`}
                disabled={isLoading}
              >
                <Search className="w-5 h-5" />
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading readings...
            </div>
          ) : (
            <>
              {searchResults.length > 0 && (
                <h3 className="text-lg font-semibold mb-6 text-gray-700">
                  {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'} found
                  {isVerseSearch ? ' for verse reference:' : ' for search term:'} 
                  <span className="ml-2 font-normal">"{searchQuery}"</span>
                </h3>
              )}
              
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <ResultCard key={index} reading={result} />
                ))}
              </div>
              
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found for: "{searchQuery}"
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectionarySearch;