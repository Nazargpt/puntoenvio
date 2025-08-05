
'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function RegistroAgencias() {
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    cuit: '',
    direccion: '',
    provincia: '',
    localidad: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    whatsapp: '',
    nombreContacto: '',
    horarioAtencion: '',
    capacidadPaquetes: '',
    espacioFisico: '',
    experienciaLogistica: '',
    tipoNegocio: '',
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
      nombreEmpresa: '',
      cuit: '',
      direccion: '',
      provincia: '',
      localidad: '',
      codigoPostal: '',
      telefono: '',
      email: '',
      whatsapp: '',
      nombreContacto: '',
      horarioAtencion: '',
      capacidadPaquetes: '',
      espacioFisico: '',
      experienciaLogistica: '',
      tipoNegocio: '',
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
              <i className="ri-store-line text-4xl text-green-600"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Registrate como Agencia PuntoEnvío
            </h1>
            <p className="text-xl text-gray-600">
              Sumá tu negocio a la red de logística más grande de Argentina
            </p>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Ingresos Adicionales</h3>
              <p className="text-sm text-gray-600">Generá ingresos extra con cada paquete procesado</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-team-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Red Nacional</h3>
              <p className="text-sm text-gray-600">Formá parte de la red más grande del país</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-tools-line text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Soporte Completo</h3>
              <p className="text-sm text-gray-600">Capacitación y herramientas incluidas</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} id="registro-agencias" className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Datos de la Agencia</h2>

            {/* Información de la Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombreEmpresa"
                  value={formData.nombreEmpresa}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT *
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  placeholder="20-12345678-9"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  name="nombreContacto"
                  value={formData.nombreContacto}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {/* Información Operativa */}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Información Operativa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Atención *
                </label>
                <input
                  type="text"
                  name="horarioAtencion"
                  value={formData.horarioAtencion}
                  onChange={handleInputChange}
                  placeholder="Ej: Lunes a Viernes 9 a 18hs"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad Diaria de Paquetes *
                </label>
                <select
                  name="capacidadPaquetes"
                  value={formData.capacidadPaquetes}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar capacidad</option>
                  <option value="1-20">1 a 20 paquetes</option>
                  <option value="21-50">21 a 50 paquetes</option>
                  <option value="51-100">51 a 100 paquetes</option>
                  <option value="100+">Más de 100 paquetes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espacio Físico Disponible *
                </label>
                <select
                  name="espacioFisico"
                  value={formData.espacioFisico}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar espacio</option>
                  <option value="pequeno">Pequeño (menos de 10m²)</option>
                  <option value="mediano">Mediano (10-30m²)</option>
                  <option value="grande">Grande (más de 30m²)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiencia en Logística
                </label>
                <select
                  name="experienciaLogistica"
                  value={formData.experienciaLogistica}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="">Seleccionar experiencia</option>
                  <option value="nueva">Sin experiencia previa</option>
                  <option value="basica">Experiencia básica (menos de 2 años)</option>
                  <option value="intermedia">Experiencia intermedia (2-5 años)</option>
                  <option value="avanzada">Experiencia avanzada (más de 5 años)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio Actual *
                </label>
                <select
                  name="tipoNegocio"
                  value={formData.tipoNegocio}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seleccionar tipo de negocio</option>
                  <option value="agencia-loteria">Agencia de Lotería</option>
                  <option value="agencia-cobros">Agencia de Cobros</option>
                  <option value="kiosco">Kiosco</option>
                  <option value="otro">Otro</option>
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
                  placeholder="Contanos más sobre tu negocio y por qué querés ser parte de PuntoEnvío"
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
