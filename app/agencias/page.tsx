import { Transportist } from "@/lib/storage";

'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  getOrders, 
  updateOrderStatus, 
  generateRouteSheets, 
  getRouteSheetsByAgency,
  assignTransportistToRouteSheet,
  getTransportists,
  getAgencies,
  deliverToFinalCustomer,
  RouteSheet,
  Order,
  getSettlements,
  uploadPaymentProof,
  Settlement
} from '../../lib/storage';

interface AgencyUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'operator';
  agencyId: string;
  isActive: boolean;
}

interface SalesData {
  totalOrders: number;
  totalRevenue: number;
  commission: number;
  commissionRate: number;
  monthlyOrders: number;
  monthlyRevenue: number;
}

export default function Agencias() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [currentUser, setCurrentUser] = useState<AgencyUser | null>(null);
  const [agencyData, setAgencyData] = useState({
    id: 'agency-1',
    name: 'Agencia Centro Bogotá',
    address: 'Carrera 7 # 32-45, Centro',
    phone: '+57 1 234 5678',
    email: 'centro@puntoenvio.com',
    schedule: '8:00 AM - 6:00 PM',
    city: 'Bogotá',
    province: 'Cundinamarca',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    }
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [routeSheets, setRouteSheets] = useState<RouteSheet[]>([]);
  const [transportists, setTransportists] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editingAgency, setEditingAgency] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRouteSheet, setSelectedRouteSheet] = useState<RouteSheet | null>(null);
  const [showRouteSheetModal, setShowRouteSheetModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    recipientName: '',
    recipientDNI: '',
    signature: '',
    notes: ''
  });
  const [salesData, setSalesData] = useState<SalesData>({
    totalOrders: 0,
    totalRevenue: 0,
    commission: 0,
    commissionRate: 0.05,
    monthlyOrders: 0,
    monthlyRevenue: 0
  });
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    loadAgencyData();
  }, [agencyData.city, agencyData.province, agencyData.id]);

  const loadAgencyData = () => {
    const allOrders = getOrders();

    // Filtrar órdenes de la agencia
    const agencyOrders = allOrders.filter(order => 
      (order.recipient.city === agencyData.city && order.recipient.province === agencyData.province) ||
      (order.sender.city === agencyData.city && order.sender.province === agencyData.province) ||
      order.assignedAgency === agencyData.id
    );

    setOrders(agencyOrders);
    setRouteSheets(getRouteSheetsByAgency(agencyData.id));
    setTransportists(getTransportists());

    // Cargar liquidaciones de la agencia
    const agencySettlements = getSettlements().filter(s => s.agencyId === agencyData.id);
    setSettlements(agencySettlements);

    // Calcular datos de ventas
    calculateSalesData(agencyOrders);
  };

  const calculateSalesData = (agencyOrders: Order[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalRevenue = agencyOrders.reduce((sum, order) => sum + order.costs.total, 0);

    // Calcular comisiones basadas en la configuración de la agencia - CORREGIDO
    let totalCommission = 0;
    if (agencyData.commissions) {
      agencyOrders.forEach(order => {
        // Determinar el tipo de envío y aplicar la comisión correspondiente
        if (order.package.serviceType === 'Ecommerce') {
          // Para ecommerce, comisiones FIJAS por paquete
          totalCommission += agencyData.commissions.ecommRecibido; // Comisión fija por recibir
          if (order.status === 'entregado') {
            totalCommission += agencyData.commissions.ecommEntregado; // Comisión fija adicional por entregar
          }
        } else {
          // Para encomiendas, comisión porcentual SOLO sobre el flete
          let commissionRate = 0;
          if (order.package.serviceType === 'Pago en Destino') {
            commissionRate = agencyData.commissions.encomiendaPagoDestino;
          } else {
            commissionRate = agencyData.commissions.encomiendaCobrOrigen;
          }
          
          // Calcular comisión SOLO sobre el flete, no sobre el total
          const freightCommission = (order.costs.freight * commissionRate) / 100;
          totalCommission += freightCommission;

        }

        // Agregar comisión por termosellado si aplica (porcentual sobre el valor del termosellado)
        if (order.costs.thermoseal > 0) {
          const thermoCommission = (order.costs.thermoseal * agencyData.commissions.termosellado) / 100;
          totalCommission += thermoCommission;
        }
      });
    } else {
      // Comisión por defecto del 5% solo sobre el flete
      totalCommission = agencyOrders.reduce((sum, order) => sum + (order.costs.freight * 0.05), 0);
    }

    const monthlyOrders = agencyOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.costs.total, 0);

    setSalesData({
      totalOrders: agencyOrders.length,
      totalRevenue,
      commission: totalCommission,
      commissionRate: agencyData.commissions ? 
        Object.values(agencyData.commissions).reduce((sum, rate) => sum + rate, 0) / Object.values(agencyData.commissions).length : 
        5.0,
      monthlyOrders: monthlyOrders.length,
      monthlyRevenue
    });
  };

  const getAgencyUsers = (): AgencyUser[] => {
    const stored = localStorage.getItem('puntoenvio-agency-users');
    return stored ? JSON.parse(stored) : [];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const agencies = getAgencies();
    const validAgency = agencies.find(agency => 
      (agency.username === loginForm.email || agency.email === loginForm.email) && 
      agency.password === loginForm.password
    );

    if (validAgency) {
      setIsLoggedIn(true);
      setAgencyData({
        id: validAgency.id,
        name: validAgency.name,
        address: validAgency.address,
        phone: validAgency.phone,
        email: validAgency.email,
        schedule: validAgency.schedule,
        city: validAgency.city,
        province: validAgency.province,
        commissions: validAgency.commissions
      });

      setCurrentUser({
        id: 'admin-' + validAgency.id,
        name: validAgency.manager,
        email: validAgency.email,
        password: validAgency.password || '',
        role: 'admin',
        agencyId: validAgency.id,
        isActive: true
      });
      return;
    }

    const agencyUsers = getAgencyUsers();
    const validUser = agencyUsers.find(user => 
      user.email === loginForm.email && user.password === loginForm.password && user.isActive
    );

    if (validUser) {
      const userAgency = agencies.find(agency => agency.id === validUser.agencyId);

      if (userAgency) {
        setIsLoggedIn(true);
        setCurrentUser(validUser);
        setAgencyData({
          id: userAgency.id,
          name: userAgency.name,
          address: userAgency.address,
          phone: userAgency.phone,
          email: userAgency.email,
          schedule: userAgency.schedule,
          city: userAgency.city,
          province: userAgency.province,
          commissions: userAgency.commissions
        });
        return;
      }
    }

    alert('Credenciales incorrectas. Verifique usuario/email y contraseña.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginForm({ email: '', password: '' });
    setActiveTab('dashboard');
  };

  const handleStatusUpdate = (trackingCode: string, newStatus: string) => {
    if (!currentUser) return;

    const statusDescriptions = {
      'en-transito': 'Paquete recogido por transportista',
      'en-agencia-destino': 'Paquete disponible en agencia destino',
      'entregado': 'Paquete entregado al destinatario'
    };

    updateOrderStatus(
      trackingCode, 
      newStatus as any, 
      `${agencyData.city}, ${agencyData.province}`,
      statusDescriptions[newStatus] || 'Estado actualizado'
    );

    loadAgencyData();
  };

  const handleGenerateRouteSheets = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Solo los administradores pueden generar hojas de ruta.');
      return;
    }

    const newRouteSheets = generateRouteSheets(agencyData.id);
    loadAgencyData();

    if (newRouteSheets.length > 0) {
      alert(`Se generaron ${newRouteSheets.length} hojas de ruta nuevas`);
    } else {
      alert('No hay órdenes pendientes para generar hojas de ruta');
    }
  };

  const handleAssignTransportist = (routeSheetId: string, transportistId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Solo los administradores pueden asignar transportistas.');
      return;
    }

    assignTransportistToRouteSheet(routeSheetId, transportistId);
    loadAgencyData();
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
      loadAgencyData();
      alert('Entrega registrada exitosamente');
    } else {
      alert('Error al registrar la entrega');
    }
  };

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente-recoleccion': return 'bg-yellow-100 text-yellow-800';
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
      case 'en-transito': return 'En Tránsito';
      case 'en-agencia-destino': return 'En Agencia';
      case 'en-curso': return 'En Curso';
      case 'completada': return 'Completada';
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
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-line text-3xl text-blue-600"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Portal de Agencias</h1>
              <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email o Usuario</label>
                <input
                  type="text"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@agencia.com o pe001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Credenciales de prueba:</h4>

                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-blue-700 mb-2">Acceso de Agencia:</h5>
                  <div className="text-xs text-blue-700 space-y-1 ml-4">
                    <p><strong>Usuario:</strong> pe001 | <strong>Contraseña:</strong> centro123</p>
                    <p><strong>Usuario:</strong> pe002 | <strong>Contraseña:</strong> vicentelopez123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleUploadPaymentProof = async (settlementId: string) => {
    if (!paymentProofFile) {
      alert('Por favor seleccione un archivo para subir');
      return;
    }

    setUploadingProof(true);
    try {
      await uploadPaymentProof(settlementId, paymentProofFile);
      alert('Comprobante de pago subido exitosamente');
      setShowSettlementModal(false);
      setSelectedSettlement(null);
      setPaymentProofFile(null);
      loadAgencyData();
    } catch (error) {
      alert('Error al subir el comprobante. Inténtelo nuevamente.');
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Agencia</h1>
            <div className="mt-2">
              <p className="text-gray-600">{agencyData.name}</p>
              {currentUser && (
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-500">
                    Conectado como: <strong>{currentUser.name}</strong>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentUser.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </div>
              )}
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
              { id: 'orders', label: 'Órdenes', icon: 'ri-package-line' },
              { id: 'route-sheets', label: 'Hojas de Ruta', icon: 'ri-file-list-3-line' },
              { id: 'incoming-routes', label: 'Por Recibir', icon: 'ri-truck-line' },
              { id: 'deliveries', label: 'Entregas', icon: 'ri-user-received-line' },
              { id: 'sales', label: 'Ventas y Comisiones', icon: 'ri-money-dollar-circle-line' },
              { id: 'settlements', label: 'Liquidaciones', icon: 'ri-receipt-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${ 
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
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
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-package-line text-2xl text-blue-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
                <div className="text-gray-600">Total Órdenes</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-time-line text-2xl text-yellow-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {orders.filter(o => o.status === 'pendiente-recoleccion').length}
                </div>
                <div className="text-gray-600">Por Recoger</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-building-line text-2xl text-orange-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {orders.filter(o => o.status === 'en-agencia-destino').length}
                </div>
                <div className="text-gray-600">En Agencia</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-2xl text-green-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {orders.filter(o => o.status === 'entregado').length}
                </div>
                <div className="text-gray-600">Entregadas</div>
              </div>
              {/* Nueva métrica de crédito */}
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-wallet-line text-2xl text-purple-600"></i>
                </div>
                <div className={`text-2xl font-bold ${ 
                  (agencyData.currentCredit || 0) > (agencyData.creditLimit || 50000) * 0.8
                    ? 'text-red-600'
                    : (agencyData.currentCredit || 0) > (agencyData.creditLimit || 50000) * 0.6
                    ? 'text-orange-600'
                    : 'text-purple-600'
                }`}>
                  ${((agencyData.currentCredit || 0) / 1000).toFixed(0)}k
                </div>
                <div className="text-gray-600">Crédito Usado</div>
                <div className="text-xs text-gray-500 mt-1">
                  de ${((agencyData.creditLimit || 50000) / 1000).toFixed(0)}k límite
                </div>
              </div>
            </div>

            {/* Información de crédito y liquidaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  <i className="ri-wallet-line mr-2 text-purple-600"></i>
                  Estado de Crédito
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Límite de Crédito:</span>
                    <span className="font-semibold text-green-600">
                      ${(agencyData.creditLimit || 50000).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédito Actual:</span>
                    <span className={`font-semibold ${ 
                      (agencyData.currentCredit || 0) > (agencyData.creditLimit || 50000) * 0.8
                        ? 'text-red-600'
                        : (agencyData.currentCredit || 0) > (agencyData.creditLimit || 50000) * 0.6
                        ? 'text-orange-600'
                        : 'text-blue-600'
                    }`}>
                      ${(agencyData.currentCredit || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponible:</span>
                    <span className="font-semibold text-gray-800">
                      ${((agencyData.creditLimit || 50000) - (agencyData.currentCredit || 0)).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilización:</span>
                    <span className="font-semibold">
                      {Math.round(((agencyData.currentCredit || 0) / (agencyData.creditLimit || 1)) * 100)}%
                    </span>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${ 
                          ((agencyData.currentCredit || 0) / (agencyData.creditLimit || 1)) > 0.8
                            ? 'bg-red-500'
                            : ((agencyData.currentCredit || 0) / (agencyData.creditLimit || 1)) > 0.6
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(((agencyData.currentCredit || 0) / (agencyData.creditLimit || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {((agencyData.currentCredit || 0) / (agencyData.creditLimit || 1)) > 0.8 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-alert-line text-red-600"></i>
                        </div>
                        <div className="text-sm text-red-800">
                          <p className="font-semibold">¡Límite de crédito próximo!</p>
                          <p className="text-xs">Su agencia está utilizando más del 80% del límite de crédito disponible.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  <i className="ri-receipt-line mr-2 text-green-600"></i>
                  Liquidaciones Recientes
                </h3>
                <div className="space-y-3">
                  {settlements.slice(-5).reverse().map(settlement => (
                    <div key={settlement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-sm">{settlement.settlementNumber}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(settlement.periodStart).toLocaleDateString('es-AR')} - {new Date(settlement.periodEnd).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ${settlement.netAmount.toLocaleString('es-AR')}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                          settlement.status === 'paid' ? 'bg-green-100 text-green-800' :
                          settlement.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {settlement.status === 'paid' ? 'Pagada' :
                           settlement.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {settlements.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <i className="ri-receipt-line text-2xl mb-2"></i>
                      <p className="text-sm">No hay liquidaciones generadas aún</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de hojas de ruta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  <i className="ri-file-list-3-line mr-2 text-blue-600"></i>
                  Estado de Hojas de Ruta
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pendientes:</span>
                    <span className="font-semibold">{routeSheets.filter(rs => rs.status === 'pendiente').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asignadas:</span>
                    <span className="font-semibold">{routeSheets.filter(rs => rs.status === 'asignada').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En Curso:</span>
                    <span className="font-semibold">{routeSheets.filter(rs => rs.status === 'en-curso').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completadas:</span>
                    <span className="font-semibold">{routeSheets.filter(rs => rs.status === 'completada').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  <i className="ri-money-dollar-circle-line mr-2 text-green-600"></i>
                  Resumen de Ingresos
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Ingresos Totales:</span>
                    <span className="font-semibold">${salesData.totalRevenue.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisión Total:</span>
                    <span className="font-semibold text-green-600">${salesData.commission.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Órdenes del Mes:</span>
                    <span className="font-semibold">{salesData.monthlyOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos del Mes:</span>
                    <span className="font-semibold">${salesData.monthlyRevenue.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Órdenes */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Órdenes de Envío</h2>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="all">Todas las órdenes</option>
                  <option value="pendiente-recoleccion">Pendientes de Recolección</option>
                  <option value="en-transito">En Tránsito</option>
                  <option value="en-agencia-destino">En Agencia</option>
                  <option value="entregado">Entregadas</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-inbox-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-lg">No hay órdenes para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2">Código</th>
                      <th className="text-left py-3 px-2">Remitente</th>
                      <th className="text-left py-3 px-2">Destinatario</th>
                      <th className="text-left py-3 px-2">Peso</th>
                      <th className="text-left py-3 px-2">Estado</th>
                      <th className="text-left py-3 px-2">Valor</th>
                      <th className="text-center py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-2 font-mono text-sm">{order.trackingCode}</td>
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-semibold">{order.sender.name}</div>
                            <div className="text-sm text-gray-500">{order.sender.phone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-semibold">{order.recipient.name}</div>
                            <div className="text-sm text-gray-500">{order.recipient.phone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2">{order.package.weight}kg</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="py-4 px-2">${order.costs.total.toLocaleString('es-AR')}</td>
                        <td className="py-4 px-2 text-center">
                          <div className="flex space-x-2 justify-center">
                            {order.status === 'pendiente-recoleccion' && (
                              <button
                                onClick={() => handleStatusUpdate(order.trackingCode, 'en-transito')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Marcar como recogido"
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <i className="ri-truck-line"></i>
                                </div>
                              </button>
                            )}

                            {order.status === 'en-transito' && (
                              <button
                                onClick={() => handleStatusUpdate(order.trackingCode, 'en-agencia-destino')}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Marcar como en agencia"
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <i className="ri-building-line"></i>
                                </div>
                              </button>
                            )}

                            {order.status === 'en-agencia-destino' && (
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
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Entregar al cliente"
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <i className="ri-user-received-line"></i>
                                </div>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Hojas de Ruta */}
        {activeTab === 'route-sheets' && currentUser && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Hojas de Ruta</h2>
                <button
                  onClick={handleGenerateRouteSheets}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Generar Hojas de Ruta
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Hojas de Ruta Generadas</h3>

              {routeSheets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-route-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-lg">No hay hojas de ruta generadas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2">Código</th>
                        <th className="text-left py-3 px-2">Destino</th>
                        <th className="text-left py-3 px-2">Transportista</th>
                        <th className="text-left py-3 px-2">Envíos</th>
                        <th className="text-left py-3 px-2">Estado</th>
                        <th className="text-center py-3 px-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeSheets.map((sheet) => {
                        const transportist = transportists.find(t => t.id === sheet.transportistId);
                        return (
                          <tr key={sheet.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-2 font-mono text-sm">{sheet.code}</td>
                            <td className="py-4 px-2">
                              <div>
                                <div className="font-semibold">{sheet.city}</div>
                                <div className="text-sm text-gray-500">{sheet.province}</div>
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              {sheet.transportistId ? (
                                <div>
                                  <div className="font-semibold">{transportist?.name}</div>
                                  <div className="text-sm text-gray-500">{transportist?.vehicle} - {transportist?.plate}</div>
                                </div>
                              ) : (
                                <select
                                  onChange={(e) => handleAssignTransportist(sheet.id, e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm pr-8"
                                  defaultValue=""
                                >
                                  <option value="">Asignar transportista...</option>
                                  {transportists.filter(t => t.type === 'local').map(transportist => (
                                    <option key={transportist.id} value={transportist.id}>
                                      {transportist.name} - {transportist.vehicle}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-4 px-2">{sheet.orderIds.length} órdenes</td>
                            <td className="py-4 px-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sheet.status)}`}>
                                {getStatusText(sheet.status)}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <button
                                onClick={() => {
                                  setSelectedRouteSheet(sheet);
                                  setShowRouteSheetModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Ver detalle"
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <i className="ri-eye-line"></i>
                                </div>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rutas por Recibir */}
        {activeTab === 'incoming-routes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Rutas por Recibir</h2>

            {/* Mostrar hojas de ruta en tránsito hacia esta agencia */}
            <div className="space-y-4">
              {routeSheets.filter(rs => rs.status === 'en-curso').map((sheet) => {
                const transportist = transportists.find(t => t.id === sheet.transportistId);
                const sheetOrders = orders.filter(order => sheet.orderIds.includes(order.id));

                return (
                  <div key={sheet.id} className="border rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{sheet.code}</h3>
                        <p className="text-gray-600">Destino: {sheet.city}, {sheet.province}</p>
                        <p className="text-sm text-gray-500">
                          Transportista: {transportist?.name} - {transportist?.vehicle}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sheet.status)}`}>
                        {getStatusText(sheet.status)}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Órdenes en Tránsito ({sheetOrders.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sheetOrders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="text-sm">
                              <div className="font-mono text-xs text-gray-500">{order.trackingCode}</div>
                              <div className="font-semibold">{order.sender.name}</div>
                              <div className="text-gray-600">→ {order.recipient.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.package.quantity} bultos - {order.package.weight}kg
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedRouteSheet(sheet);
                          setShowRouteSheetModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Ver Detalle Completo
                      </button>
                    </div>
                  </div>
                );
              })}

              {routeSheets.filter(rs => rs.status === 'en-curso').length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-truck-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-lg">No hay rutas en tránsito</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entregas */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Entregas a Clientes</h2>

            <div className="space-y-4">
              {orders.filter(o => o.status === 'en-agencia-destino').map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{order.trackingCode}</h3>
                          <div className="mt-2 space-y-1">
                            <div><strong>Destinatario:</strong> {order.recipient.name}</div>
                            <div><strong>DNI:</strong> {order.recipient.dni}</div>
                            <div><strong>Teléfono:</strong> {order.recipient.phone}</div>
                            <div><strong>Dirección:</strong> {order.recipient.address}</div>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-1">
                            <div><strong>Remitente:</strong> {order.sender.name}</div>
                            <div><strong>Peso:</strong> {order.package.weight}kg</div>
                            <div><strong>Bultos:</strong> {order.package.quantity}</div>
                            <div><strong>Descripción:</strong> {order.package.description}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
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
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-user-received-line mr-2"></i>
                        Entregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {orders.filter(o => o.status === 'en-agencia-destino').length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-user-received-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-lg">No hay órdenes pendientes de entrega</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ventas y Comisiones */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Configuración de comisiones de la agencia */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                <i className="ri-settings-line mr-2 text-blue-600"></i>
                Configuración de Comisiones
              </h3>
              {agencyData.commissions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{agencyData.commissions.encomiendaCobrOrigen}%</div>
                    <div className="text-sm text-gray-600 mt-1">Encomienda Cobrada en Origen</div>
                    <div className="text-xs text-gray-500 mt-1">% sobre flete únicamente</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{agencyData.commissions.encomiendaPagoDestino}%</div>
                    <div className="text-sm text-gray-600 mt-1">Encomienda Pago en Destino</div>
                    <div className="text-xs text-gray-500 mt-1">% sobre flete únicamente</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">${agencyData.commissions.ecommRecibido}</div>
                    <div className="text-sm text-gray-600 mt-1">Ecommerce Recibidos</div>
                    <div className="text-xs text-gray-500 mt-1">Comisión fija por paquete</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">${agencyData.commissions.ecommEntregado}</div>
                    <div className="text-sm text-gray-600 mt-1">Ecommerce Entregados</div>
                    <div className="text-xs text-gray-500 mt-1">Comisión fija por paquete</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{agencyData.commissions.termosellado}%</div>
                    <div className="text-sm text-gray-600 mt-1">Termosellado en Origen</div>
                    <div className="text-xs text-gray-500 mt-1">% sobre valor termosellado</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Las comisiones no están configuradas para esta agencia.</p>
                  <p className="text-sm text-gray-500 mt-2">Contacta al administrador para configurar las comisiones.</p>
                </div>
              )}
            </div>

            {/* Métricas de ventas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">${salesData.totalRevenue.toLocaleString('es-AR')}</div>
                <div className="text-gray-600">Ingresos Totales</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-award-line text-2xl text-blue-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">${salesData.commission.toLocaleString('es-AR')}</div>
                <div className="text-gray-600">Comisión Total</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-line text-2xl text-purple-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{salesData.monthlyOrders}</div>
                <div className="text-gray-600">Órdenes del Mes</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-money-dollar-box-line text-2xl text-orange-600"></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">${salesData.monthlyRevenue.toLocaleString('es-AR')}</div>
                <div className="text-gray-600">Ingresos del Mes</div>
              </div>
            </div>

            {/* Detalle de órdenes por estado con comisiones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle de Ventas y Comisiones por Tipo</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2">Tipo de Envío</th>
                      <th className="text-left py-3 px-2">Cantidad</th>
                      <th className="text-left py-3 px-2">Base de Cálculo</th>
                      <th className="text-left py-3 px-2">Comisión</th>
                      <th className="text-left py-3 px-2">Total Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[ 
                      { 
                        type: 'encomienda-origen', 
                        label: 'Encomiendas Cobradas en Origen', 
                        color: 'text-green-600',
                        filter: (o: Order) => o.package.serviceType !== 'Ecommerce' && o.package.serviceType !== 'Pago en Destino',
                        isPercentage: true,
                        commissionRate: agencyData.commissions?.encomiendaCobrOrigen || 5.0
                      },
                      { 
                        type: 'encomienda-destino', 
                        label: 'Encomiendas Pago en Destino', 
                        color: 'text-blue-600',
                        filter: (o: Order) => o.package.serviceType === 'Pago en Destino',
                        isPercentage: true,
                        commissionRate: agencyData.commissions?.encomiendaPagoDestino || 3.0
                      },
                      { 
                        type: 'ecommerce-recibido', 
                        label: 'Ecommerce Recibidos', 
                        color: 'text-purple-600',
                        filter: (o: Order) => o.package.serviceType === 'Ecommerce',
                        isPercentage: false,
                        commissionRate: agencyData.commissions?.ecommRecibido || 100
                      },
                      { 
                        type: 'ecommerce-entregado', 
                        label: 'Ecommerce Entregados', 
                        color: 'text-orange-600',
                        filter: (o: Order) => o.package.serviceType === 'Ecommerce' && o.status === 'entregado',
                        isPercentage: false,
                        commissionRate: agencyData.commissions?.ecommEntregado || 150
                      },
                      { 
                        type: 'termosellado', 
                        label: 'Termosellados en Origen', 
                        color: 'text-yellow-600',
                        filter: (o: Order) => o.costs.thermoseal > 0,
                        isPercentage: true,
                        commissionRate: agencyData.commissions?.termosellado || 1.5
                      }
                    ].map((item) => {
                      const typeOrders = orders.filter(item.filter);
                      
                      let baseCalculation = 0;
                      let totalCommission = 0;
                      
                      if (item.type === 'ecommerce-recibido' || item.type === 'ecommerce-entregado') {
                        // Para ecommerce: comisión fija por paquete
                        baseCalculation = typeOrders.length;
                        totalCommission = typeOrders.length * item.commissionRate;
                      } else if (item.type === 'termosellado') {
                        // Para termosellado: porcentaje sobre el valor del termosellado
                        baseCalculation = typeOrders.reduce((sum, order) => sum + order.costs.thermoseal, 0);
                        totalCommission = (baseCalculation * item.commissionRate) / 100;
                      } else {
                        // Para encomiendas: porcentaje SOLO sobre el flete
                        baseCalculation = typeOrders.reduce((sum, order) => sum + order.costs.freight, 0);
                        totalCommission = (baseCalculation * item.commissionRate) / 100;
                      }

                      return (
                        <tr key={item.type} className="border-b border-gray-100">
                          <td className="py-4 px-2">
                            <span className={`font-semibold ${item.color}`}>{item.label}</span>
                          </td>
                          <td className="py-4 px-2">{typeOrders.length}</td>
                          <td className="py-4 px-2">
                            {item.type === 'ecommerce-recibido' || item.type === 'ecommerce-entregado' ? 
                              `${typeOrders.length} paquetes` : 
                              `$${baseCalculation.toLocaleString('es-AR')} ${item.type === 'termosellado' ? '(termosellado)' : '(flete)'}` 
                            }
                          </td>
                          <td className="py-4 px-2">
                            {item.isPercentage ? `${item.commissionRate}%` : `$${item.commissionRate} fijo` }
                          </td>
                          <td className="py-4 px-2 font-semibold">${totalCommission.toLocaleString('es-AR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center mr-2">
                    <i className="ri-information-line text-yellow-600"></i>
                  </div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-2">Información sobre cálculo de comisiones:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Encomiendas:</strong> Se calculan como porcentaje ÚNICAMENTE sobre el valor del flete (no incluye seguros, gastos admin, ni IVA)</li>
                      <li><strong>Ecommerce:</strong> Son comisiones fijas por paquete, no porcentuales. Se cobra una suma fija por recibir + suma fija por entregar</li>
                      <li><strong>Termosellado:</strong> Se calcula como porcentaje sobre el valor del termosellado únicamente</li>
                      <li><strong>Importante:</strong> Las comisiones de encomiendas NO se calculan sobre el total del envío, solo sobre el flete base</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquidaciones */}
        {activeTab === 'settlements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Liquidaciones de Ventas</h2>
                <div className="text-sm text-gray-600">
                  Día de liquidación: <span className="font-semibold capitalize">
                    {agencyData.weeklySettlementDay === 'monday' ? 'Lunes' :
                     agencyData.weeklySettlementDay === 'tuesday' ? 'Martes' :
                     agencyData.weeklySettlementDay === 'wednesday' ? 'Miércoles' :
                     agencyData.weeklySettlementDay === 'thursday' ? 'Jueves' :
                     agencyData.weeklySettlementDay === 'friday' ? 'Viernes' :
                     agencyData.weeklySettlementDay === 'saturday' ? 'Sábado' :
                     'Domingo'}
                  </span>
                </div>
              </div>

              {/* Resumen de liquidaciones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-receipt-line text-2xl text-blue-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-blue-800 text-center">
                    {settlements.length}
                  </div>
                  <div className="text-sm text-blue-600 text-center mt-1">Total Liquidaciones</div>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-time-line text-2xl text-yellow-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800 text-center">
                    {settlements.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-sm text-yellow-600 text-center mt-1">Pendientes</div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-2xl text-green-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-green-800 text-center">
                    {settlements.filter(s => s.status === 'paid').length}
                  </div>
                  <div className="text-sm text-green-600 text-center mt-1">Pagadas</div>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-error-warning-line text-2xl text-red-600"></i>
                  </div>
                  <div className="text-2xl font-bold text-red-800 text-center">
                    {settlements.filter(s => s.status === 'overdue').length}
                  </div>
                  <div className="text-sm text-red-600 text-center mt-1">Vencidas</div>
                </div>
              </div>

              {/* Lista de liquidaciones */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2">Número</th>
                      <th className="text-left py-3 px-2">Período</th>
                      <th className="text-left py-3 px-2">Ventas Totales</th>
                      <th className="text-left py-3 px-2">Comisiones</th>
                      <th className="text-left py-3 px-2">Monto Neto</th>
                      <th className="text-left py-3 px-2">Estado</th>
                      <th className="text-left py-3 px-2">Vencimiento</th>
                      <th className="text-center py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map(settlement => (
                      <tr key={settlement.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-2 font-mono text-sm">{settlement.settlementNumber}</td>
                        <td className="py-4 px-2">
                          <div className="text-sm">
                            <div>{new Date(settlement.periodStart).toLocaleDateString('es-AR')}</div>
                            <div className="text-gray-500">al {new Date(settlement.periodEnd).toLocaleDateString('es-AR')}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2 font-semibold">${settlement.totalSales.toLocaleString('es-AR')}</td>
                        <td className="py-4 px-2 text-blue-600 font-semibold">${settlement.totalCommissions.toLocaleString('es-AR')}</td>
                        <td className="py-4 px-2 text-green-600 font-bold text-lg">${settlement.netAmount.toLocaleString('es-AR')}</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${ 
                            settlement.status === 'paid' ? 'bg-green-100 text-green-800' :
                            settlement.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {settlement.status === 'paid' ? 'Pagada' :
                             settlement.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm">
                            {new Date(settlement.dueDate).toLocaleDateString('es-AR')}
                            {new Date(settlement.dueDate) < new Date() && settlement.status !== 'paid' && (
                              <div className="text-red-600 text-xs font-semibold">¡Vencida!</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <div className="flex space-x-2 justify-center">
                            <button
                              onClick={() => {
                                const orders = getOrders().filter(o => settlement.orderIds.includes(o.id));
                                const orderDetails = orders.map(o => `${o.trackingCode} - ${o.sender.name} → ${o.recipient.name}: $${o.costs.total}`).join('\n');
                                
                                alert(`Detalle de liquidación ${settlement.settlementNumber}\n\nPeríodo: ${new Date(settlement.periodStart).toLocaleDateString('es-AR')} al ${new Date(settlement.periodEnd).toLocaleDateString('es-AR')}\n\nÓrdenes incluidas (${orders.length}):\n${orderDetails}\n\nVentas totales: $${settlement.totalSales.toLocaleString('es-AR')}\nComisiones: $${settlement.totalCommissions.toLocaleString('es-AR')}\nMonto neto: $${settlement.netAmount.toLocaleString('es-AR')}`);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              title="Ver detalle"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            {settlement.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowSettlementModal(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Subir comprobante"
                              >
                                <i className="ri-upload-line"></i>
                              </button>
                            )}
                            {settlement.paymentProof && (
                              <button
                                onClick={() => {
                                  window.open(settlement.paymentProof!.url, '_blank');
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                                title="Ver comprobante"
                              >
                                <i className="ri-file-line"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* <div className="flex items-center">
                  <button
                    onClick={() => {
                      const settlement = settlements[0];
                      const orders = getOrders().filter(o => settlement.orderIds.includes(o.id));
                      const orderDetails = orders.map(o => `${o.trackingCode} - ${o.sender.name} → ${o.recipient.name}: $${o.costs.total}`).join('\n');
                      alert(`Detalle de liquidación ${settlement.settlementNumber}\n\nPeríodo: ${new Date(settlement.periodStart).toLocaleDateString('es-AR')} al ${new Date(settlement.periodEnd).toLocaleDateString('es-AR')}\n\nÓrdenes incluidas (${orders.length}):\n${orderDetails}\n\nVentas totales: $${settlement.totalSales.toLocaleString('es-AR')}\nComisiones: $${settlement.totalCommissions.toLocaleString('es-AR')}\nMonto neto: $${settlement.netAmount.toLocaleString('es-AR')}`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-eye-line"></i>
                  </button>
                </div> */}
                {settlements.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-receipt-line text-3xl text-gray-400"></i>
                    </div>
                    <p className="text-gray-500 text-lg">No hay liquidaciones generadas aún</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Las liquidaciones se generan automáticamente cada {
                        agencyData.weeklySettlementDay === 'monday' ? 'lunes' :
                        agencyData.weeklySettlementDay === 'tuesday' ? 'martes' :
                        agencyData.weeklySettlementDay === 'wednesday' ? 'miércoles' :
                        agencyData.weeklySettlementDay === 'thursday' ? 'jueves' :
                        agencyData.weeklySettlementDay === 'friday' ? 'viernes' :
                        agencyData.weeklySettlementDay === 'saturday' ? 'sábado' :
                        'domingo'
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center mr-2">
                    <i className="ri-information-line text-blue-600"></i>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">Información sobre liquidaciones automáticas:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Las liquidaciones se generan automáticamente cada semana el día configurado</li>
                      <li>Incluyen todas las ventas de la semana anterior con sus respectivas comisiones</li>
                      <li>Una vez generada la liquidación, tienes 7 días para realizar el pago</li>
                      <li>Debes subir el comprobante de pago para confirmar la liquidación</li>
                      <li>El sistema actualiza automáticamente tu límite de crédito disponible una vez confirmado el pago</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para subir comprobante de pago */}
        {showSettlementModal && selectedSettlement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Subir Comprobante de Pago
              </h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-2">
                  <div><strong>Liquidación:</strong> {selectedSettlement.settlementNumber}</div>
                  <div><strong>Período:</strong> {new Date(selectedSettlement.periodStart).toLocaleDateString('es-AR')} al {new Date(selectedSettlement.periodEnd).toLocaleDateString('es-AR')}</div>
                  <div><strong>Monto a pagar:</strong> <span className="text-green-600 font-bold">${selectedSettlement.netAmount.toLocaleString('es-AR')}</span></div>
                  <div><strong>Vencimiento:</strong> {new Date(selectedSettlement.dueDate).toLocaleDateString('es-AR')}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobante de Pago
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceptados: PDF, JPG, PNG (máx. 5MB)
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center mr-2">
                    <i className="ri-information-line text-yellow-600"></i>
                  </div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Información importante:</p>
                    <p className="text-xs mt-1">
                      Asegúrate de que el comprobante sea legible y contenga toda la información necesaria. 
                      Una vez subido y confirmado, se actualizará automáticamente tu límite de crédito disponible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowSettlementModal(false);
                    setSelectedSettlement(null);
                    setPaymentProofFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleUploadPaymentProof(selectedSettlement.id)}
                  disabled={!paymentProofFile || uploadingProof}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${ 
                    !paymentProofFile || uploadingProof
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {uploadingProof ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <i className="ri-upload-line mr-2"></i>
                      Subir Comprobante
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Hoja de Ruta */}
        {showRouteSheetModal && selectedRouteSheet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-90vh overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Detalle de Hoja de Ruta - {selectedRouteSheet.code}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Información General</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>Código:</strong> {selectedRouteSheet.code}</div>
                    <div><strong>Destino:</strong> {selectedRouteSheet.city}, {selectedRouteSheet.province}</div>
                    <div><strong>Estado:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedRouteSheet.status)}`}>
                        {getStatusText(selectedRouteSheet.status)}
                      </span>
                    </div>
                    <div><strong>Creada:</strong> {new Date(selectedRouteSheet.createdAt).toLocaleString('es-AR')}</div>
                    <div><strong>Total Envíos:</strong> {selectedRouteSheet.orderIds.length}</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Transportista</h4>
                  <div className="text-sm space-y-2">
                    {selectedRouteSheet.transportistId && (() => {
                      const transportist = transportists.find(t => t.id === selectedRouteSheet.transportistId);
                      return transportist ? (
                        <>
                          <div><strong>Nombre:</strong> {transportist.name}</div>
                          <div><strong>Vehículo:</strong> {transportist.vehicle}</div>
                          <div><strong>Placa:</strong> {transportist.plate}</div>
                          <div><strong>Teléfono:</strong> {transportist.phone}</div>
                        </>
                      ) : <div>Transportista no encontrado</div>;
                    })()}
                    {!selectedRouteSheet.transportistId && <div>Sin transportista asignado</div>}
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
                      {orders.filter(order => selectedRouteSheet.orderIds.includes(order.id)).map(order => (
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
                  onClick={() => setShowRouteSheetModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const transportist = transportists.find(t => t.id === selectedRouteSheet.transportistId);
                    const sheetOrders = orders.filter(order => selectedRouteSheet.orderIds.includes(order.id));

                    const printContent = `
                      <html>
                        <head><title>Hoja de Ruta ${selectedRouteSheet.code}</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                          <h1>HOJA DE RUTA - ${selectedRouteSheet.code}</h1>
                          <div style="margin-bottom: 20px;">
                            <h2>Destino: ${selectedRouteSheet.city}, ${selectedRouteSheet.province}</h2>
                            <p><strong>Transportista:</strong> ${transportist?.name || 'No asignado'}</p>
                            <p><strong>Vehículo:</strong> ${transportist?.vehicle || 'N/A'} - ${transportist?.plate || 'N/A'}</p>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-printer-line mr-2"></i>
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Entrega */}
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
