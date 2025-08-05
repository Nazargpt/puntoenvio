'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function RegistroTransportistas() {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    dni: '',
    cuit: '',
    telefono: '',
    email: '',
    whatsapp: '',
    direccion: '',
    provincia: '',
    localidad: '',
    codigoPostal: '',
    tipoVehiculo: '',
    marca: '',
    modelo: '',
    ano: '',
    patente: '',
    capacidadCarga: '',
    zonasCobertura: '',
    experienciaTransporte: '',
    disponibilidadHoraria: '',
    tipoServicio: '',
    seguroVehiculo: '',
    licenciaConducir: '',
    comentarios: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const provincias = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);
    
    // Reset form
    setFormData({
      nombreCompleto: '',
      dni: '',
      cuit: '',
      telefono: '',
      email: '',
      whatsapp: '',
      direccion: '',
      provincia: '',
      localidad: '',
      codigoPostal: '',
      tipoVehiculo: '',
      marca: '',
      modelo: '',
      ano: '',
      patente: '',
      capacidadCarga: '',
      zonasCobertura: '',
      experienciaTransporte: '',
      disponibilidadHoraria: '',
      tipoServicio: '',
      seguroVehiculo: '',
      licenciaConducir: '',
      comentarios: ''
    });

    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-truck-line text-4xl text-green-600"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Registrate como Transportista PuntoEnvío
            </h1>
            <p className="text-xl text-gray-600">
              Formá parte de nuestra red logística y generá ingresos con tu vehículo
            </p>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Ingresos Estables</h3>
              <p className="text-sm text-gray-600">Generá ingresos constantes con rutas programadas</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-route-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Rutas Optimizadas</h3>
              <p className="text-sm text-gray-600">Sistema inteligente de asignación de envíos</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-smartphone-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">App Móvil</h3>
              <p className="text-sm text-gray-600">Herramientas digitales para gestionar tus envíos</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} id="registro-transportistas" className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Datos Personales</h2>

            {/* Información Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT/CUIL
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  placeholder="20-12345678-9"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia *
                </label>
                <select
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar provincia</option>
                  {provincias.map((provincia) => (
                    <option key={provincia} value={provincia}>
                      {provincia}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localidad *
                </label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal *
                </label>
                <input
                  type="text"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {/* Información del Vehículo */}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Información del Vehículo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vehículo *
                </label>
                <select
                  name="tipoVehiculo"
                  value={formData.tipoVehiculo}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="moto">Motocicleta</option>
                  <option value="auto">Automóvil</option>
                  <option value="utilitario">Utilitario</option>
                  <option value="furgon">Furgón</option>
                  <option value="camion-pequeno">Camión Pequeño</option>
                  <option value="camion-mediano">Camión Mediano</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo *
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año *
                </label>
                <input
                  type="number"
                  name="ano"
                  value={formData.ano}
                  onChange={handleInputChange}
                  min="1990"
                  max="2024"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patente *
                </label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  placeholder="ABC123 o AB123CD"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad de Carga *
                </label>
                <select
                  name="capacidadCarga"
                  value={formData.capacidadCarga}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar capacidad</option>
                  <option value="hasta-5kg">Hasta 5 kg</option>
                  <option value="5-20kg">5 a 20 kg</option>
                  <option value="20-50kg">20 a 50 kg</option>
                  <option value="50-100kg">50 a 100 kg</option>
                  <option value="100-500kg">100 a 500 kg</option>
                  <option value="mas-500kg">Más de 500 kg</option>
                </select>
              </div>
            </div>

            {/* Información Operativa */}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Información de Servicio</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zonas de Cobertura *
                </label>
                <input
                  type="text"
                  name="zonasCobertura"
                  value={formData.zonasCobertura}
                  onChange={handleInputChange}
                  placeholder="Ej: CABA, Zona Norte GBA, La Plata"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiencia en Transporte *
                </label>
                <select
                  name="experienciaTransporte"
                  value={formData.experienciaTransporte}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar experiencia</option>
                  <option value="nueva">Sin experiencia previa</option>
                  <option value="1-2-anos">1 a 2 años</option>
                  <option value="3-5-anos">3 a 5 años</option>
                  <option value="mas-5-anos">Más de 5 años</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilidad Horaria *
                </label>
                <select
                  name="disponibilidadHoraria"
                  value={formData.disponibilidadHoraria}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar disponibilidad</option>
                  <option value="matutino">Turno Mañana (8-14hs)</option>
                  <option value="vespertino">Turno Tarde (14-20hs)</option>
                  <option value="completo">Turno Completo (8-20hs)</option>
                  <option value="flexible">Horario Flexible</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio *
                </label>
                <select
                  name="tipoServicio"
                  value={formData.tipoServicio}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  <option value="urbano">Entregas Urbanas</option>
                  <option value="interurbano">Rutas Interurbanas</option>
                  <option value="nacional">Transporte Nacional</option>
                  <option value="todos">Todos los Servicios</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seguro del Vehículo *
                </label>
                <select
                  name="seguroVehiculo"
                  value={formData.seguroVehiculo}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar tipo de seguro</option>
                  <option value="responsabilidad-civil">Responsabilidad Civil</option>
                  <option value="terceros-completo">Terceros Completo</option>
                  <option value="todo-riesgo">Todo Riesgo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licencia de Conducir *
                </label>
                <select
                  name="licenciaConducir"
                  value={formData.licenciaConducir}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar tipo de licencia</option>
                  <option value="clase-b1">Clase B1 (Automóviles)</option>
                  <option value="clase-b2">Clase B2 (Utilitarios)</option>
                  <option value="clase-c1">Clase C1 (Camiones pequeños)</option>
                  <option value="clase-c2">Clase C2 (Camiones medianos)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios Adicionales
                </label>
                <textarea
                  name="comentarios"
                  value={formData.comentarios}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Contanos sobre tu experiencia, disponibilidad especial, o cualquier información adicional"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.comentarios.length}/500 caracteres
                </p>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Enviando Solicitud...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line mr-2"></i>
                    Solicitar Registro
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Mensaje de éxito */}
          {showSuccess && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg">
              <div className="flex items-center">
                <i className="ri-check-circle-line text-2xl mr-3"></i>
                <div>
                  <p className="font-bold">¡Solicitud enviada con éxito!</p>
                  <p className="text-sm">Te contactaremos pronto para continuar el proceso.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}