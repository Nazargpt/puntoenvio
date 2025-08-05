
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getOrderByTracking } from '../../lib/storage';

function SeguimientoContent() {
  const searchParams = useSearchParams();
  const [trackingCode, setTrackingCode] = useState(searchParams.get('code') || '');
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const foundOrder = getOrderByTracking(trackingCode.trim());
      if (foundOrder) {
        setOrder(foundOrder);
        setNotFound(false);
      } else {
        setOrder(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente-recoleccion':
        return 'text-yellow-600 bg-yellow-100';
      case 'en-transito':
        return 'text-blue-600 bg-blue-100';
      case 'en-agencia-destino':
        return 'text-orange-600 bg-orange-100';
      case 'entregado':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente-recoleccion':
        return 'Pendiente de Recolección';
      case 'en-transito':
        return 'En Tránsito';
      case 'en-agencia-destino':
        return 'En Agencia Destino';
      case 'entregado':
        return 'Entregado';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-3xl text-green-600"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Seguimiento de Encomienda</h1>
              <p className="text-gray-600">Ingresa tu código de seguimiento para conocer el estado de tu envío</p>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ingresa tu código de seguimiento"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 flex items-center justify-center mr-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                      </div>
                      Buscando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <i className="ri-search-line mr-2"></i>
                      Buscar
                    </div>
                  )}
                </button>
              </div>
            </form>

            {notFound && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-close-line text-3xl text-red-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Orden no encontrada</h2>
                <p className="text-gray-600 mb-6">
                  No se encontró ninguna encomienda con el código <strong>{trackingCode}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Verifica que el código sea correcto o contacta a nuestro servicio al cliente.
                </p>
              </div>
            )}

            {order && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <i className="ri-package-line text-xl text-green-600"></i>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Código: {order.trackingCode}</h2>
                        <p className="text-gray-600">
                          {order.sender.name} → {order.recipient.name}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Remitente</h3>
                      <div className="space-y-2 text-gray-600">
                        <p>
                          <strong>Nombre:</strong> {order.sender.name}
                        </p>
                        <p>
                          <strong>DNI:</strong> {order.sender.dni}
                        </p>
                        <p>
                          <strong>Teléfono:</strong> {order.sender.phone}
                        </p>
                        {order.sender.city && (
                          <p>
                            <strong>Ciudad:</strong> {order.sender.city}, {order.sender.province}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Destinatario</h3>
                      <div className="space-y-2 text-gray-600">
                        <p>
                          <strong>Nombre:</strong> {order.recipient.name}
                        </p>
                        <p>
                          <strong>DNI:</strong> {order.recipient.dni}
                        </p>
                        <p>
                          <strong>Teléfono:</strong> {order.recipient.phone}
                        </p>
                        {order.recipient.city && (
                          <p>
                            <strong>Ciudad:</strong> {order.recipient.city}, {order.recipient.province}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800">Peso</h4>
                        <p className="text-gray-600">{order.package.weight} kg</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Cantidad</h4>
                        <p className="text-gray-600">{order.package.quantity} bultos</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Valor Total</h4>
                        <p className="text-gray-600">${order.costs.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Historial de Movimientos</h3>
                  <div className="space-y-4">
                    {order.history.map((item, index) => (
                      <div key={`history-${index}`} className="flex items-start mb-4 last:mb-0">
                        <div
                          className={`w-4 h-4 rounded-full mr-4 mt-1 ${
                            index === 0 ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{item.status}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              {item.location && (
                                <p className="text-sm text-green-600">
                                  <i className="ri-map-pin-line mr-1"></i>
                                  {item.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{new Date(item.date).toLocaleDateString('es-ES')}</p>
                              <p>{new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">¿Necesitas ayuda?</h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/contacto"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Contactar Soporte
                    </a>
                    <a
                      href="tel:+573001234567"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Llamar Ahora
                    </a>
                  </div>
                </div>
              </div>
            )}

            {!order && !notFound && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Cómo funciona el seguimiento?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-time-line text-2xl text-yellow-600"></i>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Pendiente de Recolección</h3>
                    <p className="text-gray-600 text-sm">Tu paquete está siendo procesado</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-truck-line text-2xl text-blue-600"></i>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">En Tránsito</h3>
                    <p className="text-gray-600 text-sm">Tu paquete está en camino</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-building-line text-2xl text-orange-600"></i>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">En Agencia</h3>
                    <p className="text-gray-600 text-sm">Disponible para recoger</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line text-2xl text-green-600"></i>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Entregado</h3>
                    <p className="text-gray-600 text-sm">Paquete entregado exitosamente</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
          <i className="ri-loader-4-line text-2xl animate-spin text-green-600"></i>
        </div>
        <p>Cargando...</p>
      </div>
    </div>
  );
}

export default function Seguimiento() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SeguimientoContent />
    </Suspense>
  );
}
