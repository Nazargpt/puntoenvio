
'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/889e2c70cce2168523fa4add2f058bea.png" 
                alt="PuntoEnvío Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="text-2xl font-bold text-green-400 ml-2 hidden" style={{ fontFamily: 'Pacifico, serif' }}>
                PuntoEnvío
              </div>
            </div>
            <p className="text-gray-300 mb-4">Red nacional de agencias para tus envíos seguros y rápidos.</p>
            <div className="flex space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-facebook-fill text-xl cursor-pointer hover:text-green-400 transition-colors"></i>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-twitter-fill text-xl cursor-pointer hover:text-green-400 transition-colors"></i>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-instagram-fill text-xl cursor-pointer hover:text-green-400 transition-colors"></i>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li><Link href="/crear-orden" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Crear Orden</Link></li>
              <li><Link href="/seguimiento" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Seguimiento</Link></li>
              <li><Link href="/tarifas" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Tarifas</Link></li>
              <li><Link href="/agencias" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Agencias</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2">
              <li><Link href="/contacto" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Contacto</Link></li>
              <li><a href="tel:+543001234567" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Línea de Atención</a></li>
              <li><a href="mailto:soporte@puntoenvio.com" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Email Soporte</a></li>
              <li><span className="text-gray-300">Horarios: 24/7</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Únete a Nosotros</h4>
            <ul className="space-y-2">
              <li><Link href="/registro-agencias" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Ser Agencia</Link></li>
              <li><Link href="/registro-transportistas" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Ser Transportista</Link></li>
              <li><span className="text-gray-300">Expandí tu negocio</span></li>
              <li><span className="text-gray-300">Generá ingresos</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-phone-fill"></i>
                </div>
                <span className="text-gray-300">+54 11 1234 5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-mail-fill"></i>
                </div>
                <span className="text-gray-300">info@puntoenvio.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-map-pin-fill"></i>
                </div>
                <span className="text-gray-300">Av. Brasil 2335, Buenos Aires, Argentina</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">&copy; 2024 Punto Envío. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
