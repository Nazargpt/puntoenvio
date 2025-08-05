
'use client';

import { useEffect, useState<Transportist[]>([]) } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOrders } from '../lib/storage';

export default function Home() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    inTransit: 0,
    delivered: 0
  });

  useEffect(() => {
    const orders = getOrders();
    setStats({
      totalOrders: orders.length,
      inTransit: orders.filter(o => o.status === 'en-transito').length,
      delivered: orders.filter(o => o.status === 'entregado').length
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center bg-gray-900 text-white py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://readdy.ai/api/search-image?query=Modern%20logistics%20warehouse%20with%20trucks%20loading%20packages%2C%20professional%20delivery%20service%2C%20clean%20industrial%20environment%20with%20conveyor%20belts%20and%20organized%20shipping%20containers%2C%20bright%20lighting%2C%20efficient%20operations%2C%20Argentine%20logistics%20company%20atmosphere&width=1920&height=800&seq=hero-logistics&orientation=landscape')`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Envíos rápidos, seguros y nacionales
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Conectamos toda Argentina con nuestra red de agencias físicas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/crear-orden"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-box-line mr-2"></i>
                Crear Orden de Envío
              </Link>
              <Link 
                href="/seguimiento"
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-search-line mr-2"></i>
                Seguir mi Envío
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Agencias</h3>
              <p className="text-gray-600">En toda Argentina</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-package-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2" suppressHydrationWarning={true}>
                {stats.totalOrders.toLocaleString()}
              </h3>
              <p className="text-gray-600">Envíos gestionados</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-truck-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2" suppressHydrationWarning={true}>
                {stats.inTransit.toLocaleString()}
              </h3>
              <p className="text-gray-600">En tránsito</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">99.8%</h3>
              <p className="text-gray-600">Entregas exitosas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas del Servicio */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">¿Por qué elegir PuntoEnvío?</h2>
            <p className="text-xl text-gray-600">La mejor red de logística de Argentina</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-map-pin-range-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Cobertura Nacional</h3>
              <p className="text-gray-600">
                Llegamos a todos los rincones de Argentina con nuestra extensa red de agencias
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-eye-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Seguimiento en Tiempo Real</h3>
              <p className="text-gray-600">
                Controlá tu envío en cada paso del camino con nuestro sistema de rastreo
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-price-tag-3-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Precios Transparentes</h3>
              <p className="text-gray-600">
                Sin costos ocultos. Conocé el precio final antes de confirmar tu envío
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600">Soluciones logísticas adaptadas a tus necesidades</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-home-line text-2xl text-green-600"></i>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Domicilio a Domicilio</h4>
              <p className="text-sm text-gray-600">Retiramos y entregamos en tu hogar</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-line text-2xl text-green-600"></i>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Domicilio a Agencia</h4>
              <p className="text-sm text-gray-600">Retiramos en tu hogar, entregan en agencia</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-truck-line text-2xl text-green-600"></i>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Agencia a Domicilio</h4>
              <p className="text-sm text-gray-600">Dejás en agencia, entregamos en destino</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-store-line text-2xl text-green-600"></i>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Agencia a Agencia</h4>
              <p className="text-sm text-gray-600">Dejás y retiran en nuestras agencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Zonas de Cobertura */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Cobertura Nacional</h2>
            <p className="text-xl text-gray-600">Operamos en las 24 jurisdicciones argentinas</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
              'Entre Ríos', 'Salta', 'Chaco', 'Corrientes', 'Misiones', 'Formosa',
              'Jujuy', 'Catamarca', 'La Rioja', 'San Juan', 'San Luis', 'La Pampa',
              'Río Negro', 'Neuquén', 'Chubut', 'Santa Cruz', 'T. del Fuego', 'Santiago del Estero'
            ].map((province) => (
              <div key={province} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-sm font-medium text-gray-700">{province}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para enviar?</h2>
          <p className="text-xl mb-8">
            Creá tu orden de envío en minutos y aprovechá nuestra red nacional
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/crear-orden"
              className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-box-line mr-2"></i>
              Crear Orden Ahora
            </Link>
            <Link 
              href="/cotizador"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-calculator-line mr-2"></i>
              Ver Tarifas
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
