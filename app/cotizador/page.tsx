
'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { calculateShippingCost, getArgentineLocalities } from '../../lib/storage';
import Link from 'next/link';

const argentineProvinces = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'CABA'
];

const weightRanges = [
  { label: '0 - 5kg', value: 5 },
  { label: '5kg - 10kg', value: 10 },
  { label: '10kg - 15kg', value: 15 },
  { label: '15kg - 20kg', value: 20 },
  { label: '20kg - 25kg', value: 25 }
];

const serviceTypes = [
  'Domicilio a Domicilio',
  'Domicilio a Agencia',
  'Agencia a Domicilio', 
  'Agencia a Agencia'
];

export default function Cotizador() {
  const [formData, setFormData] = useState({
    originProvince: '',
    originCity: '',
    destinationProvince: '',
    destinationCity: '',
    weight: '',
    declaredValue: '',
    serviceType: '',
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

  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showFreight, setShowFreight] = useState(false);
  
  // Estados para localidades dinámicas
  const [originLocalities, setOriginLocalities] = useState<string[]>([]);
  const [destinationLocalities, setDestinationLocalities] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Manejar cambio de provincia de origen
    if (field === 'originProvince') {
      const localities = getArgentineLocalities();
      setOriginLocalities(localities[value] || []);
      // Resetear ciudad de origen cuando cambia la provincia
      setFormData(prev => ({
        ...prev,
        originProvince: value,
        originCity: ''
      }));
    }

    // Manejar cambio de provincia de destino
    if (field === 'destinationProvince') {
      const localities = getArgentineLocalities();
      setDestinationLocalities(localities[value] || []);
      // Resetear ciudad de destino cuando cambia la provincia
      setFormData(prev => ({
        ...prev,
        destinationProvince: value,
        destinationCity: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.originProvince) newErrors.push('Provincia de origen es obligatoria');
    if (!formData.originCity) newErrors.push('Localidad de origen es obligatoria');
    if (!formData.destinationProvince) newErrors.push('Provincia de destino es obligatoria');
    if (!formData.destinationCity) newErrors.push('Localidad de destino es obligatoria');
    if (!formData.weight) newErrors.push('Peso es obligatorio');
    if (!formData.declaredValue) newErrors.push('Valor declarado es obligatorio');
    if (!formData.serviceType) newErrors.push('Tipo de servicio es obligatorio');

    // Validar termosellado
    const thermoseal = parseFloat(formData.thermoseal) || 0;
    if (thermoseal > 0 && costs.freight > 0) {
      if (thermoseal > costs.freight * 0.1) {
        newErrors.push('El termosellado no puede superar el 10% del flete');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateBasicCosts = () => {
    const weight = parseFloat(formData.weight) || 0;
    const declaredValue = parseFloat(formData.declaredValue) || 0;
    const province = formData.destinationProvince;

    if (weight > 0 && province && declaredValue > 0) {
      const calculatedCosts = calculateShippingCost(weight, province, declaredValue, 0);
      setCosts(prev => ({
        ...prev,
        freight: calculatedCosts.freight,
        insurance: calculatedCosts.insurance,
        adminFees: calculatedCosts.adminFees,
        iva: 0,
        total: 0
      }));
      return calculatedCosts.freight;
    }
    return 0;
  };

  const calculateFullCosts = () => {
    const weight = parseFloat(formData.weight) || 0;
    const declaredValue = parseFloat(formData.declaredValue) || 0;
    const province = formData.destinationProvince;
    const thermoseal = parseFloat(formData.thermoseal) || 0;

    if (weight > 0 && province && declaredValue > 0) {
      const calculatedCosts = calculateShippingCost(weight, province, declaredValue, thermoseal);
      setCosts(calculatedCosts);
    } else {
      setCosts({
        freight: 0,
        insurance: 0,
        adminFees: 0,
        iva: 0,
        thermoseal: 0,
        total: 0
      });
    }
  };

  // Efecto para mostrar el flete cuando se tienen los datos básicos
  useEffect(() => {
    if (formData.weight && formData.destinationProvince && formData.declaredValue && formData.serviceType) {
      const freight = calculateBasicCosts();
      setShowFreight(freight > 0);
    } else {
      setShowFreight(false);
      setCosts({
        freight: 0,
        insurance: 0,
        adminFees: 0,
        iva: 0,
        thermoseal: 0,
        total: 0
      });
    }
  }, [formData.weight, formData.destinationProvince, formData.declaredValue, formData.serviceType]);

  // Efecto para recalcular costos completos cuando cambia el termosellado
  useEffect(() => {
    if (showFreight) {
      calculateFullCosts();
    }
  }, [formData.thermoseal, showFreight]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowResult(false);
      return;
    }

    calculateFullCosts();
    setShowResult(true);
    setErrors([]);
  };

  const resetForm = () => {
    setFormData({
      originProvince: '',
      originCity: '',
      destinationProvince: '',
      destinationCity: '',
      weight: '',
      declaredValue: '',
      serviceType: '',
      thermoseal: ''
    });
    setCosts({
      freight: 0,
      insurance: 0,
      adminFees: 0,
      iva: 0,
      thermoseal: 0,
      total: 0
    });
    setShowResult(false);
    setShowFreight(false);
    setErrors([]);
    setOriginLocalities([]);
    setDestinationLocalities([]);
  };

  const generateOrderUrl = () => {
    const params = new URLSearchParams({
      originProvince: formData.originProvince,
      originCity: formData.originCity,
      destinationProvince: formData.destinationProvince,
      destinationCity: formData.destinationCity,
      weight: formData.weight,
      declaredValue: formData.declaredValue,
      serviceType: formData.serviceType,
      thermoseal: formData.thermoseal || '0'
    });
    return `/crear-orden?${params.toString()}`;
  };

  const maxThermoseal = costs.freight * 0.1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-calculator-line text-3xl text-green-600"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Cotizador de Envíos</h1>
          <p className="text-xl text-gray-600">Calculá el costo de tu envío al instante</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Formulario de cotización */}
          <form onSubmit={handleCalculate} className="bg-white rounded-lg shadow-lg p-8">
            {errors.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

            {/* Origen */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-map-pin-line mr-2 text-green-600"></i>
                Datos de Origen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia de Origen *
                  </label>
                  <select
                    value={formData.originProvince}
                    onChange={(e) => handleInputChange('originProvince', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                    required
                  >
                    <option value="">Seleccionar provincia...</option>
                    {argentineProvinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localidad de Origen *
                  </label>
                  {formData.originProvince ? (
                    <select
                      value={formData.originCity}
                      onChange={(e) => handleInputChange('originCity', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                      required
                    >
                      <option value="">Seleccionar localidad...</option>
                      {originLocalities.map(locality => (
                        <option key={locality} value={locality}>{locality}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder="Primero selecciona una provincia"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Destino */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-map-pin-2-line mr-2 text-green-600"></i>
                Datos de Destino
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia de Destino *
                  </label>
                  <select
                    value={formData.destinationProvince}
                    onChange={(e) => handleInputChange('destinationProvince', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                    required
                  >
                    <option value="">Seleccionar provincia...</option>
                    {argentineProvinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localidad de Destino *
                  </label>
                  {formData.destinationProvince ? (
                    <select
                      value={formData.destinationCity}
                      onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                      required
                    >
                      <option value="">Seleccionar localidad...</option>
                      {destinationLocalities.map(locality => (
                        <option key={locality} value={locality}>{locality}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder="Primero selecciona una provincia"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Detalles del envío */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-package-line mr-2 text-green-600"></i>
                Detalles del Envío
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="ri-scales-3-line mr-2"></i>
                    Peso del Envío *
                  </label>
                  <select
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                    required
                  >
                    <option value="">Seleccionar peso...</option>
                    {weightRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="ri-money-dollar-circle-line mr-2"></i>
                    Valor Declarado ($) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={formData.declaredValue}
                    onChange={(e) => handleInputChange('declaredValue', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10000"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-service-line mr-2"></i>
                Tipo de Servicio *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                required
              >
                <option value="">Seleccionar servicio...</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Mostrar valor del flete cuando esté disponible */}
            {showFreight && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <i className="ri-truck-line text-green-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-green-800">Valor del Flete Calculado</h4>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Flete base:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${costs.freight.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Peso: {weightRanges.find(w => w.value.toString() === formData.weight)?.label} | 
                    Destino: {formData.destinationProvince}
                  </div>
                </div>

                {/* Campo de termosellado ahora visible */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="ri-shield-check-line mr-2"></i>
                    Termosellado ($)
                    <span className="text-xs text-gray-500 ml-2">
                      (Opcional - Máximo: ${maxThermoseal.toLocaleString('es-AR')})
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxThermoseal}
                    step="100"
                    value={formData.thermoseal}
                    onChange={(e) => handleInputChange('thermoseal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El termosellado no puede superar el 10% del flete (${maxThermoseal.toLocaleString('es-AR')})
                  </p>
                </div>

                {/* Vista previa de costos si hay termosellado */}
                {(parseFloat(formData.thermoseal) > 0 || costs.total > 0) && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                    <h5 className="font-semibold text-gray-800 mb-2">Vista Previa de Costos:</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Flete base:</span>
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
                      {costs.thermoseal > 0 && (
                        <div className="flex justify-between">
                          <span>Termosellado:</span>
                          <span>${costs.thermoseal.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>IVA:</span>
                        <span>${costs.iva.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">${costs.total.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-calculator-line mr-2"></i>
                Calcular Costo Final
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-2"></i>
                Limpiar
              </button>
            </div>
          </form>

          {/* Resultado */}
          {showResult && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-price-tag-3-line text-3xl text-green-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Resultado de la Cotización</h2>
                <p className="text-gray-600">
                  Envío de {formData.originCity}, {formData.originProvince} a {formData.destinationCity}, {formData.destinationProvince}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center">
                        <i className="ri-truck-line mr-2 text-gray-600"></i>
                        Flete base:
                      </span>
                      <span className="font-semibold">${costs.freight.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center">
                        <i className="ri-shield-check-line mr-2 text-gray-600"></i>
                        Seguro:
                      </span>
                      <span className="font-semibold">${costs.insurance.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center">
                        <i className="ri-file-text-line mr-2 text-gray-600"></i>
                        Gastos administrativos:
                      </span>
                      <span className="font-semibold">${costs.adminFees.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {costs.thermoseal > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="flex items-center">
                          <i className="ri-shield-star-line mr-2 text-gray-600"></i>
                          Termosellado:
                        </span>
                        <span className="font-semibold">${costs.thermoseal.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center">
                        <i className="ri-percent-line mr-2 text-gray-600"></i>
                        IVA:
                      </span>
                      <span className="font-semibold">${costs.iva.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xl font-bold flex items-center">
                          <i className="ri-money-dollar-circle-fill mr-2 text-green-600"></i>
                          TOTAL:
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          ${costs.total.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Origen</div>
                      <div className="font-semibold text-gray-800">{formData.originCity}</div>
                      <div className="text-xs text-gray-500">{formData.originProvince}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Destino</div>
                      <div className="font-semibold text-gray-800">{formData.destinationCity}</div>
                      <div className="text-xs text-gray-500">{formData.destinationProvince}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Peso</div>
                      <div className="font-semibold text-gray-800">
                        {weightRanges.find(w => w.value.toString() === formData.weight)?.label}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Servicio</div>
                      <div className="font-semibold text-gray-800 text-xs">{formData.serviceType}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    ¿Te gusta el precio? ¡Creá tu orden de envío ahora!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href={generateOrderUrl()}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap inline-block text-center"
                    >
                      <i className="ri-add-box-line mr-2"></i>
                      Generar Orden de Envío
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        const message = `Cotización de envío:\\n• De: ${formData.originCity}, ${formData.originProvince}\\n• A: ${formData.destinationCity}, ${formData.destinationProvince}\\n• Peso: ${weightRanges.find(w => w.value.toString() === formData.weight)?.label}\\n• Servicio: ${formData.serviceType}\\n• Total: $${costs.total.toLocaleString('es-AR')}\\n\\n¿Te ayudo con algo más?`;
                        const whatsappUrl = `https://wa.me/5491123456789?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-whatsapp-line mr-2"></i>
                      Consultar por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información Importante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <i className="ri-time-line mr-2 text-green-600"></i>
                  Tiempos de Entrega
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CABA y Gran Buenos Aires: 24-36 horas</li>
                  <li>• Principales ciudades: 1-2 días</li>
                  <li>• Interior del país: 2-3 días</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <i className="ri-shield-check-line mr-2 text-green-600"></i>
                  Incluye
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Seguro por valor declarado</li>
                  <li>• Seguimiento en tiempo real</li>
                  <li>• Recolección y entrega</li>
                  <li>• Atención al cliente 24/7</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <i className="ri-information-line mr-2"></i>
                <strong>Nota:</strong> Los precios son estimativos y pueden variar según dimensiones exactas y servicios adicionales. 
                La cotización final se confirmará al momento de crear la orden.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
