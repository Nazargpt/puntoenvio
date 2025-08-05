
'use client';

import Link from 'next/link';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center cursor-pointer">
            <img 
              src="https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/889e2c70cce2168523fa4add2f058bea.png" 
              alt="PuntoEnvío Logo" 
              className="h-10 w-auto mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="text-2xl font-bold text-green-400 hidden" style={{ fontFamily: 'Pacifico, serif' }}>
              PuntoEnvío
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-green-300 transition-colors cursor-pointer">Inicio</Link>
            <Link href="/crear-orden" className="hover:text-green-300 transition-colors cursor-pointer">Crear Orden</Link>
            <Link href="/seguimiento" className="hover:text-green-300 transition-colors cursor-pointer">Seguimiento</Link>
            <Link href="/cotizador" className="hover:text-green-300 transition-colors cursor-pointer">Cotizador</Link>
            <Link href="/mapa-agencias" className="hover:text-green-300 transition-colors cursor-pointer">Buscar Agencias</Link>
            <Link href="/contacto" className="hover:text-green-300 transition-colors cursor-pointer">Contacto</Link>
            <div className="flex items-center space-x-4">
              <Link href="/agencias" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-user-line"></i>
                </div>
                <span>Acceso Agencias</span>
              </Link>
              <Link href="/transportistas" className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-truck-line"></i>
                </div>
                <span>Transportistas</span>
              </Link>
              <Link href="/admin" className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap">Admin</Link>
            </div>
          </nav>

          <button 
            className="md:hidden cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-700">
            <div className="flex flex-col space-y-3 pt-4">
              <Link href="/" className="hover:text-green-300 transition-colors cursor-pointer">Inicio</Link>
              <Link href="/crear-orden" className="hover:text-green-300 transition-colors cursor-pointer">Crear Orden</Link>
              <Link href="/seguimiento" className="hover:text-green-300 transition-colors cursor-pointer">Seguimiento</Link>
              <Link href="/cotizador" className="hover:text-green-300 transition-colors cursor-pointer">Cotizador</Link>
              <Link href="/mapa-agencias" className="hover:text-green-300 transition-colors cursor-pointer">Buscar Agencias</Link>
              <Link href="/contacto" className="hover:text-green-300 transition-colors cursor-pointer">Contacto</Link>
              <Link href="/agencias" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-user-line"></i>
                </div>
                <span>Acceso Agencias</span>
              </Link>
              <Link href="/transportistas" className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-truck-line"></i>
                </div>
                <span>Transportistas</span>
              </Link>
              <Link href="/admin" className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap inline-block">Admin</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
