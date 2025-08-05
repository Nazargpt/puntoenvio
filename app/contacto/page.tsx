
'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Contacto() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío del formulario
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 2000);
  };

  const contactMethods = [
    {
      icon: 'ri-phone-fill',
      title: 'Línea de Atención',
      value: '+57 300 123 4567',
      description: 'Disponible 24/7 para emergencias',
      color: 'blue',
      link: 'tel:+573001234567'
    },
    {
      icon: 'ri-mail-fill',
      title: 'Email Soporte',
      value: 'soporte@puntoenvio.com',
      description: 'Respuesta en menos de 24 horas',
      color: 'green',
      link: 'mailto:soporte@puntoenvio.com'
    },
    {
      icon: 'ri-whatsapp-fill',
      title: 'WhatsApp',
      value: '+57 300 123 4567',
      description: 'Chat directo con nuestro equipo',
      color: 'green',
      link: 'https://wa.me/573001234567'
    },
    {
      icon: 'ri-map-pin-fill',
      title: 'Oficina Principal',
      value: 'Bogotá, Colombia',
      description: 'Carrera 7 # 32-45, Centro',
      color: 'red',
      link: '#ubicacion'
    }
  ];

  const offices = [
    {
      city: 'Bogotá',
      address: 'Carrera 7 # 32-45, Centro',
      phone: '+57 1 234 5678',
      hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM'
    },
    {
      city: 'Medellín',
      address: 'Calle 50 # 45-30, El Poblado',
      phone: '+57 4 567 8901',
      hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM'
    },
    {
      city: 'Cali',
      address: 'Avenida 6N # 28-45, Norte',
      phone: '+57 2 345 6789',
      hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contáctanos</h1>
          <p className="text-xl">Estamos aquí para ayudarte con tus envíos</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contáctanos</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para ayudarte. Contacta a nuestro equipo de soporte para resolver cualquier duda sobre tus envíos
          </p>
        </div>

        {/* Métodos de contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className={`w-12 h-12 bg-${method.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${method.icon} text-2xl text-${method.color}-600`}></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{method.title}</h3>
                <a 
                  href={method.link}
                  className={`text-${method.color}-600 hover:text-${method.color}-700 font-semibold cursor-pointer transition-colors`}
                >
                  {method.value}
                </a>
                <p className="text-gray-600 text-sm mt-2">{method.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulario de contacto */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un Mensaje</h2>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">¡Mensaje Enviado!</h3>
                <p className="text-gray-600 mb-6">
                  Gracias por contactarnos. Responderemos a tu consulta en las próximas 24 horas.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Enviar Otro Mensaje
                </button>
              </div>
            ) : (
              <form id="contacto-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      required
                    >
                      <option value="">Seleccionar asunto...</option>
                      <option value="seguimiento">Seguimiento de Envío</option>
                      <option value="tarifas">Consulta de Tarifas</option>
                      <option value="reclamo">Reclamo</option>
                      <option value="sugerencia">Sugerencia</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={6}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Describe tu consulta o mensaje..."
                    required
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {formData.message.length}/500 caracteres
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Enviar Mensaje
                </button>
              </form>
            )}
          </div>

          {/* Información de oficinas */}
          <div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Oficina Principal</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-map-pin-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">Calle 26 #68-85, Bogotá, Colombia</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-phone-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">+57 1 234 5678</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-mail-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">info@puntoenvio.com</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-time-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">Lunes a Viernes: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Atención al Cliente</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-customer-service-2-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">Línea Nacional: 01 8000 123 456</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-whatsapp-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">WhatsApp: +57 300 123 4567</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-mail-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">soporte@puntoenvio.com</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-time-fill text-green-600"></i>
                  </div>
                  <span className="ml-3 text-gray-700">Disponible 24/7</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.325395276241!2d-74.07209768459378!3d4.653481043627848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a2c5b7d9a1f%3A0x1234567890123456!2sBogot%C3%A1%2C%20Colombia!5e0!3m2!1ses!2sco!4v1234567890123"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Punto Envío"
              ></iframe>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                <strong>Dirección:</strong> Carrera 7 # 32-45, Centro, Bogotá, Colombia
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Horario:</strong> Lunes a Viernes de 8:00 AM a 6:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div id="ubicacion" className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuestra Ubicación Principal</h2>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
