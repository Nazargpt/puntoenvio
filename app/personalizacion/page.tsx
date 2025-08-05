
'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface CustomizationSettings {
  // Colores principales
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Textos principales
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  
  // Configuraciones de diseño
  borderRadius: string;
  shadowStyle: string;
  fontSize: string;
  fontFamily: string;
  
  // Logo y marca
  logoUrl: string;
  faviconUrl: string;
  
  // Textos de secciones
  servicesTitle: string;
  servicesDescription: string;
  contactTitle: string;
  footerText: string;
  
  // Configuraciones de formularios
  buttonStyle: string;
  inputStyle: string;
  
  // Configuraciones adicionales
  headerStyle: string;
  animationStyle: string;
}

const defaultSettings: CustomizationSettings = {
  primaryColor: '#10b981',
  secondaryColor: '#000000',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  siteName: 'PuntoEnvío',
  tagline: 'Red nacional de envíos seguros y rápidos',
  heroTitle: 'Envíos seguros a todo el país',
  heroSubtitle: 'Red nacional de 30.000 agencias para tus envíos',
  borderRadius: '0.5rem',
  shadowStyle: 'shadow-lg',
  fontSize: '1rem',
  fontFamily: 'Inter, sans-serif',
  logoUrl: 'https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/889e2c70cce2168523fa4add2f058bea.png',
  faviconUrl: '',
  servicesTitle: 'Nuestros Servicios',
  servicesDescription: 'Soluciones completas de envío para empresas y particulares',
  contactTitle: 'Contáctanos',
  footerText: 'Red nacional de 30.000 agencias para tus envíos seguros y rápidos.',
  buttonStyle: 'rounded',
  inputStyle: 'rounded',
  headerStyle: 'fixed',
  animationStyle: 'smooth'
};

