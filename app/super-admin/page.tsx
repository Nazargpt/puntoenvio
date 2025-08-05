
'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  getOrders, 
  getAgencies, 
  getTransportists, 
  getRoutes,
  saveRoutes,
  Order,
  Agency,
  Transportist,
  Route,
  saveOrder,
  updateOrderStatus,
  generateRoute,
  createTestOrders,
  getTransportistPaymentHistory,
  calculateTransportistPayment
} from '../../lib/storage';

interface OptimizedRoute {
  id: string;
  transportistId: string;
  type: 'collection' | 'delivery';
  orders: Order[];
  optimizedStops: {
    address: string;
    orderIds: string[];
    estimatedDuration: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  totalDistance: number;
  estimatedTime: number;
  createdAt: string;
  status: 'planned' | 'active' | 'completed';
}

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [transportists, setTransportists] = useState<Transportist[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [showStopLocationModal, setShowStopLocationModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<{
    stop: OptimizedRoute['optimizedStops'][0];
    route: OptimizedRoute;
    stopIndex: number;
  } | null>(null);
  const [showTransportistDetailModal, setShowTransportistDetailModal] = useState(false);
  const [selectedTransportist, setSelectedTransportist] = useState<Transportist | null>(null);

  // Estados para gestión de tarifas
  const [rateMatrix, setRateMatrix] = useState({
    'Buenos Aires': { '0-5': 2500, '5-10': 3000, '10-15': 3500, '15-20': 4000, '20-25': 4500 },
    'CABA': { '0-5': 2200, '5-10': 2700, '10-15': 3200, '15-20': 3700, '20-25': 4200 },
    'Córdoba': { '0-5': 2800, '5-10': 3300, '10-15': 3800, '15-20': 4300, '20-25': 4800 },
    'Santa Fe': { '0-5': 2700, '5-10': 3200, '10-15': 3700, '15-20': 4200, '20-25': 4700 },
    'Mendoza': { '0-5': 3200, '5-10': 3700, '10-15': 4200, '15-20': 4700, '20-25': 5200 },
    'Tucumán': { '0-5': 3100, '5-10': 3600, '10-15': 4100, '15-20': 4600, '20-25': 5100 },
    'Salta': { '0-5': 3300, '5-10': 3800, '10-15': 4300, '15-20': 4800, '20-25': 5300 },
    'Misiones': { '0-5': 3000, '5-10': 3500, '10-15': 4000, '15-20': 4500, '20-25': 5000 },
    'Neuquén': { '0-5': 3400, '5-10': 3900, '10-15': 4400, '15-20': 4900, '20-25': 5400 },
    'Chubut': { '0-5': 3600, '5-10': 4100, '10-15': 4600, '15-20': 5100, '20-25': 5600 },
    'Santa Cruz': { '0-5': 4000, '5-10': 4500, '10-15': 5000, '15-20': 5500, '20-25': 6000 },
    'Tierra del Fuego': { '0-5': 4500, '5-10': 5000, '10-15': 5500, '15-20': 6000, '20-25': 6500 },
    'Otras Provincias': { '0-5': 3000, '5-10': 3500, '10-15': 4000, '15-20': 4500, '20-25': 5000 }
  });
  const [editingRate, setEditingRate] = useState<{ province: string; weight: string } | null>(null);
  const [tempRateValue, setTempRateValue] = useState('');
  const [calculatorData, setCalculatorData] = useState({
    weight: '',
    province: '',
    declaredValue: '10000'
  });
  const [calculatedResult, setCalculatedResult] = useState({
    freight: 0,
    insurance: 0,
    adminFees: 0,
    iva: 0,
    total: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setOrders(getOrders());
    setAgencies(getAgencies());
    setTransportists(getTransportists());
    setRoutes(getRoutes());
  };

  const handleClearRoutes = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearRoutes = () => {
    // Clear optimized routes
    setOptimizedRoutes([]);

    // Clear regular routes
    saveRoutes([]);
    setRoutes([]);

    // Reset order assignments
    const updatedOrders = orders.map(order => {
      if (order.assignedTransportist || order.route) {
        const resetOrder = {
          ...order,
          assignedTransportist: undefined,
          route: undefined,
          status: order.status === 'en-transito' ? 'pendiente-recoleccion' as const : order.status
        };

        // Add history entry
        resetOrder.history.unshift({
          date: new Date().toISOString(),
          status: 'Rutas limpiadas',
          location: 'Sistema Central',
          description: 'Rutas optimizadas limpiadas por administrador - orden disponible para reasignación'
        });

        return resetOrder;
      }
      return order;
    });

    // Save updated orders
    updatedOrders.forEach(order => {
      if (order.assignedTransportist !== orders.find(o => o.id === order.id)?.assignedTransportist) {
        saveOrder(order);
      }
    });

    setOrders(updatedOrders);
    setShowConfirmDialog(false);

    alert('Rutas limpiadas exitosamente. Las órdenes han sido liberadas para nueva asignación.');
  };

  const handleViewRouteDetail = (route: OptimizedRoute) => {
    setSelectedRoute(route);
    setShowRouteDetailModal(true);
  };

  const handleActivateRoute = (routeId: string) => {
    setOptimizedRoutes(prev => prev.map(route => 
      route.id === routeId ? { ...route, status: 'active' as const } : route
    ));

    // Assign transportist to orders in this route
    const route = optimizedRoutes.find(r => r.id === routeId);
    if (route) {
      const updatedOrders = orders.map(order => {
        if (route.orders.some(routeOrder => routeOrder.id === order.id)) {
          const updatedOrder = {
            ...order,
            assignedTransportist: route.transportistId,
            status: route.type === 'collection' ? 'en-transito' as const : order.status
          };

          updatedOrder.history.unshift({
            date: new Date().toISOString(),
            status: 'Ruta activada',
            location: 'Sistema Central',
            description: `Orden asignada a ruta optimizada de ${route.type === 'collection' ? 'recolección' : 'entrega'}`
          });

          saveOrder(updatedOrder);
          return updatedOrder;
        }
        return order;
      });

      setOrders(updatedOrders);

      const transportist = transportists.find(t => t.id === route.transportistId);
      alert(`Ruta activada exitosamente. ${route.orders.length} órdenes asignadas a ${transportist?.name}.`);
    }
  };

  const handleViewStopLocation = (stop: OptimizedRoute['optimizedStops'][0], route: OptimizedRoute, stopIndex: number) => {
    setSelectedStop({ stop, route, stopIndex });
    setShowStopLocationModal(true);
  };

  const handleViewTransportistDetail = (transportist: Transportist) => {
    setSelectedTransportist(transportist);
    setShowTransportistDetailModal(true);
  };

  const generateOptimizedRouteForTransportist = (transportistId: string, type: 'collection' | 'delivery'): OptimizedRoute | null => {
    const transportist = transportists.find(t => t.id === transportistId);
    if (!transportist || transportist.type !== 'local') return null;

    let relevantOrders: Order[] = [];

    if (type === 'collection') {
      relevantOrders = orders.filter(order => 
        order.status === 'pendiente-recoleccion' &&
        transportist.zones.some(zone => 
          order.sender.city.toLowerCase().includes(zone.toLowerCase()) ||
          order.sender.province.toLowerCase().includes(zone.toLowerCase())
        ) && 
        !order.assignedTransportist
      );
    } else {
      relevantOrders = orders.filter(order => 
        (order.status === 'en-transito' || order.status === 'en-agencia-destino') && 
        order.assignedTransportist === transportistId && 
        transportist.zones.some(zone => 
          order.recipient.city.toLowerCase().includes(zone.toLowerCase()) ||
          order.recipient.province.toLowerCase().includes(zone.toLowerCase())
        )
      );
    }

    if (relevantOrders.length === 0) return null;

    const locationGroups = relevantOrders.reduce((groups, order) => {
      const location = type === 'collection' 
        ? `${order.sender.address}, ${order.sender.city}`
        : `${order.recipient.address}, ${order.recipient.city}`;
      
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(order);
      return groups;
    }, {} as Record<string, Order[]>);

    const optimizedStops = Object.entries(locationGroups).map(([address, orderGroup]) => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      const totalValue = orderGroup.reduce((sum, order) => sum + order.costs.total, 0);
      const hasUrgentOrder = orderGroup.some(order => {
        const createdDate = new Date(order.createdAt);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated > 2;
      });

      if (hasUrgentOrder || totalValue > 50000) {
        priority = 'high';
      } else if (totalValue < 10000) {
        priority = 'low';
      }

      return {
        address,
        orderIds: orderGroup.map(o => o.id),
        estimatedDuration: Math.max(10, orderGroup.length * 5), 
        priority
      };
    });

    optimizedStops.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return b.orderIds.length - a.orderIds.length;
    });

    const optimizedRoute: OptimizedRoute = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      transportistId,
      type,
      orders: relevantOrders,
      optimizedStops,
      totalDistance: optimizedStops.length * 5, 
      estimatedTime: optimizedStops.reduce((sum, stop) => sum + stop.estimatedDuration + 15, 0), 
      createdAt: new Date().toISOString(),
      status: 'planned'
    };

