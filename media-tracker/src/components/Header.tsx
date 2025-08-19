import React from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

const Header = () => {
  return (
    <header className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Media Tracker
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/add" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
            Adicionar Mídia
          </Link>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
