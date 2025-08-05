'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  getAgencies, saveAgencies, Agency, getArgentineLocalities
} from '../../lib/storage';

export default function AdminBasico() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [agencyForm, setAgencyForm] = useState<Partial<Agency>>({
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 100,
      ecommEntregado: 150,
      termosellado: 1.5
    },
    creditLimit: 50000,
    currentCredit: 0,
    weeklySettlementDay: 'friday',
    isActive: true
  });
  const [localitiesData, setLocalitiesData] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
    loadLocalitiesData();
  }, []);

  const loadData = () => {
    setAgencies(getAgencies());
  };

  const loadLocalitiesData = () => {
    const stored = localStorage.getItem('puntoenvio-custom-localities');
    if (stored) {
      setLocalitiesData(JSON.parse(stored));
    } else {
      const defaultLocalities = getArgentineLocalities();
      setLocalitiesData(defaultLocalities);
      localStorage.setItem('puntoenvio-custom-localities', JSON.stringify(defaultLocalities));
    }
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgency) {
      const updatedAgencies = agencies.map(a => 
        a.id === editingAgency.id ? { ...a, ...agencyForm } as Agency : a
      );
      setAgencies(updatedAgencies);
      saveAgencies(updatedAgencies);
    } else {
      const agencyNumber = agencies.length + 1;
      const generatedUsername = `pe${agencyNumber.toString().padStart(3, '0')}`;
      const generatedPassword = `${(agencyForm.name || '').toLowerCase().replace(/ /g, '')}123`;
      
      const newAgency: Agency = {
        id: Date.now().toString(),
        code: `PE${agencyNumber.toString().padStart(3, '0')}`,
        name: agencyForm.name || '',
        address: agencyForm.address || '',
        phone: agencyForm.phone || '',
        email: agencyForm.email || '',
        schedule: agencyForm.schedule || '8:00 - 18:00',
        city: agencyForm.city || '',
        province: agencyForm.province || '',
        manager: agencyForm.manager || '',
        zone: agencyForm.zone || 'Centro',
        username: agencyForm.username || generatedUsername,
        password: agencyForm.password || generatedPassword,
        commissions: agencyForm.commissions || {
          encomiendaCobrOrigen: 5.0,
          encomiendaPagoDestino: 3.0,
          ecommRecibido: 100,
          ecommEntregado: 150,
          termosellado: 1.5
        },
        creditLimit: agencyForm.creditLimit || 50000,
        currentCredit: agencyForm.currentCredit || 0,
        weeklySettlementDay: agencyForm.weeklySettlementDay || 'friday',
        isActive: agencyForm.isActive !== undefined ? agencyForm.isActive : true
      };
      const updatedAgencies = [...agencies, newAgency];
      setAgencies(updatedAgencies);
      saveAgencies(updatedAgencies);
    }
    setShowAgencyModal(false);
    setEditingAgency(null);
    setAgencyForm({
      commissions: {
        encomiendaCobrOrigen: 5.0,
        encomiendaPagoDestino: 3.0,
        ecommRecibido: 100,
        ecommEntregado: 150,
        termosellado: 1.5
      },
      creditLimit: 50000,
      currentCredit: 0,
      weeklySettlementDay: 'friday',
      isActive: true
    });
  };

  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    setAgencyForm(agency);
    setShowAgencyModal(true);
  };

  const handleDeleteAgency = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta agencia?')) {
      const updatedAgencies = agencies.filter(a => a.id !== id);
      setAgencies(updatedAgencies);
      saveAgencies(updatedAgencies);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Administración Básico</h1>
          <p className="text-gray-600">Gestión simplificada de agencias del sistema PuntoEnvío</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-building-line text-2xl text-blue-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">{agencies.length}</div>
            <div className="text-gray-600">Agencias Activas</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-2xl text-green-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {agencies.filter(a => a.isActive !== false).length}
            </div>
            <div className="text-gray-600">En Funcionamiento</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-pause-line text-2xl text-yellow-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {agencies.filter(a => a.isActive === false).length}
            </div>
            <div className="text-gray-600">Inactivas</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-map-pin-line text-2xl text-purple-600"></i>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {Object.keys(localitiesData).length}
            </div>
            <div className="text-gray-600">Provincias</div>
          </div>
        </div>

        {/* Agencies Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Gestión de Agencias</h2>
            <button
              onClick={() => {
                setEditingAgency(null);
                setAgencyForm({
                  commissions: {
                    encomiendaCobrOrigen: 5.0,
                    encomiendaPagoDestino: 3.0,
                    ecommRecibido: 100,
                    ecommEntregado: 150,
                    termosellado: 1.5
                  },
                  creditLimit: 50000,
                  currentCredit: 0,
                  weeklySettlementDay: 'friday',
                  isActive: true
                });
                setShowAgencyModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Nueva Agencia
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Código</th>
                  <th className="text-left py-3 px-2">Nombre</th>
                  <th className="text-left py-3 px-2">Ciudad</th>
                  <th className="text-left py-3 px-2">Responsable</th>
                  <th className="text-left py-3 px-2">Estado</th>
                  <th className="text-left py-3 px-2">Usuario</th>
                  <th className="text-center py-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((agency) => (
                  <tr key={agency.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-2 font-mono text-sm">{agency.code}</td>
                    <td className="py-4 px-2 font-semibold">{agency.name}</td>
                    <td className="py-4 px-2">{agency.city}, {agency.province}</td>
                    <td className="py-4 px-2">{agency.manager}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agency.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agency.isActive !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                        {agency.username || 'No asignado'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEditAgency(agency)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                          title="Editar agencia"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteAgency(agency.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                          title="Eliminar agencia"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {agencies.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-building-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay agencias registradas</h3>
                <p className="text-gray-500 mb-4">Comienza agregando tu primera agencia al sistema</p>
                <button
                  onClick={() => setShowAgencyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Crear Primera Agencia
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              href="/super-admin"
              className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-admin-line text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Panel Central</h3>
                <p className="text-sm text-gray-600">Administración completa del sistema</p>
              </div>
            </a>
            
            <a 
              href="/tarifas"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-price-tag-line text-2xl text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Tarifas</h3>
                <p className="text-sm text-gray-600">Gestión de precios y tarifas</p>
              </div>
            </a>
            
            <a 
              href="/rutas"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-route-line text-2xl text-blue-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Rutas</h3>
                <p className="text-sm text-gray-600">Configuración de rutas de envío</p>
              </div>
            </a>
          </div>
        </div>

        {/* Modal de Agencia */}
        {showAgencyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0 p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingAgency ? 'Editar Agencia' : 'Nueva Agencia'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSaveAgency} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                      <input
                        type="text"
                        value={agencyForm.name || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
                      <input
                        type="text"
                        value={agencyForm.manager || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, manager: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                      <input
                        type="text"
                        value={agencyForm.address || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                      <select
                        value={agencyForm.province || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, province: e.target.value })}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Seleccionar provincia...</option>
                        {Object.keys(localitiesData).map(province => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                      <select
                        value={agencyForm.city || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, city: e.target.value })}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!agencyForm.province}
                        required
                      >
                        <option value="">Seleccionar ciudad...</option>
                        {agencyForm.province && localitiesData[agencyForm.province] && localitiesData[agencyForm.province].map(locality => (
                          <option key={locality} value={locality}>
                            {locality}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                      <input
                        type="tel"
                        value={agencyForm.phone || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={agencyForm.email || ''}
                        onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-information-line text-blue-600"></i>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold">Información:</p>
                        <p className="text-xs mt-1">
                          Configura las comisiones que se pagarán a esta agencia por cada tipo de servicio.
                          Los valores por defecto se pueden ajustar según el acuerdo comercial.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección de configuración de comisiones */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                        <i className="ri-money-dollar-circle-line text-sm text-yellow-600"></i>
                      </div>
                      Configuración de Comisiones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encomienda Cobrada en Origen (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={agencyForm.commissions?.encomiendaCobrOrigen || 5.0}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              commissions: {
                                ...agencyForm.commissions,
                                encomiendaCobrOrigen: parseFloat(e.target.value) || 0,
                                encomiendaPagoDestino: agencyForm.commissions?.encomiendaPagoDestino || 3.0,
                                ecommRecibido: agencyForm.commissions?.ecommRecibido || 100,
                                ecommEntregado: agencyForm.commissions?.ecommEntregado || 150,
                                termosellado: agencyForm.commissions?.termosellado || 1.5
                              }
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="5.0"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Comisión cuando el envío se paga en origen</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encomienda Pago en Destino (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={agencyForm.commissions?.encomiendaPagoDestino || 3.0}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              commissions: {
                                ...agencyForm.commissions,
                                encomiendaCobrOrigen: agencyForm.commissions?.encomiendaCobrOrigen || 5.0,
                                encomiendaPagoDestino: parseFloat(e.target.value) || 0,
                                ecommRecibido: agencyForm.commissions?.ecommRecibido || 100,
                                ecommEntregado: agencyForm.commissions?.ecommEntregado || 150,
                                termosellado: agencyForm.commissions?.termosellado || 1.5
                              }
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="3.0"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Comisión cuando se cobra contra entrega</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Termosellado en Origen (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={agencyForm.commissions?.termosellado || 1.5}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              commissions: {
                                ...agencyForm.commissions,
                                encomiendaCobrOrigen: agencyForm.commissions?.encomiendaCobrOrigen || 5.0,
                                encomiendaPagoDestino: agencyForm.commissions?.encomiendaPagoDestino || 3.0,
                                ecommRecibido: agencyForm.commissions?.ecommRecibido || 100,
                                ecommEntregado: agencyForm.commissions?.ecommEntregado || 150,
                                termosellado: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="1.5"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Comisión por termosellado cobrado en origen</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paquete Ecommerce Recibido ($)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={agencyForm.commissions?.ecommRecibido || 100}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              commissions: {
                                ...agencyForm.commissions,
                                encomiendaCobrOrigen: agencyForm.commissions?.encomiendaCobrOrigen || 5.0,
                                encomiendaPagoDestino: agencyForm.commissions?.encomiendaPagoDestino || 3.0,
                                ecommRecibido: parseFloat(e.target.value) || 0,
                                ecommEntregado: agencyForm.commissions?.ecommEntregado || 150,
                                termosellado: agencyForm.commissions?.termosellado || 1.5
                              }
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="100"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">$</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Comisión fija en pesos por cada paquete de ecommerce que recibe la agencia</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paquete Ecommerce Entregado ($)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={agencyForm.commissions?.ecommEntregado || 150}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              commissions: {
                                ...agencyForm.commissions,
                                encomiendaCobrOrigen: agencyForm.commissions?.encomiendaCobrOrigen || 5.0,
                                encomiendaPagoDestino: agencyForm.commissions?.encomiendaPagoDestino || 3.0,
                                ecommRecibido: agencyForm.commissions?.ecommRecibido || 100,
                                ecommEntregado: parseFloat(e.target.value) || 0,
                                termosellado: agencyForm.commissions?.termosellado || 1.5
                              }
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="150"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">$</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Comisión fija adicional por entregar paquete de ecommerce</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-information-line text-yellow-600"></i>
                        </div>
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-2">Información sobre comisiones:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li><strong>Encomienda Cobrada en Origen:</strong> Se aplica como porcentaje ÚNICAMENTE sobre el flete (no sobre el total)</li>
                            <li><strong>Encomienda Pago en Destino:</strong> Se aplica como porcentaje ÚNICAMENTE sobre el flete (no sobre el total)</li>
                            <li><strong>Ecommerce Recibido:</strong> Comisión FIJA en pesos por cada paquete de ecommerce que recibe la agencia</li>
                            <li><strong>Ecommerce Entregado:</strong> Comisión FIJA adicional en pesos por cada paquete entregado al cliente final</li>
                            <li><strong>Termosellado en Origen:</strong> Porcentaje sobre el valor del termosellado únicamente</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de configuración adicional */}
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <i className="ri-settings-line text-sm text-green-600"></i>
                      </div>
                      Configuración Adicional
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Límite de Crédito ($)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={agencyForm.creditLimit || 50000}
                            onChange={(e) => setAgencyForm({
                              ...agencyForm,
                              creditLimit: parseFloat(e.target.value) || 0
                            })}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="50000"
                          />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">$</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Límite máximo de crédito para la agencia</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Día de Cierre Semanal
                        </label>
                        <select
                          value={agencyForm.weeklySettlementDay || 'friday'}
                          onChange={(e) => setAgencyForm({
                            ...agencyForm,
                            weeklySettlementDay: e.target.value as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
                          })}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="monday">Lunes</option>
                          <option value="tuesday">Martes</option>
                          <option value="wednesday">Miércoles</option>
                          <option value="thursday">Jueves</option>
                          <option value="friday">Viernes</option>
                          <option value="saturday">Sábado</option>
                          <option value="sunday">Domingo</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Día de la semana para generar liquidaciones automáticas</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado de la Agencia
                        </label>
                        <select
                          value={agencyForm.isActive !== undefined ? (agencyForm.isActive ? 'active' : 'inactive') : 'active'}
                          onChange={(e) => setAgencyForm({
                            ...agencyForm,
                            isActive: e.target.value === 'active'
                          })}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="active">Activa</option>
                          <option value="inactive">Inactiva</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Las agencias inactivas no pueden recibir nuevas órdenes</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-information-line text-green-600"></i>
                        </div>
                        <div className="text-sm text-green-800">
                          <p className="font-semibold mb-1">Configuración automática:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Se generarán credenciales de acceso automáticamente</li>
                            <li>Usuario: pe + número secuencial (pe001, pe002, etc.)</li>
                            <li>Las liquidaciones se generarán automáticamente cada semana en el día configurado</li>
                            <li>El límite de crédito controlará automáticamente las nuevas órdenes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAgencyModal(false);
                      setEditingAgency(null);
                      setAgencyForm({
                        commissions: {
                          encomiendaCobrOrigen: 5.0,
                          encomiendaPagoDestino: 3.0,
                          ecommRecibido: 100,
                          ecommEntregado: 150,
                          termosellado: 1.5
                        },
                        creditLimit: 50000,
                        currentCredit: 0,
                        weeklySettlementDay: 'friday',
                        isActive: true
                      });
                    }}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleSaveAgency}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {editingAgency ? 'Actualizar' : 'Crear'} Agencia
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}