export default function PersonalizacionPage() {
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('colores');
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar configuraciones guardadas
  useEffect(() => {
    const saved = localStorage.getItem('puntoenvio-customization');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Guardar configuraciones
  const saveSettings = () => {
    setIsLoading(true);
    localStorage.setItem('puntoenvio-customization', JSON.stringify(settings));
    
    // Aplicar estilos CSS dinámicamente
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--text-color', settings.textColor);
    root.style.setProperty('--border-radius', settings.borderRadius);
    root.style.setProperty('--font-size', settings.fontSize);
    root.style.setProperty('--font-family', settings.fontFamily);
    
    setTimeout(() => {
      setIsLoading(false);
      alert('¡Configuración guardada exitosamente!');
    }, 1000);
  };

  // Restablecer configuraciones por defecto
  const resetSettings = () => {
    if (confirm('¿Estás seguro de restablecer todas las configuraciones por defecto?')) {
      setSettings(defaultSettings);
      localStorage.removeItem('puntoenvio-customization');
    }
  };

  // Exportar configuraciones
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'puntoenvio-customization.json';
    link.click();
  };

  // Importar configuraciones
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
          alert('¡Configuración importada exitosamente!');
        } catch (error) {
          alert('Error al importar la configuración');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateSetting = (key: keyof CustomizationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Personalización</h1>
            <p className="text-gray-600">Personaliza el diseño completo de tu plataforma</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-eye-line mr-2"></i>
              {previewMode ? 'Salir Vista Previa' : 'Vista Previa'}
            </button>
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isLoading 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>

        {!previewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Panel de navegación */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuraciones</h3>
                <nav className="space-y-2">
                  {[
                    { id: 'colores', label: 'Colores', icon: 'ri-palette-line' },
                    { id: 'textos', label: 'Textos', icon: 'ri-text' },
                    { id: 'tipografia', label: 'Tipografía', icon: 'ri-font-size-2' },
                    { id: 'diseno', label: 'Diseño', icon: 'ri-layout-line' },
                    { id: 'imagenes', label: 'Imágenes', icon: 'ri-image-line' },
                    { id: 'formularios', label: 'Formularios', icon: 'ri-file-list-line' },
                    { id: 'avanzado', label: 'Avanzado', icon: 'ri-settings-3-line' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <i className={`${tab.icon} mr-3`}></i>
                      {tab.label}
                    </button>
                  ))}
                </nav>
                
                <hr className="my-6" />
                
                <div className="space-y-3">
                  <button
                    onClick={resetSettings}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Restablecer
                  </button>
                  
                  <button
                    onClick={exportSettings}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-download-line mr-2"></i>
                    Exportar
                  </button>
                  
                  <label className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap block text-center">
                    <i className="ri-upload-line mr-2"></i>
                    Importar
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Panel de configuración */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-lg p-6">
                
                {/* Tab: Colores */}
                {activeTab === 'colores' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Colores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Principal</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                            className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.primaryColor}
                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#10b981"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                            className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.secondaryColor}
                            onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color de Acento</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => updateSetting('accentColor', e.target.value)}
                            className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.accentColor}
                            onChange={(e) => updateSetting('accentColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                            className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.backgroundColor}
                            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color de Texto</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.textColor}
                            onChange={(e) => updateSetting('textColor', e.target.value)}
                            className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.textColor}
                            onChange={(e) => updateSetting('textColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-4">Vista Previa de Colores</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg mb-2" 
                            style={{ backgroundColor: settings.primaryColor }}
                          ></div>
                          <span className="text-xs text-gray-600">Principal</span>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg mb-2" 
                            style={{ backgroundColor: settings.secondaryColor }}
                          ></div>
                          <span className="text-xs text-gray-600">Secundario</span>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg mb-2" 
                            style={{ backgroundColor: settings.accentColor }}
                          ></div>
                          <span className="text-xs text-gray-600">Acento</span>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg mb-2 border" 
                            style={{ backgroundColor: settings.backgroundColor }}
                          ></div>
                          <span className="text-xs text-gray-600">Fondo</span>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg mb-2" 
                            style={{ backgroundColor: settings.textColor }}
                          ></div>
                          <span className="text-xs text-gray-600">Texto</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Textos */}
                {activeTab === 'textos' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Textos</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sitio</label>
                        <input
                          type="text"
                          value={settings.siteName}
                          onChange={(e) => updateSetting('siteName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="PuntoEnvío"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eslogan Principal</label>
                        <input
                          type="text"
                          value={settings.tagline}
                          onChange={(e) => updateSetting('tagline', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Red nacional de envíos seguros y rápidos"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal (Hero)</label>
                        <input
                          type="text"
                          value={settings.heroTitle}
                          onChange={(e) => updateSetting('heroTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Envíos seguros a todo el país"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo Principal</label>
                        <textarea
                          value={settings.heroSubtitle}
                          onChange={(e) => updateSetting('heroSubtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                          placeholder="Red nacional de 30.000 agencias para tus envíos"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Título de Servicios</label>
                          <input
                            type="text"
                            value={settings.servicesTitle}
                            onChange={(e) => updateSetting('servicesTitle', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Nuestros Servicios"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Título de Contacto</label>
                          <input
                            type="text"
                            value={settings.contactTitle}
                            onChange={(e) => updateSetting('contactTitle', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Contáctanos"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción de Servicios</label>
                        <textarea
                          value={settings.servicesDescription}
                          onChange={(e) => updateSetting('servicesDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Soluciones completas de envío para empresas y particulares"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Texto del Footer</label>
                        <textarea
                          value={settings.footerText}
                          onChange={(e) => updateSetting('footerText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Red nacional de 30.000 agencias para tus envíos seguros y rápidos."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Tipografía */}
                {activeTab === 'tipografia' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Tipografía</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Familia de Fuente</label>
                        <select
                          value={settings.fontFamily}
                          onChange={(e) => updateSetting('fontFamily', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="Inter, sans-serif">Inter (Recomendada)</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Open Sans, sans-serif">Open Sans</option>
                          <option value="Montserrat, sans-serif">Montserrat</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Lato, sans-serif">Lato</option>
                          <option value="Source Sans Pro, sans-serif">Source Sans Pro</option>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Georgia, serif">Georgia (Serif)</option>
                          <option value="Times New Roman, serif">Times New Roman</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño Base</label>
                        <select
                          value={settings.fontSize}
                          onChange={(e) => updateSetting('fontSize', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="0.875rem">Pequeño (14px)</option>
                          <option value="1rem">Normal (16px)</option>
                          <option value="1.125rem">Grande (18px)</option>
                          <option value="1.25rem">Muy Grande (20px)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-4">Vista Previa de Tipografía</h4>
                      <div 
                        style={{ 
                          fontFamily: settings.fontFamily, 
                          fontSize: settings.fontSize,
                          color: settings.textColor 
                        }}
                      >
                        <h1 className="text-4xl font-bold mb-4">Título Principal H1</h1>
                        <h2 className="text-2xl font-semibold mb-4">Subtítulo H2</h2>
                        <h3 className="text-xl font-medium mb-4">Encabezado H3</h3>
                        <p className="mb-4">
                          Este es un párrafo de ejemplo para mostrar cómo se ve el texto normal con la configuración seleccionada. 
                          Aquí puedes ver el tamaño, familia de fuente y color aplicados.
                        </p>
                        <p className="text-sm text-gray-600">
                          Texto pequeño para información secundaria o notas al pie.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Diseño */}
                {activeTab === 'diseno' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Diseño</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Radio de Bordes</label>
                        <select
                          value={settings.borderRadius}
                          onChange={(e) => updateSetting('borderRadius', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="0">Sin Redondeo</option>
                          <option value="0.25rem">Ligeramente Redondeado</option>
                          <option value="0.5rem">Redondeado</option>
                          <option value="0.75rem">Muy Redondeado</option>
                          <option value="1rem">Extremadamente Redondeado</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Sombras</label>
                        <select
                          value={settings.shadowStyle}
                          onChange={(e) => updateSetting('shadowStyle', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="shadow-none">Sin Sombra</option>
                          <option value="shadow-sm">Sombra Suave</option>
                          <option value="shadow">Sombra Normal</option>
                          <option value="shadow-lg">Sombra Grande</option>
                          <option value="shadow-xl">Sombra Muy Grande</option>
                          <option value="shadow-2xl">Sombra Dramática</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo del Header</label>
                        <select
                          value={settings.headerStyle}
                          onChange={(e) => updateSetting('headerStyle', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="fixed">Fijo en la parte superior</option>
                          <option value="static">Estático</option>
                          <option value="transparent">Transparente</option>
                          <option value="gradient">Con Gradiente</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Animaciones</label>
                        <select
                          value={settings.animationStyle}
                          onChange={(e) => updateSetting('animationStyle', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="none">Sin Animaciones</option>
                          <option value="minimal">Animaciones Mínimas</option>
                          <option value="smooth">Animaciones Suaves</option>
                          <option value="dynamic">Animaciones Dinámicas</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-4">Vista Previa de Elementos</h4>
                      <div className="space-y-4">
                        <div 
                          className={`p-4 bg-white ${settings.shadowStyle}`}
                          style={{ 
                            borderRadius: settings.borderRadius,
                            backgroundColor: settings.backgroundColor
                          }}
                        >
                          <h5 className="font-semibold mb-2">Tarjeta de Ejemplo</h5>
                          <p className="text-sm">Esta es una tarjeta con el estilo de bordes y sombras seleccionado.</p>
                        </div>
                        
                        <button 
                          className="px-6 py-3 text-white font-semibold transition-colors"
                          style={{ 
                            backgroundColor: settings.primaryColor,
                            borderRadius: settings.borderRadius
                          }}
                        >
                          Botón de Ejemplo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Imágenes */}
                {activeTab === 'imagenes' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Imágenes</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL del Logo</label>
                        <input
                          type="url"
                          value={settings.logoUrl}
                          onChange={(e) => updateSetting('logoUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="https://ejemplo.com/logo.png"
                        />
                        {settings.logoUrl && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-semibold mb-2">Vista Previa del Logo:</h5>
                            <img 
                              src={settings.logoUrl} 
                              alt="Logo Preview" 
                              className="h-12 w-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL del Favicon</label>
                        <input
                          type="url"
                          value={settings.faviconUrl}
                          onChange={(e) => updateSetting('faviconUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="https://ejemplo.com/favicon.ico"
                        />
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <div className="w-5 h-5 flex items-center justify-center mr-2">
                            <i className="ri-information-line text-blue-600"></i>
                          </div>
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-2">Consejos para las imágenes:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>El logo debe ser en formato PNG con fondo transparente</li>
                              <li>Tamaño recomendado: 200x60 píxeles máximo</li>
                              <li>El favicon debe ser de 32x32 píxeles en formato ICO o PNG</li>
                              <li>Asegúrate de que las URLs sean accesibles públicamente</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Formularios */}
                {activeTab === 'formularios' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Formularios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Botones</label>
                        <select
                          value={settings.buttonStyle}
                          onChange={(e) => updateSetting('buttonStyle', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="rounded">Redondeados</option>
                          <option value="square">Cuadrados</option>
                          <option value="pill">Píldora</option>
                          <option value="minimal">Minimalista</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Campos</label>
                        <select
                          value={settings.inputStyle}
                          onChange={(e) => updateSetting('inputStyle', e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg"
                        >
                          <option value="rounded">Redondeados</option>
                          <option value="square">Cuadrados</option>
                          <option value="underlined">Subrayados</option>
                          <option value="outlined">Con Borde</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-4">Vista Previa de Formulario</h4>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Campo de ejemplo"
                          className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 ${
                            settings.inputStyle === 'rounded' ? 'rounded-lg' :
                            settings.inputStyle === 'square' ? 'rounded-none' :
                            settings.inputStyle === 'underlined' ? 'border-0 border-b-2 rounded-none bg-transparent' :
                            'rounded-md'
                          }`}
                          style={{ 
                            focusRingColor: settings.primaryColor 
                          }}
                        />
                        
                        <button 
                          className={`px-6 py-3 text-white font-semibold transition-colors ${
                            settings.buttonStyle === 'rounded' ? 'rounded-lg' :
                            settings.buttonStyle === 'square' ? 'rounded-none' :
                            settings.buttonStyle === 'pill' ? 'rounded-full' :
                            'rounded-md border-2'
                          }`}
                          style={{ 
                            backgroundColor: settings.primaryColor
                          }}
                        >
                          Botón de Ejemplo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Avanzado */}
                {activeTab === 'avanzado' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Configuración Avanzada</h3>
                    
                    <div className="space-y-8">
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start">
                          <div className="w-5 h-5 flex items-center justify-center mr-2">
                            <i className="ri-warning-line text-yellow-600"></i>
                          </div>
                          <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Configuración Avanzada</p>
                            <p>Estas configuraciones afectan el comportamiento global del sitio. Úsalas con precaución.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">CSS Personalizado</h4>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                          rows={10}
                          placeholder="/* CSS personalizado aquí */
.custom-class {
  background-color: #f0f0f0;
  border-radius: 8px;
}

/* Variables CSS disponibles */
:root {
  --primary-color: var(--primary-color);
  --secondary-color: var(--secondary-color);
  --accent-color: var(--accent-color);
}"
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">JavaScript Personalizado</h4>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                          rows={8}
                          placeholder="// JavaScript personalizado aquí
console.log('Personalización cargada');

// Ejemplo: Agregar eventos personalizados
document.addEventListener('DOMContentLoaded', function() {
  // Tu código aquí
});"
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Configuración JSON Completa</h4>
                        <textarea
                          value={JSON.stringify(settings, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setSettings(parsed);
                            } catch (error) {
                              // Mantener valor anterior si JSON es inválido
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                          rows={15}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        ) : (
          /* Vista Previa */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Vista Previa del Diseño</h2>
            
            {/* Simular header */}
            <div 
              className="p-4 rounded-lg mb-6"
              style={{ 
                backgroundColor: settings.secondaryColor,
                color: 'white'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto mr-4" />
                  )}
                  <span className="text-xl font-bold" style={{ fontFamily: settings.fontFamily }}>
                    {settings.siteName}
                  </span>
                </div>
                <nav className="flex space-x-4 text-sm">
                  <span>Inicio</span>
                  <span>Servicios</span>
                  <span>Contacto</span>
                </nav>
              </div>
            </div>
            
            {/* Simular hero section */}
            <div 
              className="text-center py-12 rounded-lg mb-8"
              style={{ 
                backgroundColor: settings.backgroundColor,
                color: settings.textColor,
                fontFamily: settings.fontFamily,
                fontSize: settings.fontSize
              }}
            >
              <h1 className="text-4xl font-bold mb-4">{settings.heroTitle}</h1>
              <p className="text-xl mb-2">{settings.heroSubtitle}</p>
              <p className="text-lg opacity-80">{settings.tagline}</p>
              
              <button 
                className="mt-6 px-8 py-4 text-white font-semibold transition-colors"
                style={{ 
                  backgroundColor: settings.primaryColor,
                  borderRadius: settings.borderRadius
                }}
              >
                Comenzar Ahora
              </button>
            </div>
            
            {/* Simular sección de servicios */}
            <div className="mb-8">
              <h2 
                className="text-3xl font-bold text-center mb-6"
                style={{ 
                  color: settings.textColor,
                  fontFamily: settings.fontFamily 
                }}
              >
                {settings.servicesTitle}
              </h2>
              <p 
                className="text-center mb-8"
                style={{ 
                  color: settings.textColor,
                  fontFamily: settings.fontFamily 
                }}
              >
                {settings.servicesDescription}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className={`p-6 ${settings.shadowStyle}`}
                    style={{ 
                      backgroundColor: settings.backgroundColor,
                      borderRadius: settings.borderRadius
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      <i className="ri-truck-line text-white text-xl"></i>
                    </div>
                    <h3 
                      className="text-xl font-semibold mb-2"
                      style={{ 
                        color: settings.textColor,
                        fontFamily: settings.fontFamily 
                      }}
                    >
                      Servicio {i}
                    </h3>
                    <p 
                      style={{ 
                        color: settings.textColor,
                        fontFamily: settings.fontFamily 
                      }}
                    >
                      Descripción del servicio con el diseño personalizado aplicado.
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Simular footer */}
            <div 
              className="p-6 rounded-lg text-center"
              style={{ 
                backgroundColor: settings.secondaryColor,
                color: 'white',
                fontFamily: settings.fontFamily
              }}
            >
              <h4 className="text-lg font-semibold mb-2">{settings.contactTitle}</h4>
              <p className="opacity-80">{settings.footerText}</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
      
      <style jsx global>{`
        :root {
          --primary-color: ${settings.primaryColor};
          --secondary-color: ${settings.secondaryColor};
          --accent-color: ${settings.accentColor};
          --bg-color: ${settings.backgroundColor};
          --text-color: ${settings.textColor};
          --border-radius: ${settings.borderRadius};
          --font-size: ${settings.fontSize};
          --font-family: ${settings.fontFamily};
        }
      `}</style>
    </div>
  );
}
