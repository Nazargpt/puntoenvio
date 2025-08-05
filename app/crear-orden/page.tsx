
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { saveOrder, generateTrackingCode, calculateShippingCost, getArgentineLocalities } from '../../lib/storage';

const argentineProvinces = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Ciudad Autónoma de Buenos Aires'
];

const serviceTypes = [
  'Domicilio a Domicilio',
  'Domicilio a Agencia',
  'Agencia a Domicilio', 
  'Agencia a Agencia'
];

const paymentTypes = [
  { value: 'origen', label: 'Pago en Origen', description: 'Se cobra antes del envío' },
  { value: 'destino', label: 'Pago en Destino', description: 'Se cobra al momento de la entrega' }
];

const weightRanges = [
  { label: '0 - 5kg', value: 5 },
  { label: '5kg - 10kg', value: 10 },
  { label: '10kg - 15kg', value: 15 },
  { label: '15kg - 20kg', value: 20 },
  { label: '20kg - 25kg', value: 25 }
];

function CrearOrdenContent() {
  const searchParams = useSearchParams();
  const [localities, setLocalities] = useState<Record<string, string[]>>({});
  const [senderCities, setSenderCities] = useState<string[]>([]);
  const [recipientCities, setRecipientCities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    sender: {
      name: '',
      dni: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postalCode: ''
    },
    recipient: {
      name: '',
      dni: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postalCode: ''
    },
    package: {
      weight: '',
      quantity: '',
      declaredValue: '',
      serviceType: ''
    },
    paymentType: '',
    thermoseal: ''
  });

  const [costs, setCosts] = useState({
    freight: 0,
    insurance: 0,
    adminFees: 0,
    iva: 0,
    thermoseal: 0,
    total: 0
  });

  const [orderCreated, setOrderCreated] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Cargar localidades al montar el componente
  useEffect(() => {
    const argentineLocalities = getArgentineLocalities();
    setLocalities(argentineLocalities);
  }, []);

  // Cargar datos del cotizador si vienen en la URL
  useEffect(() => {
    const originProvince = searchParams.get('originProvince');
    const originCity = searchParams.get('originCity');
    const destinationProvince = searchParams.get('destinationProvince');
    const destinationCity = searchParams.get('destinationCity');
    const weight = searchParams.get('weight');
    const declaredValue = searchParams.get('declaredValue');
    const serviceType = searchParams.get('serviceType');
    const thermoseal = searchParams.get('thermoseal');

    if (originProvince || destinationProvince) {
      setFormData(prev => ({
        ...prev,
        sender: {
          ...prev.sender,
          province: originProvince || '',
          city: originCity || ''
        },
        recipient: {
          ...prev.recipient,
          province: destinationProvince || '',
          city: destinationCity || ''
        },
        package: {
          ...prev.package,
          weight: weight || '',
          declaredValue: declaredValue || '',
          serviceType: serviceType || ''
        },
        thermoseal: thermoseal || ''
      }));

      // Actualizar ciudades disponibles si vienen provincias pre-seleccionadas
      if (originProvince && localities[originProvince]) {
        setSenderCities(localities[originProvince]);
      }
      if (destinationProvince && localities[destinationProvince]) {
        setRecipientCities(localities[destinationProvince]);
      }

      // Calcular costos automáticamente si hay datos suficientes
      if (weight && destinationProvince && declaredValue) {
        const calculatedCosts = calculateShippingCost(
          parseFloat(weight),
          destinationProvince,
          parseFloat(declaredValue),
          parseFloat(thermoseal || '0')
        );
        setCosts(calculatedCosts);
      }
    }
  }, [searchParams, localities]);

  // Actualizar ciudades cuando cambia la provincia del remitente
  const handleSenderProvinceChange = (province: string) => {
    handleInputChange('sender', 'province', province);
    
    if (province && localities[province]) {
      setSenderCities(localities[province]);
      // Limpiar ciudad seleccionada si cambia la provincia
      if (formData.sender.city && !localities[province].includes(formData.sender.city)) {
        handleInputChange('sender', 'city', '');
      }
    } else {
      setSenderCities([]);
      handleInputChange('sender', 'city', '');
    }
  };

  // Actualizar ciudades cuando cambia la provincia del destinatario
  const handleRecipientProvinceChange = (province: string) => {
    handleInputChange('recipient', 'province', province);
    
    if (province && localities[province]) {
      setRecipientCities(localities[province]);
      // Limpiar ciudad seleccionada si cambia la provincia
      if (formData.recipient.city && !localities[province].includes(formData.recipient.city)) {
        handleInputChange('recipient', 'city', '');
      }
    } else {
      setRecipientCities([]);
      handleInputChange('recipient', 'city', '');
    }

    // Recalcular costos cuando cambie la provincia de destino
    calculateCosts();
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));

    // Recalcular costos cuando cambien valores relevantes
    if ((section === 'package' && (field === 'weight' || field === 'declaredValue')) || 
        (section === 'recipient' && field === 'province') ||
        field === 'thermoseal') {
      calculateCosts();
    }
  };

  const handlePaymentTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentType: value
    }));
  };

  const calculateCosts = () => {
    const weight = parseFloat(formData.package.weight) || 0;
    const declaredValue = parseFloat(formData.package.declaredValue) || 0;
    const province = formData.recipient.province;
    const thermoseal = parseFloat(formData.thermoseal) || 0;

    if (weight > 0 && province && declaredValue > 0) {
      const calculatedCosts = calculateShippingCost(weight, province, declaredValue, thermoseal);
      setCosts(calculatedCosts);
    }
  };

  const validateForm = () => {
    const newErrors: string[] = []

    // Validar campos obligatorios
    if (!formData.sender.name) newErrors.push('Nombre del remitente es obligatorio');
    if (!formData.sender.dni) newErrors.push('DNI del remitente es obligatorio');
    if (!formData.sender.phone) newErrors.push('Teléfono del remitente es obligatorio');
    if (!formData.sender.city) newErrors.push('Localidad del remitente es obligatoria');
    if (!formData.sender.province) newErrors.push('Provincia del remitente es obligatoria');
    
    if (!formData.recipient.name) newErrors.push('Nombre del destinatario es obligatorio');
    if (!formData.recipient.dni) newErrors.push('DNI del destinatario es obligatorio');
    if (!formData.recipient.phone) newErrors.push('Teléfono del destinatario es obligatorio');
    if (!formData.recipient.city) newErrors.push('Localidad del destinatario es obligatoria');
    if (!formData.recipient.province) newErrors.push('Provincia del destinatario es obligatoria');
    
    if (!formData.package.weight) newErrors.push('Peso es obligatorio');
    if (!formData.package.quantity) newErrors.push('Cantidad de bultos es obligatoria');
    if (!formData.package.declaredValue) newErrors.push('Valor declarado es obligatorio');
    if (!formData.package.serviceType) newErrors.push('Tipo de servicio es obligatorio');
    if (!formData.paymentType) newErrors.push('Tipo de pago es obligatorio');

    // Validar termosellado (máximo 10% del flete)
    const thermoseal = parseFloat(formData.thermoseal) || 0;
    const freight = costs.freight;
    if (thermoseal > freight * 0.1) {
      newErrors.push('El termosellado no puede superar el 10% del flete');
    }

    // Validar DNI argentino (formato básico)
    const dniRegex = /^\d{7,8}$/;
    if (formData.sender.dni && !dniRegex.test(formData.sender.dni)) {
      newErrors.push('DNI del remitente debe tener 7 u 8 dígitos');
    }
    if (formData.recipient.dni && !dniRegex.test(formData.recipient.dni)) {
      newErrors.push('DNI del destinatario debe tener 7 u 8 dígitos');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newTrackingCode = generateTrackingCode();
    const order = {
      id: Date.now().toString(),
      trackingCode: newTrackingCode,
      sender: formData.sender,
      recipient: formData.recipient,
      package: {
        weight: parseFloat(formData.package.weight),
        quantity: parseInt(formData.package.quantity),
        declaredValue: parseFloat(formData.package.declaredValue),
        serviceType: formData.package.serviceType
      },
      paymentType: formData.paymentType,
      costs,
      status: 'pendiente-recoleccion' as const,
      history: [{
        date: new Date().toISOString(),
        status: 'Orden creada',
        location: formData.sender.city + ', ' + formData.sender.province,
        description: 'Orden de envío creada exitosamente'
      }],
      createdAt: new Date().toISOString()
    };

    saveOrder(order);
    setTrackingCode(newTrackingCode);
    setOrderCreated(true);
  };

  if (orderCreated) {
    const paymentTypeLabel = paymentTypes.find(pt => pt.value === formData.paymentType)?.label || 'No especificado';
    
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-line text-3xl text-green-600"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Orden Creada Exitosamente!</h1>
            <p className="text-lg text-gray-600 mb-6">Tu código de seguimiento es:</p>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <span className="text-2xl font-mono font-bold text-green-600">{trackingCode}</span>
            </div>
            <p className="text-gray-600 mb-8">Guardá este código para rastrear tu envío</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 gap-2">
                <p className="text-sm text-gray-600"><strong>Costo total:</strong> ${costs.total.toLocaleString('es-AR')}</p>
                <p className="text-sm text-gray-600"><strong>Tipo de pago:</strong> {paymentTypeLabel}</p>
                {formData.paymentType === 'origen' && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <strong>Importante:</strong> El pago debe realizarse antes del envío
                  </p>
                )}
                {formData.paymentType === 'destino' && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    El pago se realizará contra entrega
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  setOrderCreated(false);
                  setFormData({
                    sender: { name: '', dni: '', phone: '', email: '', address: '', city: '', province: '', postalCode: '' },
                    recipient: { name: '', dni: '', phone: '', email: '', address: '', city: '', province: '', postalCode: '' },
                    package: { weight: '', quantity: '', declaredValue: '', serviceType: '' },
                    paymentType: '',
                    thermoseal: ''
                  });
                  setCosts({ freight: 0, insurance: 0, adminFees: 0, iva: 0, thermoseal: 0, total: 0 });
                  setSenderCities([]);
                  setRecipientCities([]);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Crear Nueva Orden
              </button>
              <a 
                href={`/seguimiento?code=${trackingCode}`}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Seguir mi Envío
              </a>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Emitir Orden de Envío</h1>
            <p className="text-gray-600">Complete los datos para generar su orden de envío</p>
          </div>
          {(searchParams.get('originProvince') || searchParams.get('destinationProvince')) && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <i className="ri-check-line text-green-600"></i>
                </div>
                <span className="text-green-800 text-sm font-medium">Datos del cotizador cargados automáticamente</span>
              </div>
            </div>
          )}
        </div>
        
        {errors.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 flex items-center justify-center mr-2">
                <i className="ri-error-warning-line text-red-600"></i>
              </div>
              <h3 className="text-red-800 font-semibold">Errores en el formulario:</h3>
            </div>
            <ul className="list-disc list-inside text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Remitente */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-user-line text-lg text-green-600"></i>
                </div>
                Datos del Remitente
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.sender.name}
                      onChange={(e) => handleInputChange('sender', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
                    <input
                      type="text"
                      value={formData.sender.dni}
                      onChange={(e) => handleInputChange('sender', 'dni', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="12345678"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      value={formData.sender.phone}
                      onChange={(e) => handleInputChange('sender', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="11-1234-5678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.sender.email}
                      onChange={(e) => handleInputChange('sender', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Completa</label>
                  <input
                    type="text"
                    value={formData.sender.address}
                    onChange={(e) => handleInputChange('sender', 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Av. Corrientes 1234, Piso 5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                    <select
                      value={formData.sender.province}
                      onChange={(e) => handleSenderProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {argentineProvinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localidad *</label>
                    <select
                      value={formData.sender.city}
                      onChange={(e) => handleInputChange('sender', 'city', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                      disabled={!formData.sender.province}
                    >
                      <option value="">
                        {formData.sender.province ? 'Seleccionar localidad...' : 'Primero seleccione provincia'}
                      </option>
                      {senderCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input
                    type="text"
                    value={formData.sender.postalCode}
                    onChange={(e) => handleInputChange('sender', 'postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="C1010AAA"
                  />
                </div>
              </div>
            </div>

            {/* Destinatario */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-map-pin-user-line text-lg text-green-600"></i>
                </div>
                Datos del Destinatario
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.recipient.name}
                      onChange={(e) => handleInputChange('recipient', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
                    <input
                      type="text"
                      value={formData.recipient.dni}
                      onChange={(e) => handleInputChange('recipient', 'dni', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="12345678"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      value={formData.recipient.phone}
                      onChange={(e) => handleInputChange('recipient', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="11-1234-5678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.recipient.email}
                      onChange={(e) => handleInputChange('recipient', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Completa</label>
                  <input
                    type="text"
                    value={formData.recipient.address}
                    onChange={(e) => handleInputChange('recipient', 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Av. Corrientes 1234, Piso 5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                    <select
                      value={formData.recipient.province}
                      onChange={(e) => handleRecipientProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {argentineProvinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localidad *</label>
                    <select
                      value={formData.recipient.city}
                      onChange={(e) => handleInputChange('recipient', 'city', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      required
                      disabled={!formData.recipient.province}
                    >
                      <option value="">
                        {formData.recipient.province ? 'Seleccionar localidad...' : 'Primero seleccione provincia'}
                      </option>
                      {recipientCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input
                    type="text"
                    value={formData.recipient.postalCode}
                    onChange={(e) => handleInputChange('recipient', 'postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="C1010AAA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del Envío */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i className="ri-package-line text-lg text-green-600"></i>
              </div>
              Detalles del Envío
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso *</label>
                <select
                  value={formData.package.weight}
                  onChange={(e) => handleInputChange('package', 'weight', e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="">Seleccionar peso...</option>
                  {weightRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Bultos *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.package.quantity}
                  onChange={(e) => handleInputChange('package', 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Declarado ($) *</label>
                <input
                  type="number"
                  min="100"
                  value={formData.package.declaredValue}
                  onChange={(e) => handleInputChange('package', 'declaredValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio *</label>
                <select
                  value={formData.package.serviceType}
                  onChange={(e) => handleInputChange('package', 'serviceType', e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Termosellado ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.thermoseal}
                  onChange={(e) => handleInputChange('thermoseal', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Máximo 10% del flete"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Pago */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i className="ri-money-dollar-circle-line text-lg text-green-600"></i>
              </div>
              Modalidad de Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentTypes.map(paymentType => (
                <div 
                  key={paymentType.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.paymentType === paymentType.value 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePaymentTypeChange(paymentType.value)}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      formData.paymentType === paymentType.value 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {formData.paymentType === paymentType.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{paymentType.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">{paymentType.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Costos */}
          <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Costos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Flete:</span>
                  <span>${costs.freight.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seguro:</span>
                  <span>${costs.insurance.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos administrativos:</span>
                  <span>${costs.adminFees.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Termosellado:</span>
                  <span>${costs.thermoseal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${costs.iva.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${costs.total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Emitir Orden de Envío
            </button>
          </div>
        </form>
      </div>
      
      <Footer />
    </div>
  );
}

function CrearOrdenLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
          <i className="ri-loader-4-line text-2xl animate-spin text-green-600"></i>
        </div>
        <p>Cargando formulario...</p>
      </div>
    </div>
  );
}

export default function CrearOrden() {
  return (
    <Suspense fallback={<CrearOrdenLoadingFallback />}>
      <CrearOrdenContent />
    </Suspense>
  );
}
