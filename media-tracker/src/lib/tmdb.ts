import { SearchResponse, MediaDetails } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchFromTMDB(path: string, params: Record<string, string> = {}) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured.');
  }

  const defaultParams = {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
  };

  const allParams = new URLSearchParams({ ...defaultParams, ...params });
  const url = `${API_BASE_URL}/${path}?${allParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Error fetching from TMDB:', response.statusText);
      throw new Error(`Failed to fetch data from TMDB. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchFromTMDB:', error);
    throw new Error('An error occurred while communicating with TMDB.');
  }
}

export const searchMedia = async (query: string): Promise<SearchResponse> => {
  if (!query) {
    return { results: [] };
  }

  const data: SearchResponse = await fetchFromTMDB('search/multi', { query });

  // Filter out people from search results, we only want movies and tv shows
  const filteredResults = data.results.filter(
    (result) => result.media_type === 'movie' || result.media_type === 'tv'
  );

  return { results: filteredResults };
};

export const getMediaDetails = async (mediaType: 'movie' | 'tv', mediaId: number): Promise<MediaDetails> => {
  const data: MediaDetails = await fetchFromTMDB(`${mediaType}/${mediaId}`, {
    append_to_response: 'watch/providers',
  });
  return data;
};
