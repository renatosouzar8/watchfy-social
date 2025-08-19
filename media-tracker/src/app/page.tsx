"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import Image from 'next/image';

interface MediaItem extends DocumentData {
  id: string;
}

const MediaCard = ({ item }: { item: MediaItem }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex">
    <div className="w-1/3">
      <Image
        src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
        alt={`Pôster de ${item.title}`}
        width={150}
        height={225}
        className="object-cover"
      />
    </div>
    <div className="p-4 w-2/3 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold">{item.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hype: <span className="font-semibold capitalize">{item.hype}</span></p>
        {item.status === 'on-hold' && item.comment && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Motivo: {item.comment}</p>
        )}
      </div>
      {/* Actions can be added here later */}
    </div>
  </div>
);

const MediaList = ({ items, loading }: { items: MediaItem[], loading: boolean }) => {
  if (loading) {
    return <p>Carregando lista...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p>Você ainda não adicionou nada aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => <MediaCard key={item.id} item={item} />)}
    </div>
  );
};

export default function DashboardPage() {
  const [watching, setWatching] = useState<MediaItem[]>([]);
  const [toWatch, setToWatch] = useState<MediaItem[]>([]);
  const [onHold, setOnHold] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = "user1"; // Hardcoded for now
    const q = query(collection(db, "media"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allMedia: MediaItem[] = [];
      querySnapshot.forEach((doc) => {
        allMedia.push({ id: doc.id, ...doc.data() } as MediaItem);
      });

      setWatching(allMedia.filter(item => item.status === 'watching'));
      setToWatch(allMedia.filter(item => item.status === 'to-watch'));
      setOnHold(allMedia.filter(item => item.status === 'on-hold'));

      setLoading(false);
    }, (error) => {
      console.error("Error fetching media:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Assistindo</h2>
        <MediaList items={watching} loading={loading} />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Para Assistir</h2>
        <MediaList items={toWatch} loading={loading} />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Parado</h2>
        <MediaList items={onHold} loading={loading} />
      </div>
    </div>
  );
}
