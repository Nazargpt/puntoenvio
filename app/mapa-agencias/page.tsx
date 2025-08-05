'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  getAgencies, 
  calculateDistance, 
  geocodeAddress, 
  updateAgencyCoordinates,
  Agency 
} from '../../lib/storage';

interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface AgencyWithDistance extends Agency {
  distance?: number;
  travelTime?: number;
}

export default function MapaAgencias() {
  const [agencies, setAgencies] = useState<AgencyWithDistance[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [filterProvince, setFilterProvince] = useState('');
  const [nearestAgency, setNearestAgency] = useState<AgencyWithDistance | null>(null);

  const provinces = [
    'Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Córdoba', 'Santa Fe', 
    'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Chaco', 'Corrientes', 
    'Misiones', 'Formosa', 'Jujuy', 'Catamarca', 'La Rioja', 'San Juan',
    'San Luis', 'La Pampa', 'Río Negro', 'Neuquén', 'Chubut', 'Santa Cruz',
    'Tierra del Fuego', 'Santiago del Estero'
  ];

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (userLocation) {
      calculateDistancesToAgencies();
    }
  }, [userLocation]);

  const loadAgencies = async () => {
    try {
      // Actualizar coordenadas de agencias si no las tienen
      const updatedAgencies = await updateAgencyCoordinates();
      setAgencies(updatedAgencies);
    } catch (error) {
      console.error('Error loading agencies:', error);
      setAgencies(getAgencies());
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Intentar obtener la dirección a partir de las coordenadas
            const address = await reverseGeocode(latitude, longitude);
            
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address
            });
          } catch (error) {
            console.error('Error getting address:', error);
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
            });
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
      setIsLoadingLocation(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearchingAddress(true);
    
    try {
      const coordinates = await geocodeAddress(searchAddress);
      
      if (coordinates) {
        setUserLocation({
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: searchAddress
        });
      } else {
        alert('No se pudo encontrar la dirección especificada.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Error al buscar la dirección. Por favor, intenta nuevamente.');
    }
    
    setIsSearchingAddress(false);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // En producción, usarías la API de Google Maps para reverse geocoding
    // Por ahora, devolvemos una aproximación basada en coordenadas conocidas
    const knownLocations = [
      { lat: -34.6037, lng: -58.3816, name: 'Ciudad Autónoma de Buenos Aires' },
      { lat: -34.5312, lng: -58.4847, name: 'Vicente López, Buenos Aires' },
      { lat: -34.6698, lng: -58.6252, name: 'La Matanza, Buenos Aires' },
      { lat: -31.4201, lng: -64.1888, name: 'Córdoba, Córdoba' },
      { lat: -31.6107, lng: -60.6973, name: 'Santa Fe, Santa Fe' },
    ];

    let closestLocation = knownLocations[0];
    let minDistance = Infinity;

    knownLocations.forEach(location => {
      const distance = calculateDistance(lat, lng, location.lat, location.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = location;
      }
    });

    return closestLocation.name;
  };

  const calculateDistancesToAgencies = () => {
    if (!userLocation) return;

    const agenciesWithDistance = agencies.map(agency => {
      if (agency.coordinates) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          agency.coordinates.lat,
          agency.coordinates.lng
        );
        
        // Estimación de tiempo de viaje (30 km/h promedio en ciudad)
        const travelTime = Math.round(distance * 2); // 2 minutos por kilómetro aproximadamente
        
        return {
          ...agency,
          distance: Math.round(distance * 100) / 100,
          travelTime
        };
      }
      return agency;
    });

    setAgencies(agenciesWithDistance);

    // Encontrar la agencia más cercana
    const nearest = agenciesWithDistance
      .filter(a => a.distance !== undefined)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
    
    setNearestAgency(nearest || null);
  };

  const handleOpenInMaps = (agency: Agency, action: 'directions' | 'location') => {
    if (!agency.coordinates) return;

    let mapsUrl = '';
    
    if (action === 'directions' && userLocation) {
      // Abrir direcciones desde ubicación actual a la agencia
      mapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${agency.coordinates.lat},${agency.coordinates.lng}`;
    } else {
      // Abrir ubicación de la agencia
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${agency.coordinates.lat},${agency.coordinates.lng}`;
    }

    window.open(mapsUrl, '_blank');
  };

  const filteredAndSortedAgencies = agencies
    .filter(agency => !filterProvince || agency.province === filterProvince)
    .filter(agency => userLocation ? agency.distance !== undefined : true)
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance || Infinity) - (b.distance || Infinity);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-map-pin-line text-4xl text-blue-600"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Encuentra tu Agencia PuntoEnvío más Cercana
          </h1>
          <p className="text-xl text-gray-600">
            Localiza la agencia más próxima a tu ubicación y obtén direcciones para llegar
          </p>
        </div>

        {/* Búsqueda de ubicación */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">¿Dónde te encuentras?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ubicación automática */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-4">Usar mi ubicación actual</h3>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isLoadingLocation 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <div className="flex items-center justify-center">
                  {isLoadingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      <i className="ri-gps-line mr-2"></i>
                      Obtener mi ubicación
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Búsqueda manual */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Buscar por dirección</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Ingresa tu dirección completa"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                />
                <button
                  onClick={handleSearchAddress}
                  disabled={isSearchingAddress || !searchAddress.trim()}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isSearchingAddress || !searchAddress.trim()
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSearchingAddress ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <i className="ri-search-line"></i>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ubicación actual */}
          {userLocation && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <i className="ri-map-pin-user-line text-2xl text-green-600 mr-3"></i>
                <div>
                  <p className="font-semibold text-green-800">Tu ubicación:</p>
                  <p className="text-sm text-green-700">
                    {userLocation.address || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Agencia más cercana */}
        {nearestAgency && userLocation && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">🎯 Agencia más cercana</h2>
                <h3 className="text-xl font-semibold">{nearestAgency.name}</h3>
                <p className="text-blue-100 mb-2">{nearestAgency.address}</p>
                <p className="text-blue-100">{nearestAgency.city}, {nearestAgency.province}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    📍 {nearestAgency.distance}km de distancia
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🕒 ~{nearestAgency.travelTime} min de viaje
                  </span>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleOpenInMaps(nearestAgency, 'directions')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-navigation-line mr-2"></i>
                  Cómo llegar
                </button>
                <button
                  onClick={() => handleOpenInMaps(nearestAgency, 'location')}
                  className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-30 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-map-pin-2-line mr-2"></i>
                  Ver en mapa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y ordenamiento */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-bold text-gray-800">Todas las agencias</h2>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
              >
                <option value="">Todas las provincias</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
              >
                <option value="distance">Ordenar por distancia</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredAndSortedAgencies.length} agencias
            {userLocation && filteredAndSortedAgencies.some(a => a.distance !== undefined) && 
              ` • Calculando distancias desde tu ubicación`
            }
          </div>
        </div>

        {/* Lista de agencias */}
        <div className="space-y-4">
          {filteredAndSortedAgencies.map((agency) => (
            <div key={agency.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div className="flex-1 mb-4 lg:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{agency.name}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      {agency.code}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <i className="ri-map-pin-line mr-2 text-gray-400"></i>
                        <span>{agency.address}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-building-line mr-2 text-gray-400"></i>
                        <span>{agency.city}, {agency.province}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <i className="ri-phone-line mr-2 text-gray-400"></i>
                        <span>{agency.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-time-line mr-2 text-gray-400"></i>
                        <span>{agency.schedule}</span>
                      </div>
                    </div>
                  </div>

                  {/* Información de distancia */}
                  {userLocation && agency.distance !== undefined && (
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        📍 {agency.distance}km
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        🕒 ~{agency.travelTime} min
                      </span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col space-y-2 lg:ml-6">
                  {userLocation && agency.coordinates && (
                    <button
                      onClick={() => handleOpenInMaps(agency, 'directions')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-navigation-line mr-2"></i>
                      Cómo llegar
                    </button>
                  )}
                  
                  {agency.coordinates && (
                    <button
                      onClick={() => handleOpenInMaps(agency, 'location')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-map-pin-2-line mr-2"></i>
                      Ver ubicación
                    </button>
                  )}
                  
                  <a
                    href={`tel:${agency.phone}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap text-center"
                  >
                    <i className="ri-phone-line mr-2"></i>
                    Llamar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedAgencies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-map-pin-line text-3xl text-gray-400"></i>
            </div>
            <p className="text-gray-500 text-lg">No se encontraron agencias con los filtros aplicados</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8 border border-blue-200">
          <div className="flex items-start">
            <i className="ri-information-line text-blue-600 text-2xl mr-3 mt-1"></i>
            <div className="text-blue-800">
              <h3 className="font-semibold text-lg mb-2">¿Cómo funciona?</h3>
              <ul className="text-sm space-y-1">
                <li>• <strong>Ubicación automática:</strong> Permite que el navegador detecte tu posición actual</li>
                <li>• <strong>Búsqueda manual:</strong> Ingresa tu dirección completa para encontrar agencias cercanas</li>
                <li>• <strong>Cálculo de distancias:</strong> Ve qué tan lejos está cada agencia y el tiempo estimado de viaje</li>
                <li>• <strong>Navegación:</strong> Obtén direcciones paso a paso directamente en Google Maps</li>
                <li>• <strong>Contacto directo:</strong> Llama a la agencia directamente desde la aplicación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}