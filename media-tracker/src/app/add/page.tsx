"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult, MediaDetails } from '@/types/tmdb';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function AddMediaPage() {
  const router = useRouter();
  const [status, setStatus] = useState('to-watch');
  const [hype, setHype] = useState('medium');
  const [comment, setComment] = useState('');
  const [isImperdivel, setIsImperdivel] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMediaDetails, setSelectedMediaDetails] = useState<MediaDetails | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setSearchResults(data.results))
        .catch(error => console.error("Search failed:", error))
        .finally(() => setIsLoading(false));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectMedia = async (media: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsFetchingDetails(true);
    try {
      const res = await fetch(`/api/details?id=${media.id}&type=${media.media_type}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const details: MediaDetails = await res.json();
      setSelectedMediaDetails(details);
    } catch (error) {
      console.error("Failed to fetch media details:", error);
      setSelectedMediaDetails(null);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMediaDetails) {
      alert("Por favor, selecione uma mídia antes de salvar.");
      return;
    }

    setIsSaving(true);

    try {
      const mediaData = {
        userId: "user1", // Hardcoded for now
        tmdbId: selectedMediaDetails.id,
        title: selectedMediaDetails.title || selectedMediaDetails.name || "N/A",
        type: selectedMediaDetails.media_type,
        posterPath: selectedMediaDetails.poster_path,
        overview: selectedMediaDetails.overview,
        status,
        hype,
        isImperdivel,
        comment: status === 'on-hold' ? comment : '',
        watchProviders: selectedMediaDetails["watch/providers"]?.results?.BR?.flatrate || [],
        addedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "media"), mediaData);

      alert("Mídia salva com sucesso!");
      router.push('/');

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const watchProviders = selectedMediaDetails?.["watch/providers"]?.results?.BR?.flatrate || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Adicionar Mídia</h1>

      {/* Search Section */}
      <div className="mb-8">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar no TMDB</label>
        <input type="text" name="search" id="search" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
          placeholder="Ex: The Office, Blade Runner, etc."
          disabled={isFetchingDetails || isSaving}
        />
        {(isLoading || isFetchingDetails) && <p className="mt-2">{isFetchingDetails ? 'Buscando detalhes...' : 'Buscando...'}</p>}
        {searchResults.length > 0 && (
          <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto">
            {searchResults.map(media => (
              <li key={media.id} onClick={() => handleSelectMedia(media)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                {media.title || media.name} ({media.media_type === 'tv' ? 'Série' : 'Filme'} - {new Date(media.release_date || media.first_air_date || '').getFullYear() || 'N/A'})
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="my-8 border-gray-300 dark:border-gray-600" />

      {/* Media Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
          <input type="text" name="title" id="title" value={selectedMediaDetails ? (selectedMediaDetails.title || selectedMediaDetails.name) : ''} readOnly
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-800"
          />
        </div>

        {/* Synopsis */}
        <div>
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sinopse</label>
          <textarea id="synopsis" name="synopsis" rows={4} value={selectedMediaDetails ? selectedMediaDetails.overview : ''} readOnly
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-800"
          ></textarea>
        </div>

        {/* Watch Providers */}
        {watchProviders.length > 0 && (
          <div>
            <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disponível em:</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {watchProviders.map(provider => (
                <div key={provider.provider_id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                   <Image src={`https://image.tmdb.org/t/p/w500${provider.logo_path}`} alt={provider.provider_name} width={32} height={32} className="rounded-full" />
                   <span>{provider.provider_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
          >
            <option value="to-watch">Para Assistir</option>
            <option value="watching">Assistindo</option>
            <option value="on-hold">Parado</option>
          </select>
        </div>

        {/* Comment (Conditional) */}
        {status === 'on-hold' && (
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo (Parado)</label>
            <textarea id="comment" name="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700"
              placeholder="Por que você parou de assistir?"
            ></textarea>
          </div>
        )}

        {/* Hype Level */}
        <div>
          <label htmlFor="hype" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nível de Hype</label>
          <select id="hype" name="hype" value={hype} onChange={e => setHype(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
          >
            <option value="low">Baixo</option>
            <option value="medium">Médio</option>
            <option value="high">Alto</option>
          </select>
        </div>

        {/* Imperdível Recommendation */}
        <div className="flex items-center">
          <input id="imperdivel" name="imperdivel" type="checkbox" checked={isImperdivel} onChange={e => setIsImperdivel(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
          />
          <label htmlFor="imperdivel" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Marcar como recomendação imperdível</label>
        </div>

        {/* Submit Button */}
        <div>
          <button type="submit" disabled={!selectedMediaDetails || isSaving}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
