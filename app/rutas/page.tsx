type Transportist = {
  id: string;
  nombre: string;
};

type Order = {
  id: string;
  destino: string;
};

type Agency = {
  id: string;
  nombre: string;
};


'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getRoutes, saveRoutes, generateRoute, getTransportists, getAgencies, getOrders, Route, getArgentineLocalities } from '../../lib/storage';

export default function Rutas() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
const [transportists, setTransportists] = useState<Transportist[]>([]);
const [agencies, setAgencies] = useState<Agency[]>([]);
const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    origin: '',
    destination: '',
    stops: [''],
    transportistId: ''
  });

  // Estados para rutas - selección de localidades
  const [routeOriginProvince, setRouteOriginProvince] = useState('');
  const [routeOriginLocalities, setRouteOriginLocalities] = useState<string[]>([]);
  const [routeDestinationProvince, setRouteDestinationProvince] = useState('');
  const [routeDestinationLocalities, setRouteDestinationLocalities] = useState<string[]>([]);
  const [routeStopProvinces, setRouteStopProvinces] = useState<string[]>(['']);
  const [routeStopLocalities, setRouteStopLocalities] = useState<string[][]>([[]]);

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    setRoutes(getRoutes());
    setTransportists(getTransportists());
    setAgencies(getAgencies());
    setOrders(getOrders());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  // Funciones para manejo de rutas - origen
  const handleRouteOriginProvinceChange = (province: string) => {
    setRouteOriginProvince(province);
    if (province) {
      const localities = getArgentineLocalities();
      setRouteOriginLocalities(localities[province] || []);
    } else {
      setRouteOriginLocalities([]);
    }
    // Resetear selección de origen
    setNewRoute({ ...newRoute, origin: '' });
  };

  // Funciones para manejo de rutas - destino
  const handleRouteDestinationProvinceChange = (province: string) => {
    setRouteDestinationProvince(province);
    if (province) {
      const localities = getArgentineLocalities();
      setRouteDestinationLocalities(localities[province] || []);
    } else {
      setRouteDestinationLocalities([]);
    }
    // Resetear selección de destino
    setNewRoute({ ...newRoute, destination: '' });
  };

  // Funciones para manejo de rutas - paradas
  const handleRouteStopProvinceChange = (index: number, province: string) => {
    const newStopProvinces = [...routeStopProvinces];
    newStopProvinces[index] = province;
    setRouteStopProvinces(newStopProvinces);

    const newStopLocalities = [...routeStopLocalities];
    if (province) {
      const localities = getArgentineLocalities();
      newStopLocalities[index] = localities[province] || [];
    } else {
      newStopLocalities[index] = [];
    }
    setRouteStopLocalities(newStopLocalities);

    // Resetear selección de parada
    const newStops = [...newRoute.stops];
    newStops[index] = '';
    setNewRoute({ ...newRoute, stops: newStops });
  };

  const validateForm = () => {
    const errors = [];

    if (!newRoute.origin) {
      errors.push('Origen es requerido');
    }
    if (!newRoute.destination) {
      errors.push('Destino es requerido');
    }
    if (!newRoute.transportistId) {
      errors.push('Transportista es requerido');
    }
    if (!routeOriginProvince) {
      errors.push('Provincia de origen es requerida');
    }
    if (!routeDestinationProvince) {
      errors.push('Provincia de destino es requerida');
    }

    return errors;
  };

  const prepareFormData = () => {
    // Filter out empty stops
    const validStops = newRoute.stops.filter(stop => stop.trim() !== '');
    const selectedTransportist = transportists.find(t => t.id === newRoute.transportistId);

    // Get provinces for stops that have been selected
    const stopDetails = validStops.map((stop, index) => ({
      localidad: stop,
      provincia: routeStopProvinces[index] || ''
    })).filter(stop => stop.localidad && stop.provincia);

    return {
      origen_provincia: routeOriginProvince,
      origen_localidad: newRoute.origin,
      destino_provincia: routeDestinationProvince,
      destino_localidad: newRoute.destination,
      paradas_intermedias: stopDetails.length > 0 ? stopDetails.map(stop => `${stop.localidad}, ${stop.provincia}`).join(' | ') : '',
      transportista_nombre: selectedTransportist?.name || '',
      transportista_vehiculo: selectedTransportist?.vehicle || '',
      transportista_patente: selectedTransportist?.plate || '',
      transportista_tipo: selectedTransportist?.type || '',
      total_paradas: stopDetails.length,
      ruta_completa: `${newRoute.origin} → ${validStops.join(' → ')} → ${newRoute.destination}`,
      fecha_creacion: new Date().toISOString(),
      estado_inicial: 'planificada'
    };
  };

  const submitFormData = async (formData: any) => {
    try {
      const response = await fetch('https://readdy.ai/api/form/d25cfdq6ft7aqac6tj7g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true, data: await response.text() };
    } catch (error) {
      console.error('Form submission error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setSubmitStatus({
        type: 'error',
        message: `Error de validación: ${errors.join(', ')}`
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Prepare form data for submission
      const formData = prepareFormData();
      
      // Submit to external API
      const result = await submitFormData(formData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Filtrar paradas vacías
      const validStops = newRoute.stops.filter(stop => stop.trim() !== '');

      const route = generateRoute(
        newRoute.origin,
        newRoute.destination,
        validStops,
        newRoute.transportistId
      );

      // Asignar órdenes automáticamente basadas en origen, paradas y destino
      const allLocations = [newRoute.origin, ...validStops, newRoute.destination];
      const relevantOrders = orders.filter(order => {
        const matchesOrigin = allLocations.some(location =>
          order.sender.province === location || order.sender.city === location
        );
        const matchesDestination = allLocations.some(location =>
          order.recipient.province === location || order.recipient.city === location
        );

        return (matchesOrigin || matchesDestination) && order.status === 'pendiente';
      });

      route.orderIds = relevantOrders.map(order => order.id);

      const updatedRoutes = [...routes, route];
      setRoutes(updatedRoutes);
      saveRoutes(updatedRoutes);

      setSubmitStatus({
        type: 'success',
        message: 'Ruta creada exitosamente y datos enviados correctamente'
      });

      // Reset form after successful submission
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error creating route:', error);
      setSubmitStatus({
        type: 'error',
        message: `Error al crear la ruta: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewRoute({
      origin: '',
      destination: '',
      stops: [''],
      transportistId: ''
    });
    setRouteOriginProvince('');
    setRouteOriginLocalities([]);
    setRouteDestinationProvince('');
    setRouteDestinationLocalities([]);
    setRouteStopProvinces(['']);
    setRouteStopLocalities([[]]);
    setSubmitStatus({ type: null, message: '' });
  };

  const addStop = () => {
    setNewRoute(prev => ({ ...prev, stops: [...prev.stops, ''] }));
    setRouteStopProvinces(prev => [...prev, '']);
    setRouteStopLocalities(prev => [...prev, []]);
  };

  const removeStop = (index: number) => {
    setNewRoute(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }));
    setRouteStopProvinces(prev => prev.filter((_, i) => i !== index));
    setRouteStopLocalities(prev => prev.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, value: string) => {
    setNewRoute(prev => ({ ...prev, stops: prev.stops.map((stop, i) => i === index ? value : stop) }));
  };

  const handlePrintRoute = (route: Route) => {
    const transportist = transportists.find(t => t.id === route.transportistId);
    const routeOrders = orders.filter(order => route.orderIds.includes(order.id));

    const printContent = `
      <html>
        <head><title>Hoja de Ruta ${route.code}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>HOJA DE RUTA - ${route.code}</h1>
          <div style="margin-bottom: 20px;">
            <h2>${route.name}</h2>
            <p><strong>Transportista:</strong> ${transportist?.name || 'No asignado'} (${transportist?.vehicle || 'N/A'})</p>
            <p><strong>Placa:</strong> ${transportist?.plate || 'N/A'}</p>
            <p><strong>Fecha de creación:</strong> ${new Date(route.createdAt).toLocaleDateString('es-AR')}</p>
            <p><strong>Estado:</strong> ${route.status}</p>

            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 5px;">
              <h3>Itinerario de Ruta:</h3>
              <p><strong> Origen:</strong> ${route.origin}</p>
              ${route.stops.length > 0 ? `
                <p><strong> Paradas:</strong></p>
                <ul>
                  ${route.stops.map((stop, index) => `<li>${index + 1}. ${stop}</li>`).join('')}
                </ul>
              ` : `<p><strong> Paradas:</strong> Sin paradas intermedias</p>`}
              <p><strong> Destino:</strong> ${route.destination}</p>
            </div>
          </div>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 8px;">Código</th>
                <th style="padding: 8px;">Remitente</th>
                <th style="padding: 8px;">Destinatario</th>
                <th style="padding: 8px;">Origen</th>
                <th style="padding: 8px;">Destino</th>
                <th style="padding: 8px;">Peso</th>
                <th style="padding: 8px;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${routeOrders.map(order => `
                <tr>
                  <td style="padding: 8px; font-family: monospace;">${order.trackingCode}</td>
                  <td style="padding: 8px;">${order.sender.name}</td>
                  <td style="padding: 8px;">${order.recipient.name}</td>
                  <td style="padding: 8px;">${order.sender.city}, ${order.sender.province}</td>
                  <td style="padding: 8px;">${order.recipient.city}, ${order.recipient.province}</td>
                  <td style="padding: 8px;">${order.package.weight}kg</td>
                  <td style="padding: 8px;">$${order.costs.total.toLocaleString('es-AR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px;">
            <p><strong>Total de envíos:</strong> ${routeOrders.length}</p>
            <p><strong>Peso total:</strong> ${routeOrders.reduce((sum, order) => sum + order.package.weight, 0)}kg</p>
            <p><strong>Valor total:</strong> $${routeOrders.reduce((sum, order) => sum + order.costs.total, 0).toLocaleString('es-AR')}</p>
          </div>
          <div style="margin-top: 40px;">
            <p>Firma del transportista: _________________________</p>
            <p>Hora de inicio: _____________</p>
            <p>Hora de finalización: _____________</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  const updateRouteStatus = (routeId: string, status: Route['status']) => {
    const updatedRoutes = routes.map(route =>
      route.id === routeId ? { ...route, status } : route
    );
    setRoutes(updatedRoutes);
    saveRoutes(updatedRoutes);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planificada': return 'bg-yellow-100 text-yellow-800';
      case 'en-curso': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planificada': return 'Planificada';
      case 'en-curso': return 'En Curso';
      case 'completada': return 'Completada';
      default: return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestión de Rutas</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Ingresar
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Rutas</h1>
            <p className="text-gray-600">Creación y control de hojas de ruta</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Nueva Ruta
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-route-line text-2xl text-blue-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">{routes.length}</div>
            <div className="text-gray-600">Total Rutas</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-time-line text-2xl text-yellow-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {routes.filter(r => r.status === 'planificada').length}
            </div>
            <div className="text-gray-600">Planificadas</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-truck-line text-2xl text-blue-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {routes.filter(r => r.status === 'en-curso').length}
            </div>
            <div className="text-gray-600">En Curso</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-2xl text-green-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {routes.filter(r => r.status === 'completada').length}
            </div>
            <div className="text-gray-600">Completadas</div>
          </div>
        </div>

        {/* Lista de Rutas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Rutas Registradas</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itinerario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envíos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => {
                  const transportist = transportists.find(t => t.id === route.transportistId);
                  return (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {route.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="font-medium text-green-700">Origen:</span>
                            <span className="ml-2">{route.origin}</span>
                          </div>
                          {route.stops && route.stops.length > 0 && (
                            <div className="flex items-start">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 mt-1"></span>
                              <span className="font-medium text-yellow-700">Paradas:</span>
                              <div className="ml-2">
                                {route.stops.map((stop, index) => (
                                  <div key={index} className="text-sm">{index + 1}. {stop}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            <span className="font-medium text-red-700">Destino:</span>
                            <span className="ml-2">{route.destination}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transportist?.name || 'Sin asignar'}
                        <div className="text-xs text-gray-500">
                          {transportist?.vehicle} - {transportist?.plate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(route.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.orderIds.length} envíos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                          {getStatusText(route.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrintRoute(route)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                            title="Imprimir hoja de ruta"
                          >
                            <i className="ri-printer-line"></i>
                          </button>
                          {route.status === 'planificada' && (
                            <button
                              onClick={() => updateRouteStatus(route.id, 'en-curso')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Iniciar ruta"
                            >
                              <i className="ri-play-line"></i>
                            </button>
                          )}
                          {route.status === 'en-curso' && (
                            <button
                              onClick={() => updateRouteStatus(route.id, 'completada')}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Completar ruta"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {routes.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-route-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">No hay rutas registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Crear Ruta */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Nueva Ruta</h3>
              <form onSubmit={handleCreateRoute} data-readdy-form id="route-creation-form">
                <div className="space-y-4">
                  {/* Submit Status */}
                  {submitStatus.type && (
                    <div className={`p-4 rounded-lg border ${
                      submitStatus.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        <i className={`mr-2 ${
                          submitStatus.type === 'success' ? 'ri-check-circle-line' : 'ri-error-warning-line'
                        }`}></i>
                        <span className="text-sm">{submitStatus.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Origen */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <i className="ri-flag-line mr-2 text-green-600"></i>
                      Origen *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                        <select
                          name="origen_provincia"
                          value={routeOriginProvince}
                          onChange={(e) => handleRouteOriginProvinceChange(e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          required
                        >
                          <option value="">Seleccionar provincia...</option>
                          {Object.keys(getArgentineLocalities()).map(province => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Localidad</label>
                        <select
                          name="origen_localidad"
                          value={newRoute.origin}
                          onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          disabled={!routeOriginProvince}
                          required
                        >
                          <option value="">Seleccionar localidad...</option>
                          {routeOriginLocalities.map(locality => (
                            <option key={locality} value={locality}>
                              {locality}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {newRoute.origin && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                        <strong>Origen seleccionado:</strong> {newRoute.origin}, {routeOriginProvince}
                      </div>
                    )}
                  </div>

                  {/* Paradas Intermedias */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <i className="ri-map-pin-line mr-2 text-yellow-600"></i>
                      Paradas Intermedias
                      <span className="text-xs text-gray-500 ml-2">(opcionales)</span>
                    </label>
                    {newRoute.stops.map((stop, index) => (
                      <div key={index} className="mb-3 p-3 bg-white rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">Parada {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
                            title="Eliminar parada"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                            <select
                              value={routeStopProvinces[index] || ''}
                              onChange={(e) => handleRouteStopProvinceChange(index, e.target.value)}
                              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            >
                              <option value="">Seleccionar provincia...</option>
                              {Object.keys(getArgentineLocalities()).map(province => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Localidad</label>
                            <select
                              value={stop}
                              onChange={(e) => updateStop(index, e.target.value)}
                              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                              disabled={!routeStopProvinces[index]}
                            >
                              <option value="">Seleccionar localidad...</option>
                              {(routeStopLocalities[index] || []).map(locality => (
                                <option key={locality} value={locality}>
                                  {locality}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {stop && routeStopProvinces[index] && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                            <strong>Parada {index + 1}:</strong> {stop}, {routeStopProvinces[index]}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addStop}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border-2 border-dashed border-yellow-300"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Agregar Parada
                    </button>
                  </div>

                  {/* Destino */}
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <i className="ri-flag-fill mr-2 text-red-600"></i>
                      Destino *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                        <select
                          name="destino_provincia"
                          value={routeDestinationProvince}
                          onChange={(e) => handleRouteDestinationProvinceChange(e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          required
                        >
                          <option value="">Seleccionar provincia...</option>
                          {Object.keys(getArgentineLocalities()).map(province => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Localidad</label>
                        <select
                          name="destino_localidad"
                          value={newRoute.destination}
                          onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          disabled={!routeDestinationProvince}
                          required
                        >
                          <option value="">Seleccionar localidad...</option>
                          {routeDestinationLocalities.map(locality => (
                            <option key={locality} value={locality}>
                              {locality}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {newRoute.destination && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                        <strong>Destino seleccionado:</strong> {newRoute.destination}, {routeDestinationProvince}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="ri-truck-line mr-2 text-blue-600"></i>
                      Transportista *
                    </label>
                    <select
                      name="transportista_id"
                      value={newRoute.transportistId}
                      onChange={(e) => setNewRoute({ ...newRoute, transportistId: e.target.value })}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar transportista...</option>
                      {transportists.map(transportist => (
                        <option key={transportist.id} value={transportist.id}>
                          {transportist.name} - {transportist.vehicle} ({transportist.plate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4 border border-blue-200">
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-information-line text-blue-600"></i>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Información de la ruta:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Primero selecciona la provincia, luego la localidad específica</li>
                        <li>• El origen y destino son obligatorios</li>
                        <li>• La fecha de creación se asigna automáticamente</li>
                        <li>• Las paradas son opcionales y pueden agregarse según necesidad</li>
                        <li>• Los envíos se asignarán automáticamente según origen, paradas y destino</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="ri-route-line mr-2"></i>
                        Crear Ruta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