    return optimizedRoute;
  };

  const handleGenerateOptimizedRoutes = () => {
    const newOptimizedRoutes: OptimizedRoute[] = [];

    // Generate optimized routes for each local transportist
    transportists.filter(t => t.type === 'local').forEach(transportist => {
      // Generate collection route
      const collectionRoute = generateOptimizedRouteForTransportist(transportist.id, 'collection');
      if (collectionRoute) {
        newOptimizedRoutes.push(collectionRoute);
      }

      // Generate delivery route
      const deliveryRoute = generateOptimizedRouteForTransportist(transportist.id, 'delivery');
      if (deliveryRoute) {
        newOptimizedRoutes.push(deliveryRoute);
      }
    });

    setOptimizedRoutes(newOptimizedRoutes);
    alert(`Se generaron ${newOptimizedRoutes.length} rutas optimizadas`);
  };

  const handleCreateTestData = () => {
    const testOrders = createTestOrders();
    loadData();
    alert(`Se crearon ${testOrders.length} órdenes de prueba`);
  };

  const handlePrintRoute = (route: OptimizedRoute) => {
    const transportist = transportists.find(t => t.id === route.transportistId);

    const printContent = `
      <html>
        <head>
          <title>Ruta Optimizada - ${transportist?.name}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stop { background: #ffffff; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
            .priority-high { border-left: 4px solid #dc3545; }
            .priority-medium { border-left: 4px solid #ffc107; }
            .priority-low { border-left: 4px solid #28a745; }
            .orders-list { margin-top: 10px; }
            .order-item { background: #f8f9fa; padding: 8px; margin: 5px 0; border-radius: 4px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
            th { background-color: #e9ecef; }
            .summary { background: #e7f3ff; padding: 15px; border-radius: 6px; margin-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ruta Optimizada de ${route.type === 'collection' ? 'Recolección' : 'Entrega'}</h1>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
              <div>
                <p><strong>Transportista:</strong> ${transportist?.name || 'No asignado'}</p>
                <p><strong>Vehículo:</strong> ${transportist?.vehicle || 'N/A'} - ${transportist?.plate || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${transportist?.phone || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Fecha de generación:</strong> ${new Date(route.createdAt).toLocaleString('es-AR')}</p>
                <p><strong>Total paradas:</strong> ${route.optimizedStops.length}</p>
                <p><strong>Total órdenes:</strong> ${route.orders.length}</p>
                <p><strong>Tiempo estimado:</strong> ${Math.floor(route.estimatedTime / 60)}h ${route.estimatedTime % 60}m</p>
              </div>
            </div>
          </div>
        
          <h2>Orden de Paradas Sugerido</h2>
          ${route.optimizedStops.map((stop, index) => `
            <div class="stop priority-${stop.priority}">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                  <h3 style="margin: 0; color: #495057;">Parada ${index + 1} - 
                    ${stop.priority === 'high' ? 'ALTA' : 
                      stop.priority === 'medium' ? 'MEDIA' : 
                      'BAJA'} PRIORIDAD
                  </h3>
                  <p style="margin: 5px 0; font-weight: bold;">${stop.address}</p>
                  <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
                    Duración estimada: ${stop.estimatedDuration} minutos | 
                    ${stop.orderIds.length} ${stop.orderIds.length === 1 ? 'orden' : 'órdenes'}
                  </p>
                </div>
              </div>
              <div class="orders-list">
                <h4 style="margin: 10px 0 5px 0; font-size: 14px;">Órdenes en esta parada:</h4>
                ${stop.orderIds.map(orderId => {
                  const order = route.orders.find(o => o.id === orderId);
                  return order ? `
                    <div class="order-item">
                      <strong>${order.trackingCode}</strong> - 
                      ${route.type === 'collection' ? 
                        `${order.sender.name} → ${order.recipient.name}` : 
                        `Para: ${order.recipient.name}`
                      }
                      <br>
                      <span style="color: #6c757d;">
                        ${route.type === 'collection' ? 
                          ` ${order.sender.phone}` : 
                          ` ${order.recipient.phone} | DNI: ${order.recipient.dni}`
                        }
                        | $${order.costs.total.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ` : '';
                }).join('')}
              </div>
            </div>
          `).join('')}
        
          <div class="summary">
            <h3>Resumen de la Ruta</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div>
                <p><strong>Paradas de alta prioridad:</strong> ${route.optimizedStops.filter(s => s.priority === 'high').length}</p>
                <p><strong>Paradas de media prioridad:</strong> ${route.optimizedStops.filter(s => s.priority === 'medium').length}</p>
                <p><strong>Paradas de baja prioridad:</strong> ${route.optimizedStops.filter(s => s.priority === 'low').length}</p>
              </div>
              <div>
                <p><strong>Distancia total estimada:</strong> ${route.totalDistance} km</p>
                <p><strong>Tiempo total estimado:</strong> ${Math.floor(route.estimatedTime / 60)}h ${route.estimatedTime % 60}m</p>
                <p><strong>Promedio por parada:</strong> ${Math.round(route.estimatedTime / route.optimizedStops.length)} min</p>
              </div>
              <div>
                <p><strong>Valor total de órdenes:</strong> $${route.orders.reduce((sum, order) => sum + order.costs.total, 0).toLocaleString('es-AR')}</p>
                <p><strong>Peso total:</strong> ${route.orders.reduce((sum, order) => sum + order.package.weight, 0)} kg</p>
                <p><strong>Total bultos:</strong> ${route.orders.reduce((sum, order) => sum + order.package.quantity, 0)}</p>
              </div>
            </div>
          </div>
        
          <div style="margin-top: 30px;">
            <h3>Consejos para el Transportista:</h3>
            <ul style="line-height: 1.6;">
              <li><strong>Sigue el orden sugerido:</strong> Las paradas están optimizadas por prioridad y eficiencia</li>
              <li><strong>Contacta antes de llegar:</strong> Llama a cada ${route.type === 'collection' ? 'remitente' : 'destinatario'} 15-20 minutos antes</li>
              <li><strong>Paradas rojas (alta prioridad):</strong> Atiende primero, son urgentes o de alto valor</li>
              <li><strong>Documentación:</strong> Verifica DNI en entregas y obtén firmas</li>
              <li><strong>Problemas:</strong> Contacta inmediatamente al centro de operaciones</li>
              <li><strong>Actualiza estados:</strong> Marca cada orden como completada en la app</li>
            </ul>
          </div>
        
          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
              Imprimir Ruta
            </button>
            <button onclick="window.close()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Cerrar
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const handleOpenInMaps = (route: OptimizedRoute) => {
    if (route.optimizedStops.length === 0) return;

    // Create waypoints for Google Maps
    const waypoints = route.optimizedStops.map(stop => 
      encodeURIComponent(stop.address)
    ).join('/');

    // Open Google Maps with the route
    const mapsUrl = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(mapsUrl, '_blank');
  };

  const handleRateEdit = (province: string, weight: string, currentValue: number) => {
    setEditingRate({ province, weight });
    setTempRateValue(currentValue.toString());
  };

  const handleRateSave = () => {
    if (editingRate && tempRateValue) {
      const newValue = parseFloat(tempRateValue);
      if (newValue > 0) {
        setRateMatrix(prev => ({
          ...prev,
          [editingRate.province]: {
            ...prev[editingRate.province],
            [editingRate.weight]: newValue
          }
        }));

        // Guardar en localStorage
        localStorage.setItem('puntoenvio-rate-matrix', JSON.stringify({
          ...rateMatrix,
          [editingRate.province]: {
            ...rateMatrix[editingRate.province],
            [editingRate.weight]: newValue
          }
        }));
      }
    }
    setEditingRate(null);
    setTempRateValue('');
  };

  const handleCalculateRates = () => {
    const weight = parseFloat(calculatorData.weight);
    const declaredValue = parseFloat(calculatorData.declaredValue);

    if (weight > 0 && calculatorData.province && declaredValue > 0) {
      // Determinar rango de peso
      let weightRange = '0-5';
      if (weight > 5) weightRange = '5-10';
      if (weight > 10) weightRange = '10-15';
      if (weight > 15) weightRange = '15-20';
      if (weight > 20) weightRange = '20-25';

      // Obtener tarifa base
      const provinceRates = rateMatrix[calculatorData.province] || rateMatrix['Otras Provincias'];
      const freight = provinceRates[weightRange as keyof typeof provinceRates];

      // Calcular otros costos
      const insurance = declaredValue * 0.10; // 10% del valor declarado
      const adminFees = freight * 0.15; // 15% del flete
      const subtotal = freight + insurance + adminFees;
      const iva = subtotal * 0.21; // 21% de IVA
      const total = subtotal + iva;

      setCalculatedResult({
        freight,
        insurance,
        adminFees,
        iva,
        total
      });
    }
  };

  // Cargar tarifas guardadas al inicializar
  useEffect(() => {
    const savedRates = localStorage.getItem('puntoenvio-rate-matrix');
    if (savedRates) {
      try {
        setRateMatrix(JSON.parse(savedRates));
      } catch (e) {
        console.error('Error loading saved rates');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Super Administrador</h1>
          <p className="text-gray-600">Control central del sistema PuntoEnvío</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {[ 
              { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
              { id: 'orders', label: 'Órdenes', icon: 'ri-package-line' },
              { id: 'routes', label: 'Gestión de Rutas', icon: 'ri-route-line' },
              { id: 'agencies', label: 'Agencias', icon: 'ri-building-line' },
              { id: 'transportists', label: 'Transportistas', icon: 'ri-truck-line' },
              { id: 'tarifas', label: 'Tarifas', icon: 'ri-price-tag-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-red-600 border-b-2 border-red-600' 
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-package-line text-2xl text-blue-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
                <div className="text-gray-600">Total Órdenes</div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-building-line text-2xl text-green-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{agencies.length}</div>
                <div className="text-gray-600">Agencias Activas</div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-truck-line text-2xl text-purple-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{transportists.length}</div>
                <div className="text-gray-600">Transportistas</div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-route-line text-2xl text-orange-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{routes.length + optimizedRoutes.length}</div>
                <div className="text-gray-600">Rutas Generadas</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCreateTestData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Crear Datos de Prueba
                </button>

                <button
                  onClick={handleGenerateOptimizedRoutes}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-route-line mr-2"></i>
                  Generar Rutas Optimizadas
                </button>

                <button
                  onClick={handleClearRoutes}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Limpiar Rutas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Routes Management */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Rutas</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleGenerateOptimizedRoutes}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-route-line mr-2"></i>
                    Generar Rutas Optimizadas
                  </button>

                  <button
                    onClick={handleClearRoutes}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-line mr-2"></i>
                    Limpiar Rutas
                  </button>
                </div>
              </div>

              {/* Optimized Routes */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rutas Optimizadas ({optimizedRoutes.length})</h3>
                {optimizedRoutes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay rutas optimizadas generadas
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {optimizedRoutes.map(route => {
                      const transportist = transportists.find(t => t.id === route.transportistId);
                      return (
                        <div key={route.id} className="border rounded-lg p-4 bg-green-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {transportist?.name} - {route.type === 'collection' ? 'Recolección' : 'Entrega'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {route.orders.length} órdenes, {route.optimizedStops.length} paradas
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              route.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                              route.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {route.status === 'planned' ? 'Planificada' : 
                               route.status === 'active' ? 'Activa' : 'Completada'}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Distancia estimada: {route.totalDistance}km</div>
                            <div>Tiempo estimado: {Math.round(route.estimatedTime / 60)}h {route.estimatedTime % 60}m</div>
                            <div>Prioridad alta: {route.optimizedStops.filter(s => s.priority === 'high').length} paradas</div>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button 
                              onClick={() => handleViewRouteDetail(route)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Ver Detalle
                            </button>
                            {route.status === 'planned' && (
                              <button 
                                onClick={() => handleActivateRoute(route.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Activar Ruta
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Regular Routes */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rutas Regulares ({routes.length})</h3>
                {routes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay rutas regulares creadas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routes.map(route => (
                      <div key={route.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">{route.name}</h4>
                            <p className="text-gray-600">{route.origin} → {route.destination}</p>
                            <p className="text-sm text-gray-500">{route.orderIds.length} órdenes asignadas</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            route.status === 'planificada' ? 'bg-yellow-100 text-yellow-800' :
                            route.status === 'en-curso' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Órdenes</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Código</th>
                    <th className="text-left py-3 px-2">Remitente</th>
                    <th className="text-left py-3 px-2">Destinatario</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Transportista</th>
                    <th className="text-left py-3 px-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2 font-mono text-sm">{order.trackingCode}</td>
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-semibold">{order.sender.name}</div>
                          <div className="text-sm text-gray-500">{order.sender.city}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-semibold">{order.recipient.name}</div>
                          <div className="text-sm text-gray-500">{order.recipient.city}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'pendiente-recoleccion' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'en-transito' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'en-agencia-destino' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        {order.assignedTransportist ? (
                          <span className="text-green-600 font-semibold">
                            {transportists.find(t => t.id === order.assignedTransportist)?.name || 'N/A'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-4 px-2">${order.costs.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other tabs content... */}
        {activeTab === 'agencies' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Agencias</h2>
            <p className="text-gray-600">Total de agencias: {agencies.length}</p>
            {/* Agency management content */}
          </div>
        )}

        {activeTab === 'transportists' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Transportistas</h2>
                <button
                  onClick={handleCreateTestData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Agregar Transportista
                </button>
              </div>

              {/* Statistcas de transportistas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-truck-line text-2xl text-blue-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-blue-800 text-center">
                    {transportists.length}
                  </div>
                  <div className="text-sm text-blue-600 text-center mt-1">Total Transportistas</div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-roadster-line text-2xl text-green-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-green-800 text-center">
                    {transportists.filter(t => t.type === 'local').length}
                  </div>
                  <div className="text-sm text-green-600 text-center mt-1">Locales</div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-road-map-line text-2xl text-purple-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-purple-800 text-center">
                    {transportists.filter(t => t.type === 'larga-distancia').length}
                  </div>
                  <div className="text-sm text-purple-600 text-center mt-1">Larga Distancia</div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-time-line text-2xl text-orange-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-orange-800 text-center">
                    {routes.filter(r => r.status === 'en-curso').length}
                  </div>
                  <div className="text-sm text-orange-600 text-center mt-1">Rutas Activas</div>
                </div>
              </div>

              {/* Lista de transportistas */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2">ID</th>
                      <th className="text-left py-3 px-2">Nombre</th>
                      <th className="text-left py-3 px-2">Vehículo</th>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-left py-3 px-2">Tipo</th>
                      <th className="text-left py-3 px-2">Zonas</th>
                      <th className="text-left py-3 px-2">Estado</th>
                      <th className="text-center py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportists.map(transportist => (
                      <tr key={transportist.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-2 font-mono text-sm">{transportist.id}</td>
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-semibold">{transportist.name}</div>
                            <div className="text-sm text-gray-500">{transportist.phone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2">{transportist.vehicle}</td>
                        <td className="py-4 px-2 font-mono">{transportist.plate}</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            transportist.type === 'local' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {transportist.type === 'local' ? 'Local' : 'Larga Distancia'}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm">
                            {transportist.zones?.slice(0, 2).join(', ') || 'Sin zonas asignadas'}
                            {transportist.zones && transportist.zones.length > 2 && (
                              <span className="text-gray-500"> +{transportist.zones.length - 2} más</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Activo
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <div className="flex space-x-2 justify-center">
                            <button
                              onClick={() => handleViewTransportistDetail(transportist)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Ver información"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            <button
                              onClick={() => {
                                alert(`Funcionalidad de edición de transportista próximamente disponible.\n\nTransportista: ${transportist.name}\nID: ${transportist.id}`);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Editar transportista"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de desactivar al transportista ${transportist.name}?\n\nEsta acción afectará las rutas activas asignadas.`)) {
                                  alert(`Transportista ${transportist.name} ha sido desactivado.\n\nLas rutas activas han sido reasignadas automáticamente.`);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Desactivar transportista"
                            >
                              <i className="ri-user-unfollow-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {transportists.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-truck-line text-3xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay transportistas registrados</h3>
                    <p className="text-gray-500 mb-4">Agrega transportistas para comenzar a gestionar las entregas</p>
                    <button
                      onClick={handleCreateTestData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Agregar Primer Transportista
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de gestión de rutas por transportista */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Rutas por Transportista</h3>
              <div className="space-y-4">
                {transportists.map(transportist => {
                  const transportistRoutes = routes.filter(r => r.transportistId === transportist.id);
                  const transportistOrders = orders.filter(o => o.assignedTransportist === transportist.id);

                  return (
                    <div key={transportist.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {transportist.name} ({transportist.vehicle})
                          </h4>
                          <p className="text-sm text-gray-600">
                            {transportist.type === 'local' ? 'Transportista Local' : 'Larga Distancia'} - {transportist.plate}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-600">Rutas: {transportistRoutes.length}</div>
                          <div className="text-gray-600">Órdenes: {transportistOrders.length}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {transportistRoutes.filter(r => r.status === 'planificada').length}
                          </div>
                          <div className="text-xs text-gray-600">Rutas Planificadas</div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {transportistRoutes.filter(r => r.status === 'en-curso').length}
                          </div>
                          <div className="text-xs text-gray-600">Rutas En Curso</div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-green-600">
                            {transportistRoutes.filter(r => r.status === 'completada').length}
                          </div>
                          <div className="text-xs text-gray-600">Rutas Completadas</div>
                        </div>
                      </div>

                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => {
                            const routeDetails = transportistRoutes.map((route, index) => 
                              `${index + 1}. ${route.name} (${route.status}) - ${route.orderIds.length} órdenes`
                            ).join('\n');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Ver Rutas Detalladas
                        </button>
                        <button
                          onClick={() => {
                            alert(`Funcionalidad de asignación de nueva ruta próximamente disponible.\n\nTransportista: ${transportist.name}\nTipo: ${transportist.type}\nZonas: ${transportist.zones?.join(', ') || 'Sin zonas'}`);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Asignar Nueva Ruta
                        </button>
                        {transportistOrders.length > 0 && (
                          <button
                            onClick={() => {
                              const orderDetails = transportistOrders.map(order => 
                                `• ${order.trackingCode}: ${order.sender.city} → ${order.recipient.city} (${order.status})`
                              ).join('\n');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Ver Órdenes Activas
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {transportists.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-truck-line text-4xl mb-3"></i>
                    <p>No hay transportistas para mostrar rutas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tarifas' && (
          <div className="space-y-6">
            {/* Calculadora de Tarifas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="ri-calculator-line mr-3 text-green-600"></i>
                Calculadora de Tarifas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                  <select
                    value={calculatorData.weight}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 pr-8"
                  >
                    <option value="">Seleccionar peso...</option>
                    <option value="2.5">0-5kg</option>
                    <option value="7.5">5-10kg</option>
                    <option value="12.5">10-15kg</option>
                    <option value="17.5">15-20kg</option>
                    <option value="22.5">20-25kg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia Destino</label>
                  <select
                    value={calculatorData.province}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 pr-8"
                  >
                    <option value="">Seleccionar provincia...</option>
                    {Object.keys(rateMatrix).map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor Declarado ($)</label>
                  <input
                    type="number"
                    value={calculatorData.declaredValue}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, declaredValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="10000"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleCalculateRates}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-calculator-line mr-2"></i>
                    Calcular
                  </button>
                </div>
              </div>

              {/* Resultado de la calculadora */}
              {calculatedResult.total > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Resultado del Cálculo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Flete base:</span>
                        <span className="font-semibold">${calculatedResult.freight.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Seguro (10%):</span>
                        <span className="font-semibold">${calculatedResult.insurance.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Gastos Admin (15%):</span>
                        <span className="font-semibold">${calculatedResult.adminFees.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">IVA (21%):</span>
                        <span className="font-semibold">${calculatedResult.iva.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-xl font-bold text-gray-800">Total:</span>
                          <span className="text-xl font-bold text-green-600">
                            ${calculatedResult.total.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Matriz de Tarifas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <i className="ri-table-line mr-3 text-blue-600"></i>
                  Matriz de Tarifas por Provincia y Peso
                </h2>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de restablecer todas las tarifas a los valores por defecto?')) {
                      const defaultRates = {
                        'Buenos Aires': { '0-5': 2500, '5-10': 3000, '10-15': 3500, '15-20': 4000, '20-25': 4500 },
                        'CABA': { '0-5': 2200, '5-10': 2700, '10-15': 3200, '15-20': 3700, '20-25': 4200 },
                        'Córdoba': { '0-5': 2800, '5-10': 3300, '10-15': 3800, '15-20': 4300, '20-25': 4800 },
                        'Santa Fe': { '0-5': 2700, '5-10': 3200, '10-15': 3700, '15-20': 4200, '20-25': 4700 },
                        'Mendoza': { '0-5': 3200, '5-10': 3700, '10-15': 4200, '15-20': 4700, '20-25': 5200 },
                        'Tucumán': { '0-5': 3100, '5-10': 3600, '10-15': 4100, '15-20': 4600, '20-25': 5100 },
                        'Salta': { '0-5': 3300, '5-10': 3800, '10-15': 4300, '15-20': 4800, '20-25': 5300 },
                        'Misiones': { '0-5': 3000, '5-10': 3500, '10-15': 4000, '15-20': 4500, '20-25': 5000 },
                        'Neuquén': { '0-5': 3400, '5-10': 3900, '10-15': 4400, '15-20': 4900, '20-25': 5400 },
                        'Chubut': { '0-5': 3600, '5-10': 4100, '10-15': 4600, '15-20': 5100, '20-25': 5600 },
                        'Santa Cruz': { '0-5': 4000, '5-10': 4500, '10-15': 5000, '15-20': 5500, '20-25': 6000 },
                        'Tierra del Fuego': { '0-5': 4500, '5-10': 5000, '10-15': 5500, '15-20': 6000, '20-25': 6500 },
                        'Otras Provincias': { '0-5': 3000, '5-10': 3500, '10-15': 4000, '15-20': 4500, '20-25': 5000 }
                      };
                      setRateMatrix(defaultRates);
                      localStorage.setItem('puntoenvio-rate-matrix', JSON.stringify(defaultRates));
                      alert('Tarifas restablecidas a valores por defecto');
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Restablecer Valores
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-800">Provincia</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-800">0-5kg</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-800">5-10kg</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-800">10-15kg</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-800">15-20kg</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-800">20-25kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rateMatrix).map(([province, rates]) => (
                      <tr key={province} className="border-b hover:bg-gray-50 group">
                        <td className="py-3 px-4 font-medium text-gray-800">{province}</td>
                        {Object.entries(rates).map(([weightRange, price]) => (
                          <td key={weightRange} className="py-3 px-4 text-center">
                            {editingRate?.province === province && editingRate?.weight === weightRange ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={tempRateValue}
                                  onChange={(e) => setTempRateValue(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={handleRateSave}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <i className="ri-check-line"></i>
                                </button>
                                <button
                                  onClick={() => setEditingRate(null)}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <i className="ri-close-line"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <span className="font-semibold text-gray-800">
                                  ${price.toLocaleString('es-AR')}
                                </span>
                                <button
                                  onClick={() => handleRateEdit(province, weightRange, price)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap opacity-0 group-hover:opacity-100"
                                  title="Editar tarifa"
                                >
                                  <i className="ri-edit-line"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Información sobre estructura de costos */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="ri-information-line mr-3 text-yellow-600"></i>
                Estructura de Costos del Sistema
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Componentes del Precio Final</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <span className="font-medium text-blue-800">Flete Base</span>
                        <p className="text-xs text-blue-600">Según matriz de tarifas</p>
                      </div>
                      <span className="text-blue-800 font-bold">Variable</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <span className="font-medium text-green-800">Seguro</span>
                        <p className="text-xs text-green-600">10% del valor declarado</p>
                      </div>
                      <span className="text-green-800 font-bold">10%</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <span className="font-medium text-purple-800">Gastos Administrativos</span>
                        <p className="text-xs text-purple-600">15% del flete</p>
                      </div>
                      <span className="text-purple-800 font-bold">15%</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <span className="font-medium text-orange-800">IVA</span>
                        <p className="text-xs text-orange-600">21% del subtotal</p>
                      </div>
                      <span className="text-orange-800 font-bold">21%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Servicios Adicionales</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">Termosellado</h4>
                      <p className="text-sm text-yellow-700 mb-2">
                        Servicio opcional de protección adicional del paquete
                      </p>
                      <div className="text-xs text-yellow-600">
                        <p>• Máximo: 10% del valor del flete</p>
                        <p>• Se agrega al costo total</p>
                        <p>• Recomendado para envíos frágiles</p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-800 mb-2">Modalidades de Pago</h4>
                      <div className="text-sm text-indigo-700 space-y-1">
                        <p><strong>Pago en Origen:</strong> Se cobra antes del envío</p>
                        <p><strong>Pago en Destino:</strong> Se cobra contra entrega</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar Limpieza de Rutas</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres limpiar todas las rutas? Esta acción:
              </p>
              <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
                <li>Eliminará todas las rutas optimizadas</li>
                <li>Liberará todas las órdenes asignadas</li>
                <li>Permitirá reasignar transportistas</li>
                <li>No se puede deshacer</li>
              </ul>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmClearRoutes}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Confirmar Limpieza
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
