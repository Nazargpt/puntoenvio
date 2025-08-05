
'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getTariffs, saveTariffs, Tariff, calculateShippingCost } from '../../lib/storage';

export default function Tarifas() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tariff>>({});
  const [calculator, setCalculator] = useState({
    weight: 0,
    province: '',
    declaredValue: 1000
  });
  const [resultado, setResultado] = useState({
    flete: 0,
    seguro: 0,
    gastos: 0,
    iva: 0,
    total: 0,
  });

  const provinces = [
    'CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
    'Entre Ríos', 'Salta', 'Chaco', 'Corrientes', 'Misiones', 'Formosa',
    'Jujuy', 'Catamarca', 'La Rioja', 'San Juan', 'San Luis', 'La Pampa',
    'Río Negro', 'Neuquén', 'Chubut', 'Santa Cruz', 'Tierra del Fuego', 'Santiago del Estero'
  ];

  const weightRanges = [
    { label: '0 - 5kg', value: 5 },
    { label: '5kg - 10kg', value: 10 },
    { label: '10kg - 15kg', value: 15 },
    { label: '15kg - 20kg', value: 20 },
    { label: '20kg - 25kg', value: 25 }
  ];

  useEffect(() => {
    setTariffs(getTariffs());
  }, []);

  const calcularTarifa = () => {
    if (calculator.weight > 0 && calculator.province && calculator.declaredValue > 0) {
      const costs = calculateShippingCost(calculator.weight, calculator.province, calculator.declaredValue);
      setResultado({
        flete: costs.freight,
        seguro: costs.insurance,
        gastos: costs.adminFees,
        iva: costs.iva,
        total: costs.total
      });
    }
  };

  const handleEdit = (tariff: Tariff) => {
    setEditingId(tariff.id);
    setEditForm(tariff);
  };

  const handleSave = () => {
    if (editingId && editForm.basePrice && editForm.weightFrom !== undefined && editForm.weightTo && editForm.province) {
      const updatedTariffs = tariffs.map((t) =>
        t.id === editingId ? { ...t, ...editForm } as Tariff : t
      );
      setTariffs(updatedTariffs);
      saveTariffs(updatedTariffs);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-price-tag-3-line text-3xl text-green-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tarifas de Envío</h1>
          <p className="text-gray-600">Tarifas transparentes para toda Argentina</p>
        </div>

        {/* Componentes del Costo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-truck-line text-2xl text-green-600"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Flete Base</h3>
            <p className="text-sm text-gray-600">Costo principal según peso y provincia</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-check-line text-2xl text-green-600"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Seguro (10%)</h3>
            <p className="text-sm text-gray-600">Protección del valor declarado</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-text-line text-2xl text-green-600"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Gastos Admin (15%)</h3>
            <p className="text-sm text-gray-600">Costos operativos y procesamiento</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-percent-line text-2xl text-green-600"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">IVA (21%)</h3>
            <p className="text-sm text-gray-600">Impuesto al valor agregado</p>
          </div>
        </div>

        {/* Calculadora de Tarifas */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculadora de Envío</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Peso del Envío</label>
              <select
                value={calculator.weight}
                onChange={(e) => setCalculator({ ...calculator, weight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={0}>Seleccionar peso...</option>
                {weightRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provincia Destino</label>
              <select
                value={calculator.province}
                onChange={(e) => setCalculator({ ...calculator, province: e.target.value })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar provincia...</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor Declarado ($)</label>
              <input
                type="number"
                min="100"
                value={calculator.declaredValue}
                onChange={(e) => setCalculator({ ...calculator, declaredValue: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={calcularTarifa}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Calcular Costo
            </button>
          </div>

          {resultado.total > 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle del Costo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Flete base:</span>
                    <span>${resultado.flete.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seguro (10%):</span>
                    <span>${resultado.seguro.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastos admin (15%):</span>
                    <span>${resultado.gastos.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (21%):</span>
                    <span>${resultado.iva.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">
                      ${resultado.total.toLocaleString('es-AR')}
                    </p>
                    <p className="text-sm text-gray-600">Total a pagar</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Tarifas */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Tabla de Tarifas por Peso y Provincia</h2>
            <p className="text-sm text-gray-600">Precios base en pesos argentinos</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left">Rango de Peso</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Provincia</th>
                  <th className="border border-gray-300 px-4 py-3 text-right">Precio Base</th>
                  <th className="border border-gray-300 px-4 py-3 text-right">Seguro (%)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right">Admin (%)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right">IVA (%)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map((tariff) => (
                  <tr key={tariff.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">
                      {editingId === tariff.id ? (
                        <div className="flex space-x-2 items-center">
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.weightFrom || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, weightFrom: parseFloat(e.target.value) })
                            }
                            className="w-16 px-2 py-1 border rounded text-sm"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.weightTo || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, weightTo: parseFloat(e.target.value) })
                            }
                            className="w-16 px-2 py-1 border rounded text-sm"
                          />
                          <span>kg</span>
                        </div>
                      ) : (
                        `${tariff.weightFrom}${tariff.weightFrom === 0 ? '' : ''} - ${tariff.weightTo}kg`
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      {editingId === tariff.id ? (
                        <select
                          value={editForm.province || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, province: e.target.value })
                          }
                          className="w-full px-2 py-1 pr-8 border rounded text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {provinces.map(province => (
                            <option key={province} value={province}>{province}</option>
                          ))}
                        </select>
                      ) : (
                        tariff.province
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {editingId === tariff.id ? (
                        <input
                          type="number"
                          value={editForm.basePrice || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) })
                          }
                          className="w-24 px-2 py-1 border rounded text-sm text-right"
                        />
                      ) : (
                        `$${tariff.basePrice.toLocaleString('es-AR')}`
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {editingId === tariff.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.insuranceRate ? editForm.insuranceRate * 100 : ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              insuranceRate: parseFloat(e.target.value) / 100,
                            })
                          }
                          className="w-16 px-2 py-1 border rounded text-sm text-right"
                        />
                      ) : (
                        `${(tariff.insuranceRate * 100)}%`
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {editingId === tariff.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.adminFeeRate ? editForm.adminFeeRate * 100 : ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              adminFeeRate: parseFloat(e.target.value) / 100,
                            })
                          }
                          className="w-16 px-2 py-1 border rounded text-sm text-right"
                        />
                      ) : (
                        `${(tariff.adminFeeRate * 100)}%`
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {editingId === tariff.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.ivaRate ? editForm.ivaRate * 100 : ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              ivaRate: parseFloat(e.target.value) / 100,
                            })
                          }
                          className="w-16 px-2 py-1 border rounded text-sm text-right"
                        />
                      ) : (
                        `${(tariff.ivaRate * 100)}%`
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {editingId === tariff.id ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <i className="ri-check-line"></i>
                            </div>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <i className="ri-close-line"></i>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(tariff)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-edit-line"></i>
                          </div>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                <i className="ri-information-line text-yellow-600"></i>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Información Importante:</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Los precios son válidos para todo el territorio argentino</li>
                  <li>• El seguro cubre el valor declarado del envío</li>
                  <li>• Los gastos administrativos incluyen manejo y procesamiento</li>
                  <li>• El IVA se aplica sobre el subtotal (flete + seguro + gastos)</li>
                  <li>• El termosellado opcional no puede exceder el 10% del flete</li>
                  <li>• Tarifas vigentes desde enero 2024</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
