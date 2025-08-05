
'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  getOrders, 
  updateOrderStatus, 
  getRouteSheetsByTransportist,
  updateRouteSheetStatus,
  RouteSheet,
  receiveRouteSheetAtAgency,
  getAgencies,
  deliverToFinalCustomer
} from '../../lib/storage';

export default function Transportistas() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [transportistData, setTransportistData] = useState({
    id: 'T001',
    name: 'Carlos Mendoza',
    dni: '12345678',
    phone: '+57 300 123 4567',
    email: 'carlos.mendoza@puntoenvio.com',
    vehicle: 'Camioneta Ford Transit',
    plate: 'ABC123',
    type: 'local' as 'local' | 'larga-distancia'
  });
  const [orders, setOrders] = useState([]);
  const [routeSheets, setRouteSheets] = useState<RouteSheet[]>([]);
  const [selectedRouteSheet, setSelectedRouteSheet] = useState<string>('');
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados para hojas de ruta específicas
  const [collectionRoutes, setCollectionRoutes] = useState<RouteSheet[]>([]);
  const [deliveryRoutes, setDeliveryRoutes] = useState<RouteSheet[]>([]);
  const [longDistanceRoutes, setLongDistanceRoutes] = useState<RouteSheet[]>([]);
  
  // Estados para modales
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<RouteSheet | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    recipientName: '',
    recipientDNI: '',
    signature: '',
    notes: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadTransportistData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedRouteSheet) {
      const sheet = routeSheets.find(rs => rs.id === selectedRouteSheet);
      if (sheet) {
        const allOrders = getOrders();
        const sheetOrders = allOrders.filter(order => sheet.orderIds.includes(order.id));
        setOrders(sheetOrders);
      }
    }
  }, [selectedRouteSheet, routeSheets]);

  const loadTransportistData = () => {
    // Cargar todas las hojas de ruta asignadas al transportista
    const assignedRouteSheets = getRouteSheetsByTransportist(transportistData.id);
    setRouteSheets(assignedRouteSheets);
    
    // Separar hojas de ruta por tipo
    const allOrders = getOrders();
    const agencies = getAgencies();
    
    // Hojas de ruta de recolección (origen en la zona del transportista)
    const collection = assignedRouteSheets.filter(rs => {
      const sheetOrders = allOrders.filter(order => rs.orderIds.includes(order.id));
      const agency = agencies.find(a => a.id === rs.agencyId);
      
      // Si la agencia del transportista coincide con el origen de las órdenes
      return sheetOrders.some(order => 
        transportistData.type === 'local' && 
        order.sender.city === agency?.city &&
        order.sender.province === agency?.province
      );
    });
    
    // Hojas de ruta de entrega (destino en la zona del transportista)
    const delivery = assignedRouteSheets.filter(rs => {
      const sheetOrders = allOrders.filter(order => rs.orderIds.includes(order.id));
      const agency = agencies.find(a => a.id === rs.agencyId);
      
      // Si el destino coincide con la zona del transportista
      return sheetOrders.some(order => 
        order.recipient.city === agency?.city &&
        order.recipient.province === agency?.province
      );
    });
    
    // Hojas de ruta de larga distancia (para transportistas de larga distancia)
    const longDistance = assignedRouteSheets.filter(rs => {
      const sheetOrders = allOrders.filter(order => rs.orderIds.includes(order.id));
      const originAgency = agencies.find(a => a.id === rs.agencyId);
      
      return transportistData.type === 'larga-distancia' && 
             sheetOrders.some(order => 
               order.sender.province !== order.recipient.province
             );
    });
    
    setCollectionRoutes(collection);
    setDeliveryRoutes(delivery);
    setLongDistanceRoutes(transportistData.type === 'larga-distancia' ? longDistance : []);
    
    // Si hay hojas de ruta, seleccionar la primera automáticamente
    if (assignedRouteSheets.length > 0 && !selectedRouteSheet) {
      setSelectedRouteSheet(assignedRouteSheets[0].id);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ email: '', password: '' });
    setSelectedRouteSheet('');
    setOrders([]);
    setRouteSheets([]);
    setActiveTab('dashboard');
  };

  const handleStatusUpdate = (trackingCode: string, newStatus: string) => {
    const statusDescriptions = {
      'en-transito': 'Paquete recogido por transportista',
      'en-agencia-destino': 'Paquete llegó a agencia destino',
      'entregado': 'Paquete entregado exitosamente'
    };

    const selectedSheet = routeSheets.find(rs => rs.id === selectedRouteSheet);
    const location = selectedSheet ? `${selectedSheet.city}, ${selectedSheet.province}` : 'En ruta';

    updateOrderStatus(
      trackingCode,
      newStatus as any,
      location,
      statusDescriptions[newStatus] || 'Estado actualizado por transportista'
    );

    // Actualizar lista local
    if (selectedRouteSheet) {
      const sheet = routeSheets.find(rs => rs.id === selectedRouteSheet);
      if (sheet) {
        const allOrders = getOrders();
        const sheetOrders = allOrders.filter(order => sheet.orderIds.includes(order.id));
        setOrders(sheetOrders);

        // Verificar si todas las órdenes están entregadas para marcar la hoja de ruta como completada
        const allDelivered = sheetOrders.every(order => order.status === 'entregado');
        if (allDelivered && sheet.status !== 'completada') {
          updateRouteSheetStatus(sheet.id, 'completada');
          loadTransportistData(); // Recargar datos
        }
      }
    }
  };

  const handleStartRoute = (routeSheetId: string) => {
    updateRouteSheetStatus(routeSheetId, 'en-curso');
    loadTransportistData();
  };

  const handleCompleteRoute = (routeSheetId: string) => {
    updateRouteSheetStatus(routeSheetId, 'completada');
    loadTransportistData();
  };

  const handleReceiveAtAgency = (routeSheetId: string, agencyId: string) => {
    receiveRouteSheetAtAgency(routeSheetId, agencyId);
    loadTransportistData();
    alert('Hoja de ruta recibida en agencia destino exitosamente');
  };

  const handleDeliveryToCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDelivery) return;

    const success = deliverToFinalCustomer(
      selectedOrderForDelivery.trackingCode,
      `${deliveryForm.recipientName} (${deliveryForm.recipientDNI}) - ${deliveryForm.signature}`
    );

    if (success) {
      setShowDeliveryModal(false);
      setSelectedOrderForDelivery(null);
      setDeliveryForm({
        recipientName: '',
        recipientDNI: '',
        signature: '',
        notes: ''
      });
      loadTransportistData();
      alert('Entrega registrada exitosamente');
    } else {
      alert('Error al registrar la entrega');
    }
  };

  const handleGenerateOptimizedRoute = async () => {
    if (!selectedRouteSheet) return;

    setIsGeneratingRoute(true);

    try {
      const selectedSheet = routeSheets.find(rs => rs.id === selectedRouteSheet);
      if (!selectedSheet) return;

      // Obtener órdenes de la hoja de ruta seleccionada
      const sheetOrders = orders.filter(order => selectedSheet.orderIds.includes(order.id));
      
      // Crear lista de direcciones para optimizar la ruta
      const addresses = [];

      // Agregar punto de inicio (agencia de origen - se puede obtener del localStorage o configuración)
      const originAddress = "Buenos Aires, Argentina"; // Esto se puede mejorar obteniendo la dirección real de la agencia

      // Agregar todas las direcciones de entrega
      sheetOrders.forEach(order => {
        if (order.recipient.address) {
          addresses.push({
            orderId: order.id,
            trackingCode: order.trackingCode,
            address: `${order.recipient.address}, ${order.recipient.city}, ${order.recipient.province}, Argentina`,
            recipientName: order.recipient.name,
            recipientPhone: order.recipient.phone
          });
        }
      });

      if (addresses.length === 0) {
        alert('No hay direcciones válidas para generar la ruta');
        setIsGeneratingRoute(false);
        return;
      }

      // Simular optimización de ruta (en producción se usaría Google Maps Directions API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar URL de Google Maps con múltiples destinos
      const waypoints = addresses.map(addr => encodeURIComponent(addr.address)).join('|');
      const destination = addresses[addresses.length - 1].address;
      
      // URL para Google Maps con ruta optimizada
      const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(originAddress)}/${waypoints}/${encodeURIComponent(destination)}`;

      // Abrir Google Maps en una nueva ventana
      window.open(mapsUrl, '_blank');

      // Mostrar información de la ruta optimizada
      showOptimizedRouteInfo(addresses);

    } catch (error) {
      console.error('Error generando ruta optimizada:', error);
      alert('Error al generar la ruta optimizada. Por favor, intente nuevamente.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const showOptimizedRouteInfo = (addresses: any[]) => {
    const routeInfo = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">🗺️ Ruta Optimizada Generada</h2>
        <p style="margin-bottom: 15px;"><strong>Total de paradas:</strong> ${addresses.length}</p>
        <p style="margin-bottom: 15px;"><strong>Orden sugerido de entregas:</strong></p>
        <ol style="margin-left: 20px;">
          ${addresses.map((addr, index) => `
            <li style="margin-bottom: 10px; padding: 8px; background-color: #f8fafc; border-radius: 4px;">
              <strong>${addr.trackingCode}</strong> - ${addr.recipientName}<br>
              <small style="color: #64748b;">${addr.address}</small><br>
              <small style="color: #059669;">📞 ${addr.recipientPhone}</small>
            </li>
          `).join('')}
        </ol>
        <div style="margin-top: 20px; padding: 15px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
          <p style="margin: 0; color: #065f46;"><strong>💡 Consejos:</strong></p>
          <ul style="margin: 10px 0; color: #065f46;">
            <li>Se abrió Google Maps con la ruta optimizada</li>
            <li>Sigue el orden sugerido para mayor eficiencia</li>
            <li>Contacta a los destinatarios antes de llegar</li>
            <li>Actualiza el estado de cada entrega desde la app</li>
          </ul>
        </div>
      </div>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ruta Optimizada - ${routeSheets.find(rs => rs.id === selectedRouteSheet)?.code}</title>
            <meta charset="utf-8">
          </head>
          <body>
            ${routeInfo}
            <div style="text-align: center; margin-top: 30px;">
              <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                🖨️ Imprimir Ruta
              </button>
              <button onclick="window.close()" style="background-color: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                ✖️ Cerrar
              </button>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleViewRouteDetail = (routeSheet: RouteSheet) => {
    setSelectedRouteDetail(routeSheet);
    setShowRouteDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente-recoleccion': return 'bg-yellow-100 text-yellow-800';
      case 'asignada': return 'bg-blue-100 text-blue-800';
      case 'en-curso': return 'bg-orange-100 text-orange-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'en-transito': return 'bg-blue-100 text-blue-800';
      case 'en-agencia-destino': return 'bg-orange-100 text-orange-800';
      case 'entregado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente-recoleccion': return 'Pendiente de Recolección';
      case 'asignada': return 'Asignada';
      case 'en-curso': return 'En Curso';
      case 'completada': return 'Completada';
      case 'en-transito': return 'En Tránsito';
      case 'en-agencia-destino': return 'En Agencia Destino';
      case 'entregado': return 'Entregado';
      default: return status;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-truck-line text-3xl text-green-600"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Portal de Transportistas</h1>
              <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="transportista@puntoenvio.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                ¿Problemas para acceder? 
                <a href="/contacto" className="text-green-600 hover:text-green-700 ml-1 cursor-pointer">
                  Contacta soporte
                </a>
              </p>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-800">Panel de Transportista</h1>
            <div className="mt-2">
              <p className="text-gray-600">{transportistData.name}</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transportistData.type === 'local' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {transportistData.type === 'local' ? 'Transportista Local' : 'Larga Distancia'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
              <i className="ri-logout-box-line"></i>
            </div>
            Cerrar Sesión
          </button>
        </div>

        {/* Navegación de pestañas */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {[ 
              { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
              { id: 'collection-routes', label: 'Hojas de Recolección', icon: 'ri-inbox-line' },
              { id: 'delivery-routes', label: 'Hojas de Entrega', icon: 'ri-user-received-line' },
              ...(transportistData.type === 'larga-distancia' ? [
                { id: 'long-distance-routes', label: 'Rutas Larga Distancia', icon: 'ri-road-map-line' }
              ] : []),
              { id: 'current-route', label: 'Ruta Actual', icon: 'ri-navigation-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${ 
                  activeTab === tab.id 
                    ? 'text-green-600 border-b-2 border-green-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Información del transportista y vehículo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Información Personal</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-semibold">{transportistData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DNI:</span>
                    <span className="font-semibold">{transportistData.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-semibold">{transportistData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">{transportistData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transportistData.type === 'local' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transportistData.type === 'local' ? 'Local' : 'Larga Distancia'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Vehículo Asignado</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehículo:</span>
                    <span className="font-semibold">{transportistData.vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Placa:</span>
                    <span className="font-semibold">{transportistData.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Activo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-inbox-line text-2xl text-blue-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{collectionRoutes.length}</div>
                <div className="text-gray-600">Hojas de Recolección</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-received-line text-2xl text-green-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{deliveryRoutes.length}</div>
                <div className="text-gray-600">Hojas de Entrega</div>
              </div>

              {transportistData.type === 'larga-distancia' && (
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-road-map-line text-2xl text-purple-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{longDistanceRoutes.length}</div>
                  <div className="text-gray-600">Rutas Larga Distancia</div>
                </div>
              )}

              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-navigation-line text-2xl text-orange-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {routeSheets.filter(rs => rs.status === 'en-curso').length}
                </div>
                <div className="text-gray-600">Rutas Activas</div>
              </div>
            </div>

            {/* Resumen de actividades */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen de Actividades</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {routeSheets.filter(rs => rs.status === 'asignada').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Hojas Asignadas</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {routeSheets.filter(rs => rs.status === 'en-curso').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Rutas en Curso</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {routeSheets.filter(rs => rs.status === 'completada').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Rutas Completadas</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hojas de Recolección */}
        {activeTab === 'collection-routes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Hojas de Recolección</h2>
            <p className="text-gray-600 mb-6">
              Hojas de ruta para recoger paquetes desde los remitentes o agencias de origen
            </p>

            {collectionRoutes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-inbox-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-lg">No tienes hojas de recolección asignadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectionRoutes.map((sheet) => (
                  <div key={sheet.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-800">{sheet.code}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sheet.status)}`}>
                        {getStatusText(sheet.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><strong>Zona:</strong> {sheet.city}, {sheet.province}</p>
                      <p className="text-sm"><strong>Órdenes:</strong> {sheet.orderIds.length} paquetes</p>
                      <p className="text-sm text-gray-500">
                        Creada: {new Date(sheet.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {sheet.status === 'asignada' && (
                        <button
                          onClick={() => handleStartRoute(sheet.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-play-line mr-2"></i>
                          Iniciar Recolección
                        </button>
                      )}
                      
                      {sheet.status === 'en-curso' && (
                        <button
                          onClick={() => handleCompleteRoute(sheet.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-check-line mr-2"></i>
                          Completar Recolección
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleViewRouteDetail(sheet)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-eye-line mr-2"></i>
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hojas de Entrega */}
        {activeTab === 'delivery-routes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Hojas de Entrega</h2>
            <p className="text-gray-600 mb-6">
              Hojas de ruta para entregar paquetes a destinatarios finales o agencias de destino
            </p>

            {deliveryRoutes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-received-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-lg">No tienes hojas de entrega asignadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveryRoutes.map((sheet) => {
                  const agencies = getAgencies();
                  const destinationAgency = agencies.find(a => a.id === sheet.agencyId);
                  
                  return (
                    <div key={sheet.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-800">{sheet.code}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sheet.status)}`}>
                          {getStatusText(sheet.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm"><strong>Destino:</strong> {sheet.city}, {sheet.province}</p>
                        <p className="text-sm"><strong>Órdenes:</strong> {sheet.orderIds.length} paquetes</p>
                        {destinationAgency && (
                          <p className="text-sm"><strong>Agencia:</strong> {destinationAgency.name}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Creada: {new Date(sheet.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {sheet.status === 'asignada' && (
                          <button
                            onClick={() => handleStartRoute(sheet.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-play-line mr-2"></i>
                            Iniciar Entrega
                          </button>
                        )}
                        
                        {sheet.status === 'en-curso' && (
                          <>
                            <button
                              onClick={() => handleReceiveAtAgency(sheet.id, sheet.agencyId)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-building-line mr-2"></i>
                              Entregar en Agencia
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedRouteSheet(sheet.id);
                                setActiveTab('current-route');
                              }}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-navigation-line mr-2"></i>
                              Ver Ruta Activa
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleViewRouteDetail(sheet)}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-eye-line mr-2"></i>
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rutas de Larga Distancia */}
        {activeTab === 'long-distance-routes' && transportistData.type === 'larga-distancia' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Rutas de Larga Distancia</h2>
            <p className="text-gray-600 mb-6">
              Rutas interprovinciales para transporte de larga distancia
            </p>

            {longDistanceRoutes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-road-map-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-lg">No tienes rutas de larga distancia asignadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {longDistanceRoutes.map((sheet) => {
                  const allOrders = getOrders();
                  const sheetOrders = allOrders.filter(order => sheet.orderIds.includes(order.id));
                  const agencies = getAgencies();
                  const originAgency = agencies.find(a => a.id === sheet.agencyId);
                  
                  return (
                    <div key={sheet.id} className="border rounded-lg p-6 bg-purple-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{sheet.code}</h3>
                          <p className="text-gray-600">Ruta interprovincial</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sheet.status)}`}>
                          {getStatusText(sheet.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Origen</h4>
                          <p className="text-sm text-gray-600">
                            {originAgency ? `${originAgency.name}` : 'Agencia no encontrada'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sheet.city}, {sheet.province}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Destinos</h4>
                          <div className="text-sm text-gray-600">
                            {[...new Set(sheetOrders.map(order => `${order.recipient.city}, ${order.recipient.province}`))].map((destination, index) => (
                              <div key={index}>{destination}</div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Carga</h4>
                          <p className="text-sm text-gray-600">
                            {sheet.orderIds.length} órdenes
                          </p>
                          <p className="text-sm text-gray-500">
                            Peso total: {sheetOrders.reduce((sum, order) => sum + order.package.weight, 0)}kg
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {sheet.status === 'asignada' && (
                          <button
                            onClick={() => handleStartRoute(sheet.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-play-line mr-2"></i>
                            Iniciar Viaje
                          </button>
                        )}
                        
                        {sheet.status === 'en-curso' && (
                          <>
                            <button
                              onClick={() => handleCompleteRoute(sheet.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-flag-line mr-2"></i>
                              Completar Viaje
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedRouteSheet(sheet.id);
                                setActiveTab('current-route');
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-navigation-line mr-2"></i>
                              Ver Ruta Activa
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleViewRouteDetail(sheet)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-eye-line mr-2"></i>
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Ruta Actual */}
        {activeTab === 'current-route' && (
          <>
            {selectedRouteSheet ? (
              <>
                {/* Selector de ruta con mapa optimizado */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Hoja de Ruta Activa</h2>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {routeSheets.find(rs => rs.id === selectedRouteSheet)?.code}
                      </h3>
                      <p className="text-gray-600">
                        Destino: {routeSheets.find(rs => rs.id === selectedRouteSheet)?.city}, {routeSheets.find(rs => rs.id === selectedRouteSheet)?.province}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleGenerateOptimizedRoute}
                        disabled={isGeneratingRoute}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isGeneratingRoute 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                          {isGeneratingRoute ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <i className="ri-map-pin-line"></i>
                          )}
                        </div>
                        {isGeneratingRoute ? 'Generando Ruta...' : 'Generar Ruta Optimizada'}
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedRouteSheet) {
                            const sheet = routeSheets.find(rs => rs.id === selectedRouteSheet);
                            if (sheet) {
                              const simpleMapUrl = `https://www.google.com/maps/search/${encodeURIComponent(sheet.city + ', ' + sheet.province)}`;
                              window.open(simpleMapUrl, '_blank');
                            }
                          }
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                          <i className="ri-map-line"></i>
                        </div>
                        Ver Zona
                      </button>
                    </div>
                  </div>
                  
                  {isGeneratingRoute && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <div>
                          <p className="text-blue-800 font-semibold">Optimizando tu ruta de entrega...</p>
                          <p className="text-blue-600 text-sm">Calculando la mejor secuencia de paradas para mayor eficiencia</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de órdenes de la hoja de ruta */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      Órdenes - {routeSheets.find(rs => rs.id === selectedRouteSheet)?.code}
                    </h2>
                    <div className="text-sm text-gray-600">
                      Total: {orders.length} paquetes
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-inbox-line text-3xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-500 text-lg">No hay órdenes en esta hoja de ruta</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-2">Código de Seguimiento</h3>
                              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{order.trackingCode}</p>
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-2">Remitente</h3>
                              <p className="text-gray-600">{order.sender.name}</p>
                              <p className="text-sm text-gray-500">{order.sender.city}, {order.sender.province}</p>
                              <p className="text-sm text-gray-500">{order.sender.phone}</p>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-2">Destinatario</h3>
                              <p className="text-gray-600">{order.recipient.name}</p>
                              <p className="text-sm text-gray-500">{order.recipient.city}, {order.recipient.province}</p>
                              <p className="text-sm text-gray-500">{order.recipient.phone}</p>
                              {order.recipient.address && (
                                <p className="text-sm text-gray-500 mt-1">{order.recipient.address}</p>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-2">Acciones</h3>
                              <div className="space-y-2">
                                {order.status === 'pendiente-recoleccion' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.trackingCode, 'en-transito')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                                      <i className="ri-truck-line"></i>
                                    </div>
                                    Marcar Recogido
                                  </button>
                                )}
                                
                                {order.status === 'en-transito' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(order.trackingCode, 'en-agencia-destino')}
                                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                                        <i className="ri-building-line"></i>
                                      </div>
                                      Entregar en Agencia
                                    </button>
                                    
                                    {order.package.serviceType === 'Domicilio a Domicilio' && (
                                      <button
                                        onClick={() => {
                                          setSelectedOrderForDelivery(order);
                                          setDeliveryForm({
                                            recipientName: order.recipient.name,
                                            recipientDNI: order.recipient.dni,
                                            signature: '',
                                            notes: ''
                                          });
                                          setShowDeliveryModal(true);
                                        }}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                                          <i className="ri-user-received-line"></i>
                                        </div>
                                        Entregar a Cliente
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                {/* Nuevo botón para ver ubicación individual */}
                                {order.recipient.address && (
                                  <button
                                    onClick={() => {
                                      const address = `${order.recipient.address}, ${order.recipient.city}, ${order.recipient.province}, Argentina`;
                                      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
                                      window.open(mapsUrl, '_blank');
                                    }}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                                      <i className="ri-map-pin-2-line"></i>
                                    </div>
                                    Ver Ubicación
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-navigation-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-lg">No hay ruta activa seleccionada</p>
                  <p className="text-gray-400 text-sm mt-2">Selecciona una hoja de ruta desde las otras pestañas</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Detalle de Hoja de Ruta */}
        {showRouteDetailModal && selectedRouteDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-90vh overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Detalle de Hoja de Ruta - {selectedRouteDetail.code}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Información General</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>Código:</strong> {selectedRouteDetail.code}</div>
                    <div><strong>Destino:</strong> {selectedRouteDetail.city}, {selectedRouteDetail.province}</div>
                    <div><strong>Estado:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedRouteDetail.status)}`}>
                        {getStatusText(selectedRouteDetail.status)}
                      </span>
                    </div>
                    <div><strong>Creada:</strong> {new Date(selectedRouteDetail.createdAt).toLocaleString('es-AR')}</div>
                    <div><strong>Total Envíos:</strong> {selectedRouteDetail.orderIds.length}</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Información de Transporte</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>Transportista:</strong> {transportistData.name}</div>
                    <div><strong>Vehículo:</strong> {transportistData.vehicle}</div>
                    <div><strong>Placa:</strong> {transportistData.plate}</div>
                    <div><strong>Tipo:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        transportistData.type === 'local' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transportistData.type === 'local' ? 'Local' : 'Larga Distancia'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Órdenes en esta Hoja de Ruta</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Código</th>
                        <th className="text-left py-2">Remitente</th>
                        <th className="text-left py-2">Destinatario</th>
                        <th className="text-left py-2">Bultos</th>
                        <th className="text-left py-2">Peso</th>
                        <th className="text-left py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getOrders().filter(order => selectedRouteDetail.orderIds.includes(order.id)).map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2 font-mono">{order.trackingCode}</td>
                          <td className="py-2">
                            <div>
                              <div className="font-medium">{order.sender.name}</div>
                              <div className="text-xs text-gray-500">{order.sender.phone}</div>
                            </div>
                          </td>
                          <td className="py-2">
                            <div>
                              <div className="font-medium">{order.recipient.name}</div>
                              <div className="text-xs text-gray-500">{order.recipient.phone}</div>
                            </div>
                          </td>
                          <td className="py-2">{order.package.quantity}</td>
                          <td className="py-2">{order.package.weight}kg</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRouteDetailModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const sheetOrders = getOrders().filter(order => selectedRouteDetail.orderIds.includes(order.id));

                    const printContent = `
                      <html>
                        <head><title>Hoja de Ruta ${selectedRouteDetail.code}</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                          <h1>HOJA DE RUTA - ${selectedRouteDetail.code}</h1>
                          <div style="margin-bottom: 20px;">
                            <h2>Destino: ${selectedRouteDetail.city}, ${selectedRouteDetail.province}</h2>
                            <p><strong>Transportista:</strong> ${transportistData.name}</p>
                            <p><strong>Vehículo:</strong> ${transportistData.vehicle} - ${transportistData.plate}</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
                          </div>
                          <table border="1" style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background-color: #f0f0f0;">
                                <th style="padding: 8px;">Código</th>
                                <th style="padding: 8px;">Remitente</th>
                                <th style="padding: 8px;">Destinatario</th>
                                <th style="padding: 8px;">Teléfono</th>
                                <th style="padding: 8px;">Bultos</th>
                                <th style="padding: 8px;">Peso</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${sheetOrders.map(order => `
                                <tr>
                                  <td style="padding: 8px; font-family: monospace;">${order.trackingCode}</td>
                                  <td style="padding: 8px;">${order.sender.name}</td>
                                  <td style="padding: 8px;">${order.recipient.name}</td>
                                  <td style="padding: 8px;">${order.recipient.phone}</td>
                                  <td style="padding: 8px;">${order.package.quantity}</td>
                                  <td style="padding: 8px;">${order.package.weight}kg</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div style="margin-top: 30px;">
                            <p><strong>Total de envíos:</strong> ${sheetOrders.length}</p>
                            <p><strong>Peso total:</strong> ${sheetOrders.reduce((sum, order) => sum + order.package.weight, 0)}kg</p>
                          </div>
                        </body>
                      </html>
                    `;

                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(printContent);
                    printWindow?.document.close();
                    printWindow?.print();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-printer-line mr-2"></i>
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Entrega a Cliente */}
        {showDeliveryModal && selectedOrderForDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Registrar Entrega - {selectedOrderForDelivery.trackingCode}
              </h3>

              <form onSubmit={handleDeliveryToCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Receptor</label>
                  <input
                    type="text"
                    value={deliveryForm.recipientName}
                    onChange={(e) => setDeliveryForm({...deliveryForm, recipientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DNI del Receptor</label>
                  <input
                    type="text"
                    value={deliveryForm.recipientDNI}
                    onChange={(e) => setDeliveryForm({...deliveryForm, recipientDNI: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firma/Confirmación</label>
                  <input
                    type="text"
                    value={deliveryForm.signature}
                    onChange={(e) => setDeliveryForm({...deliveryForm, signature: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre completo o código de confirmación"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones (Opcional)</label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Comentarios adicionales sobre la entrega..."
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-information-line text-yellow-600"></i>
                    </div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold">Información importante:</p>
                      <p>Verifique la identidad del receptor antes de entregar el paquete. Esta acción no se puede deshacer.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Confirmar Entrega
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
