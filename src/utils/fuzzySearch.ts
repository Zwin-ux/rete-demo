/**
 * Fuzzy search utility for enhanced node palette search
 */

/**
 * Performs a fuzzy search on a string
 * @param text The text to search in
 * @param query The search query
 * @returns A score indicating how well the text matches the query (higher is better), or 0 if no match
 */
export function fuzzySearch(text: string, query: string): number {
  if (!query) return 1; // Empty query matches everything
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Direct match gets highest score
  if (lowerText.includes(lowerQuery)) {
    return 2 + (lowerQuery.length / lowerText.length);
  }
  
  let score = 0;
  let lastMatchIndex = -1;
  let consecutiveMatches = 0;
  
  // Check if all characters in query appear in order in the text
  for (let i = 0; i < lowerQuery.length; i++) {
    const char = lowerQuery[i];
    const index = lowerText.indexOf(char, lastMatchIndex + 1);
    
    if (index === -1) {
      return 0; // Character not found, no match
    }
    
    // Consecutive characters get bonus points
    if (index === lastMatchIndex + 1) {
      consecutiveMatches++;
      score += 0.15 * consecutiveMatches;
    } else {
      consecutiveMatches = 0;
    }
    
    // Characters appearing earlier get more points
    score += 1 - (index / lowerText.length);
    
    lastMatchIndex = index;
  }
  
  // Normalize score based on query length
  return score / lowerQuery.length;
}

/**
 * Sorts items based on fuzzy search score
 * @param items Array of items to sort
 * @param query Search query
 * @param getSearchText Function to extract the text to search from each item
 * @returns Sorted array of items with their scores
 */
export function sortByFuzzyScore<T>(
  items: T[], 
  query: string, 
  getSearchText: (item: T) => string
): {item: T, score: number}[] {
  return items
    .map(item => ({
      item,
      score: fuzzySearch(getSearchText(item), query)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
