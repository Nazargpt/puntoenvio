export type Transportist = {
  id: string;
  nombre: string;
};


// Original code:
export interface Order {
  id: string;
  trackingCode: string;
  sender: {
    name: string;
    dni: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  recipient: {
    name: string;
    dni: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  package: {
    weight: number;
    quantity: number;
    declaredValue: number;
    serviceType: string;
    description: string;
    transportist?: string;
  };
  costs: {
    freight: number;
    insurance: number;
    adminFees: number;
    iva: number;
    thermoseal: number;
    total: number;
  };
  status: 'pendiente-recoleccion' | 'en-transito' | 'en-agencia-destino' | 'entregado';
  assignedAgency?: string;
  assignedTransportist?: string;
  route?: string;
  history: {
    date: string;
    status: string;
    location: string;
    description: string;
  }[];
  createdAt: string;
}

export interface Agency {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  schedule: string;
  city: string;
  province: string;
  manager: string;
  zone: string;
  username?: string;
  password?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  commissions?: {
    encomiendaCobrOrigen: number;
    encomiendaPagoDestino: number;
    ecommRecibido: number;
    ecommEntregado: number;
    termosellado: number;
  };
  creditLimit?: number;
  currentCredit?: number;
  weeklySettlementDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  lastSettlementDate?: string;
  isActive?: boolean;
}

export interface Transportist {
  id: string;
  code: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  license: string;
  zones: string[];
  type: 'local' | 'larga-distancia';
  company?: string;
  username?: string;
  password?: string;
  paymentRate?: {
    weightScales: Array<{
      weightFrom: number;
      weightTo: number;
      pricePerPackage: number;
    }>;
    deliveryBonus: number;
  };
}

export interface Tariff {
  id: string;
  weightFrom: number;
  weightTo: number;
  province: string;
  zone?: string;
  basePrice: number;
  insuranceRate: number;
  adminFeeRate: number;
  ivaRate: number;
  serviceType?: string;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  transportistId: string;
  agencyIds: string[];
  orderIds: string[];
  createdAt: string;
  status: 'planificada' | 'en-curso' | 'completada';
}

export interface RouteSheet {
  id: string;
  code: string;
  city: string;
  province: string;
  agencyId: string;
  transportistId?: string;
  orderIds: string[];
  status: 'pendiente' | 'asignada' | 'en-curso' | 'completada';
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
}

export interface Settlement {
  id: string;
  agencyId: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalCommissions: number;
  netAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  generatedAt: string;
  dueDate: string;
  paymentProof?: {
    filename: string;
    uploadedAt: string;
    url: string;
  };
  orderIds: string[];
}

// Storage functions
export const saveOrder = (order: Order) => {
  const orders = getOrders();
  // Auto-asignar agencia al crear la orden
  const assignedAgency = findNearestAgency(order.recipient.city, order.recipient.province);
  if (assignedAgency) {
    order.assignedAgency = assignedAgency.id;
  }
  orders.push(order);
  localStorage.setItem('puntoenvio-orders', JSON.stringify(orders));
};

export const getOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('puntoenvio-orders');
  return stored ? JSON.parse(stored) : [];
};

export const getOrderByTracking = (trackingCode: string): Order | null => {
  const orders = getOrders();
  return orders.find(order => order.trackingCode === trackingCode) || null;
};

export const updateOrderStatus = (trackingCode: string, status: Order['status'], location: string, description: string) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.trackingCode === trackingCode);

  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    orders[orderIndex].history.unshift({
      date: new Date().toISOString(),
      status,
      location,
      description
    });
    localStorage.setItem('puntoenvio-orders', JSON.stringify(orders));
  }
};

export const generateTrackingCode = (): string => {
  const prefix = 'PE';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// *** NUEVAS FUNCIONES PARA LÓGICA DE ZONAS ***
// Encontrar la agencia más cercana basada en localidad y provincia
export const findNearestAgency = (city: string, province: string): Agency | null => {
  const agencies = getAgencies();

  // Buscar agencia exacta en la misma ciudad y provincia
  let nearestAgency = agencies.find(agency =>
    agency.city.toLowerCase() === city.toLowerCase() &&
    agency.province.toLowerCase() === province.toLowerCase()
  );

  // Si no encuentra exacta, buscar en la misma provincia
  if (!nearestAgency) {
    nearestAgency = agencies.find(agency =>
      agency.province.toLowerCase() === province.toLowerCase()
    );
  }

  // Como último recurso, devolver la primera agencia disponible
  if (!nearestAgency && agencies.length > 0) {
    nearestAgency = agencies[0];
  }

  return nearestAgency || null;
};

// Encontrar transportistas disponibles para una zona específica
export const findAvailableTransportists = (city: string, province: string, serviceType?: string): Transportist[] => {
  const transportists = getTransportists();

  return transportists.filter(transportist => {
    // Para transportistas locales: verificar si la zona específica está en su cobertura
    if (transportist.type === 'local') {
      return transportist.zones.some(zone =>
        zone.toLowerCase().includes(city.toLowerCase()) ||
        zone.toLowerCase().includes(province.toLowerCase())
      );
    }

    // Para transportistas de larga distancia: verificar si la provincia está en su cobertura
    if (transportist.type === 'larga-distancia') {
      return transportist.zones.some(zone =>
        zone.toLowerCase().includes(province.toLowerCase())
      );
    }

    return false;
  });
};

// Auto-asignar transportista basado en las zonas de cobertura
export const autoAssignTransportist = (order: Order): Transportist | null => {
  const availableTransportists = findAvailableTransportists(
    order.recipient.city,
    order.recipient.province,
    order.package.serviceType
  );

  if (availableTransportists.length === 0) {
    return null;
  }

  // Priorizar transportistas locales para entregas en la misma zona
  const localTransportists = availableTransportists.filter(t => t.type === 'local');
  if (localTransportists.length > 0) {
    // Seleccionar el que tenga menos carga (simplificado: el primero)
    return localTransportists[0];
  }

  // Si no hay locales, usar larga distancia
  return availableTransportists[0];
};

// Obtener órdenes por zona de cobertura de transportista
export const getOrdersByTransportistZone = (transportistId: string): Order[] => {
  const transportist = getTransportists().find(t => t.id === transportistId);
  if (!transportist) return [];

  const orders = getOrders();

  return orders.filter(order => {
    // Para transportistas locales: verificar zona exacta
    if (transportist.type === 'local') {
      return transportist.zones.some(zone =>
        zone.toLowerCase().includes(order.recipient.city.toLowerCase()) ||
        zone.toLowerCase().includes(order.recipient.province.toLowerCase())
      );
    }

    // Para transportistas de larga distancia: verificar provincia
    if (transportist.type === 'larga-distancia') {
      return transportist.zones.some(zone =>
        zone.toLowerCase().includes(order.recipient.province.toLowerCase())
      );
    }

    return false;
  });
};

// Generar rutas automáticas basadas en las zonas del transportista
export const generateAutomaticRoutes = (transportistId: string): Route[] => {
  const transportist = getTransportists().find(t => t.id === transportistId);
  if (!transportist) return [];

  const availableOrders = getOrdersByTransportistZone(transportistId).filter(order =>
    order.status === 'pendiente-recoleccion' && !order.assignedTransportist
  );

  if (availableOrders.length === 0) return [];

  const routes: Route[] = [];
  const existingRoutes = getRoutes();

  // Para transportistas de larga distancia: crear rutas interprovinciales
  if (transportist.type === 'larga-distancia') {
    const ordersByProvince = availableOrders.reduce((acc, order) => {
      const originKey = order.sender.province;
      const destKey = order.recipient.province;

      // Solo crear rutas interprovinciales (origen diferente al destino)
      if (originKey !== destKey) {
        const routeKey = `${originKey}-${destKey}`;
        if (!acc[routeKey]) {
          acc[routeKey] = {
            origin: originKey,
            destination: destKey,
            orders: [],
            stops: new Set<string>()
          };
        }
        acc[routeKey].orders.push(order);

        // Agregar ciudades intermedias como paradas potenciales
        if (order.sender.city !== originKey) {
          acc[routeKey].stops.add(order.sender.city);
        }
        if (order.recipient.city !== destKey) {
          acc[routeKey].stops.add(order.recipient.city);
        }
      }

      return acc;
    }, {} as Record<string, { origin: string, destination: string, orders: Order[], stops: Set<string> }>);

    Object.entries(ordersByProvince).forEach(([routeKey, routeData]) => {
      if (routeData.orders.length > 0) {
        const routeNumber = existingRoutes.length + routes.length + 1;
        const stops = Array.from(routeData.stops).slice(0, 5); // Máximo 5 paradas

        const route: Route = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          code: `R${routeNumber.toString().padStart(4, '0')}`,
          name: `Ruta ${routeData.origin} - ${routeData.destination}`,
          origin: routeData.origin,
          destination: routeData.destination,
          stops,
          transportistId,
          agencyIds: [],
          orderIds: routeData.orders.map(o => o.id),
          createdAt: new Date().toISOString(),
          status: 'planificada'
        };

        // Buscar agencias en todas las ubicaciones de la ruta
        const allLocations = [route.origin, ...route.stops, route.destination];
        const routeAgencies = getAgencies().filter(agency =>
          allLocations.some(location =>
            agency.province.toLowerCase().includes(location.toLowerCase()) ||
            agency.city.toLowerCase().includes(location.toLowerCase())
          )
        );
        route.agencyIds = routeAgencies.map(a => a.id);

        routes.push(route);
      }
    });
  }

  // Para transportistas locales: crear rutas por zona
  else if (transportist.type === 'local') {
    const ordersByZone = availableOrders.reduce((acc, order) => {
      const zoneKey = `${order.recipient.city}-${order.recipient.province}`;
      if (!acc[zoneKey]) {
        acc[zoneKey] = {
          city: order.recipient.city,
          province: order.recipient.province,
          orders: []
        };
      }
      acc[zoneKey].orders.push(order);
      return acc;
    }, {} as Record<string, { city: string, province: string, orders: Order[] }>);

    Object.entries(ordersByZone).forEach(([zoneKey, zoneData]) => {
      if (zoneData.orders.length > 0) {
        const routeNumber = existingRoutes.length + routes.length + 1;

        // Para rutas locales, el origen es la zona base del transportista
        const origin = transportist.zones[0];
        const destination = zoneData.city;

        // Generar paradas intermedias basadas en las direcciones de entrega
        const uniqueAreas = [...new Set(zoneData.orders.map(order => {
          const address = order.recipient.address;
          if (address) {
            // Extraer posibles zonas/barrios de la dirección
            const parts = address.split(', ');
            return parts[0].trim();
          }
          return '';
        }).filter(Boolean))].slice(0, 3); // Máximo 3 paradas

        const route: Route = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          code: `R${routeNumber.toString().padStart(4, '0')}`,
          name: `Ruta Local ${destination}`,
          origin,
          destination,
          stops: uniqueAreas,
          transportistId,
          agencyIds: [],
          orderIds: zoneData.orders.map(o => o.id),
          createdAt: new Date().toISOString(),
          status: 'planificada'
        };

        // Buscar agencias en la zona
        const agencies = getAgencies().filter(agency =>
          agency.city.toLowerCase() === destination.toLowerCase() &&
          agency.province.toLowerCase() === zoneData.province.toLowerCase()
        );
        route.agencyIds = agencies.map(a => a.id);

        routes.push(route);
      }
    });
  }

  return routes;
};

// Agencies
export const saveAgencies = (agencies: Agency[]) => {
  localStorage.setItem('puntoenvio-agencies', JSON.stringify(agencies));
};

export const getAgencies = (): Agency[] => {
  if (typeof window === 'undefined') return getDefaultAgencies();
  const stored = localStorage.getItem('puntoenvio-agencies');
  return stored ? JSON.parse(stored) : getDefaultAgencies();
};

export const getDefaultAgencies = (): Agency[] => [
  {
    id: '1',
    code: 'PE001',
    name: 'PuntoEnvío Centro CABA',
    address: 'Av. Corrientes 1234',
    phone: '011-4567-8901',
    email: 'centro@puntoenvio.com.ar',
    schedule: '8:00 - 18:00',
    city: 'Ciudad Autónoma de Buenos Aires',
    province: 'Ciudad Autónoma de Buenos Aires',
    manager: 'Juan Pérez',
    zone: 'Centro',
    username: 'pe001',
    password: 'centro123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 50000,
    currentCredit: 0,
    weeklySettlementDay: 'friday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '2',
    code: 'PE002',
    name: 'PuntoEnvío Vicente López',
    address: 'Av. Maipú 2345',
    phone: '011-4567-8902',
    email: 'vicentelopez@puntoenvio.com.ar',
    schedule: '9:00 - 19:00',
    city: 'Vicente López',
    province: 'Buenos Aires',
    manager: 'María García',
    zone: 'Norte',
    username: 'pe002',
    password: 'vicentelopez123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 75000,
    currentCredit: 0,
    weeklySettlementDay: 'thursday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '3',
    code: 'PE003',
    name: 'PuntoEnvío La Matanza',
    address: 'Av. San Martín 3456',
    phone: '011-4567-8903',
    email: 'lamatanza@puntoenvio.com.ar',
    schedule: '8:30 - 18:30',
    city: 'La Matanza',
    province: 'Buenos Aires',
    manager: 'Carlos López',
    zone: 'Oeste',
    username: 'pe003',
    password: 'lamatanza123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 40000,
    currentCredit: 0,
    weeklySettlementDay: 'monday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '4',
    code: 'PE004',
    name: 'PuntoEnvío Avellaneda',
    address: 'Mitre 890',
    phone: '011-4567-8904',
    email: 'avellaneda@puntoenvio.com.ar',
    schedule: '8:00 - 18:00',
    city: 'Avellaneda',
    province: 'Buenos Aires',
    manager: 'Ana Martínez',
    zone: 'Sur',
    username: 'pe004',
    password: 'avellaneda123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 60000,
    currentCredit: 0,
    weeklySettlementDay: 'wednesday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '5',
    code: 'PE005',
    name: 'PuntoEnvío Quilmes',
    address: 'Rivadavia 1234',
    phone: '011-4567-8905',
    email: 'quilmes@puntoenvio.com.ar',
    schedule: '8:30 - 17:30',
    city: 'Quilmes',
    province: 'Buenos Aires',
    manager: 'Luis Rodríguez',
    zone: 'Sur',
    username: 'pe005',
    password: 'quilmes123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 45000,
    currentCredit: 0,
    weeklySettlementDay: 'tuesday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '6',
    code: 'PE006',
    name: 'PuntoEnvío Córdoba Centro',
    address: 'San Martín 2345',
    phone: '0351-456-7890',
    email: 'cordoba@puntoenvio.com.ar',
    schedule: '8:00 - 18:00',
    city: 'Córdoba',
    province: 'Córdoba',
    manager: 'Patricia Silva',
    zone: 'Centro',
    username: 'pe006',
    password: 'cordoba123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 80000,
    currentCredit: 0,
    weeklySettlementDay: 'friday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '7',
    code: 'PE007',
    name: 'PuntoEnvío Villa Carlos Paz',
    address: 'Av. San Martín 3456',
    phone: '03541-456-789',
    email: 'villacarlospaz@puntoenvio.com.ar',
    schedule: '9:00 - 19:00',
    city: 'Villa Carlos Paz',
    province: 'Córdoba',
    manager: 'Roberto Mendoza',
    zone: 'Turística',
    username: 'pe007',
    password: 'villacarlospaz123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 35000,
    currentCredit: 0,
    weeklySettlementDay: 'saturday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '8',
    code: 'PE008',
    name: 'PuntoEnvío Río Cuarto',
    address: 'Constitución 4567',
    phone: '0358-456-7891',
    email: 'riocuarto@puntoenvio.com.ar',
    schedule: '8:30 - 18:30',
    city: 'Río Cuarto',
    province: 'Córdoba',
    manager: 'Elena Fernández',
    zone: 'Sur',
    username: 'pe008',
    password: 'riocuarto123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 55000,
    currentCredit: 0,
    weeklySettlementDay: 'wednesday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '9',
    code: 'PE009',
    name: 'PuntoEnvío Santa Fe Capital',
    address: 'San Martín 5678',
    phone: '0342-456-7892',
    email: 'santafe@puntoenvio.com.ar',
    schedule: '8:00 - 18:00',
    city: 'Santa Fe',
    province: 'Santa Fe',
    manager: 'Jorge Ramírez',
    zone: 'Centro',
    username: 'pe009',
    password: 'santafe123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 65000,
    currentCredit: 0,
    weeklySettlementDay: 'thursday',
    lastSettlementDate: '',
    isActive: true
  },
  {
    id: '10',
    code: 'PE010',
    name: 'PuntoEnvío Rosario',
    address: 'Pellegrini 6789',
    phone: '0341-456-7893',
    email: 'rosario@puntoenvio.com.ar',
    schedule: '8:30 - 19:00',
    city: 'Rosario',
    province: 'Santa Fe',
    manager: 'Mónica Torres',
    zone: 'Centro',
    username: 'pe010',
    password: 'rosario123',
    commissions: {
      encomiendaCobrOrigen: 5.0,
      encomiendaPagoDestino: 3.0,
      ecommRecibido: 2.5,
      ecommEntregado: 4.0,
      termosellado: 1.5
    },
    creditLimit: 90000,
    currentCredit: 0,
    weeklySettlementDay: 'friday',
    lastSettlementDate: '',
    isActive: true
  }
];

// Transportists
export const saveTransportists = (transportists: Transportist[]) => {
  localStorage.setItem('puntoenvio-transportists', JSON.stringify(transportists));
};

export const getTransportists = (): Transportist[] => {
  if (typeof window === 'undefined') return getDefaultTransportists();
  const stored = localStorage.getItem('puntoenvio-transportists');
  const transportists = stored ? JSON.parse(stored) : getDefaultTransportists();

  // Ensure all transportists have paymentRate
  return transportists.map(ensureTransportistPaymentRate);
};

export const ensureTransportistPaymentRate = (transportist: Transportist): Transportist => {
  if (!transportist.paymentRate) {
    return {
      ...transportist,
      paymentRate: {
        weightScales: [
          { weightFrom: 0, weightTo: 5, pricePerPackage: 6000 },
          { weightFrom: 5, weightTo: 10, pricePerPackage: 8000 },
          { weightFrom: 10, weightTo: 15, pricePerPackage: 10000 },
          { weightFrom: 15, weightTo: 20, pricePerPackage: 12000 },
          { weightFrom: 20, weightTo: 25, pricePerPackage: 15000 }
        ],
        deliveryBonus: 500
      }
    };
  }

  // Ensure all required properties exist
  const paymentRate = {
    weightScales: transportist.paymentRate.weightScales || [
      { weightFrom: 0, weightTo: 5, pricePerPackage: 6000 },
      { weightFrom: 5, weightTo: 10, pricePerPackage: 8000 },
      { weightFrom: 10, weightTo: 15, pricePerPackage: 10000 },
      { weightFrom: 15, weightTo: 20, pricePerPackage: 12000 },
      { weightFrom: 20, weightTo: 25, pricePerPackage: 15000 }
    ],
    deliveryBonus: transportist.paymentRate.deliveryBonus || 500
  };

  return {
    ...transportist,
    paymentRate
  };
};

export const getDefaultTransportists = (): Transportist[] => [
  {
    id: '1',
    code: 'T001',
    name: 'Carlos Mendoza',
    dni: '12345678',
    phone: '11-1234-5678',
    email: 'carlos@puntoenvio.com.ar',
    vehicle: 'Ford Transit',
    plate: 'ABC123',
    license: 'B1',
    zones: ['Ciudad Autónoma de Buenos Aires', 'La Matanza', 'Vicente López'],
    type: 'local',
    username: 'carlos.mendoza',
    password: 'transport123',
    paymentRate: {
      weightScales: [
        { weightFrom: 0, weightTo: 5, pricePerPackage: 6000 },
        { weightFrom: 5, weightTo: 10, pricePerPackage: 8000 },
        { weightFrom: 10, weightTo: 15, pricePerPackage: 10000 },
        { weightFrom: 15, weightTo: 20, pricePerPackage: 12000 },
        { weightFrom: 20, weightTo: 25, pricePerPackage: 15000 }
      ],
      deliveryBonus: 500
    }
  },
  {
    id: '2',
    code: 'T002',
    name: 'Roberto Silva',
    dni: '23456789',
    phone: '11-2345-6789',
    email: 'roberto@puntoenvio.com.ar',
    vehicle: 'Mercedes Sprinter',
    plate: 'DEF456',
    license: 'C1',
    zones: ['Ciudad Autónoma de Buenos Aires', 'Avellaneda', 'Quilmes'],
    type: 'local',
    username: 'roberto.silva',
    password: 'transport456',
    paymentRate: {
      weightScales: [
        { weightFrom: 0, weightTo: 5, pricePerPackage: 6500 },
        { weightFrom: 5, weightTo: 10, pricePerPackage: 8500 },
        { weightFrom: 10, weightTo: 15, pricePerPackage: 11000 },
        { weightFrom: 15, weightTo: 20, pricePerPackage: 13000 },
        { weightFrom: 20, weightTo: 25, pricePerPackage: 16000 }
      ],
      deliveryBonus: 600
    }
  },
  {
    id: '3',
    code: 'T003',
    name: 'Miguel Torres',
    dni: '34567890',
    phone: '351-345-6789',
    email: 'miguel@puntoenvio.com.ar',
    vehicle: 'Iveco Daily',
    plate: 'GHI789',
    license: 'C1',
    zones: ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto'],
    type: 'local',
    username: 'miguel.torres',
    password: 'transport789',
    paymentRate: {
      weightScales: [
        { weightFrom: 0, weightTo: 5, pricePerPackage: 5800 },
        { weightFrom: 5, weightTo: 10, pricePerPackage: 7800 },
        { weightFrom: 10, weightTo: 15, pricePerPackage: 9800 },
        { weightFrom: 15, weightTo: 20, pricePerPackage: 11800 },
        { weightFrom: 20, weightTo: 25, pricePerPackage: 14500 }
      ],
      deliveryBonus: 400
    }
  },
  {
    id: '4',
    code: 'T004',
    name: 'Express Logística SRL',
    dni: '30123456789',
    phone: '341-456-7890',
    email: 'operaciones@expresslogistica.com.ar',
    vehicle: 'Volvo FH',
    plate: 'JKL012',
    license: 'E1',
    zones: ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Entre Ríos'],
    type: 'larga-distancia',
    company: 'Express Logística SRL',
    username: 'express.logistica',
    password: 'express2024',
    paymentRate: {
      weightScales: [
        { weightFrom: 0, weightTo: 5, pricePerPackage: 5000 },
        { weightFrom: 5, weightTo: 10, pricePerPackage: 7000 },
        { weightFrom: 10, weightTo: 15, pricePerPackage: 9000 },
        { weightFrom: 15, weightTo: 20, pricePerPackage: 11000 },
        { weightFrom: 20, weightTo: 25, pricePerPackage: 13500 },
        { weightFrom: 25, weightTo: 50, pricePerPackage: 18000 }
      ],
      deliveryBonus: 800
    }
  },
  {
    id: '5',
    code: 'T005',
    name: 'TransArg SA',
    dni: '30234567890',
    phone: '261-567-8901',
    email: 'despacho@transarg.com.ar',
    vehicle: 'Scania R450',
    plate: 'MNO345',
    license: 'E1',
    zones: ['Mendoza', 'San Luis', 'La Pampa', 'Neuquén', 'Río Negro'],
    type: 'larga-distancia',
    company: 'TransArg SA',
    username: 'transarg.sa',
    password: 'transarg2024',
    paymentRate: {
      weightScales: [
        { weightFrom: 0, weightTo: 5, pricePerPackage: 4800 },
        { weightFrom: 5, weightTo: 10, pricePerPackage: 6800 },
        { weightFrom: 10, weightTo: 15, pricePerPackage: 8800 },
        { weightFrom: 15, weightTo: 20, pricePerPackage: 10800 },
        { weightFrom: 20, weightTo: 25, pricePerPackage: 13000 },
        { weightFrom: 25, weightTo: 50, pricePerPackage: 17500 }
      ],
      deliveryBonus: 700
    }
  }
];

// Tariffs
export const saveTariffs = (tariffs: Tariff[]) => {
  localStorage.setItem('puntoenvio-tariffs', JSON.stringify(tariffs));
};

export const getTariffs = (): Tariff[] => {
  if (typeof window === 'undefined') return getDefaultTariffs();
  const stored = localStorage.getItem('puntoenvio-tariffs');
  return stored ? JSON.parse(stored) : getDefaultTariffs();
};

export const getDefaultTariffs = (): Tariff[] => [
  // CABA y GBA
  { id: '1', weightFrom: 0, weightTo: 5, province: 'Ciudad Autónoma de Buenos Aires', basePrice: 2500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '2', weightFrom: 5, weightTo: 10, province: 'Ciudad Autónoma de Buenos Aires', basePrice: 3500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '3', weightFrom: 10, weightTo: 15, province: 'Ciudad Autónoma de Buenos Aires', basePrice: 5000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '4', weightFrom: 15, weightTo: 20, province: 'Ciudad Autónoma de Buenos Aires', basePrice: 6500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '5', weightFrom: 20, weightTo: 25, province: 'Ciudad Autónoma de Buenos Aires', basePrice: 8000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  // Buenos Aires
  { id: '6', weightFrom: 0, weightTo: 5, province: 'Buenos Aires', basePrice: 2800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '7', weightFrom: 5, weightTo: 10, province: 'Buenos Aires', basePrice: 4000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '8', weightFrom: 10, weightTo: 15, province: 'Buenos Aires', basePrice: 5500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '9', weightFrom: 15, weightTo: 20, province: 'Buenos Aires', basePrice: 7000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '10', weightFrom: 20, weightTo: 25, province: 'Buenos Aires', basePrice: 8500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  // Córdoba
  { id: '11', weightFrom: 0, weightTo: 5, province: 'Córdoba', basePrice: 3800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '12', weightFrom: 5, weightTo: 10, province: 'Córdoba', basePrice: 5200, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '13', weightFrom: 10, weightTo: 15, province: 'Córdoba', basePrice: 6800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '14', weightFrom: 15, weightTo: 20, province: 'Córdoba', basePrice: 8200, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '15', weightFrom: 20, weightTo: 25, province: 'Córdoba', basePrice: 9800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  // Santa Fe
  { id: '16', weightFrom: 0, weightTo: 5, province: 'Santa Fe', basePrice: 3500, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '17', weightFrom: 5, weightTo: 10, province: 'Santa Fe', basePrice: 4800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '18', weightFrom: 10, weightTo: 15, province: 'Santa Fe', basePrice: 6200, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '19', weightFrom: 15, weightTo: 20, province: 'Santa Fe', basePrice: 7600, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '20', weightFrom: 20, weightTo: 25, province: 'Santa Fe', basePrice: 9000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  // Mendoza
  { id: '21', weightFrom: 0, weightTo: 5, province: 'Mendoza', basePrice: 4200, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '22', weightFrom: 5, weightTo: 10, province: 'Mendoza', basePrice: 5800, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '23', weightFrom: 10, weightTo: 15, province: 'Mendoza', basePrice: 7400, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '24', weightFrom: 15, weightTo: 20, province: 'Mendoza', basePrice: 9000, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 },
  { id: '25', weightFrom: 20, weightTo: 25, province: 'Mendoza', basePrice: 10600, insuranceRate: 0.10, adminFeeRate: 0.15, ivaRate: 0.21 }
];

// Routes
export const saveRoutes = (routes: Route[]) => {
  localStorage.setItem('puntoenvio-routes', JSON.stringify(routes));
};

export const getRoutes = (): Route[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('puntoenvio-routes');
  return stored ? JSON.parse(stored) : [];
};

export const generateRoute = (origin: string, destination: string, stops: string[], transportistId: string): Route => {
  const routes = getRoutes();
  const routeNumber = routes.length + 1;

  // Buscar órdenes disponibles para esta ruta
  const availableOrders = getAvailableOrdersForRoute(origin, destination, stops);

  // Buscar agencias en origen, paradas y destino
  const allLocations = [origin, ...stops, destination];
  const routeAgencies = getAgencies().filter(agency =>
    allLocations.some(location =>
      agency.province.toLowerCase().includes(location.toLowerCase()) ||
      agency.city.toLowerCase().includes(location.toLowerCase())
    )
  );

  const route: Route = {
    id: Date.now().toString(),
    code: `R${routeNumber.toString().padStart(4, '0')}`,
    name: `Ruta ${origin} - ${destination}`,
    origin,
    destination,
    stops,
    transportistId,
    agencyIds: routeAgencies.map(a => a.id),
    orderIds: availableOrders.map(o => o.id),
    createdAt: new Date().toISOString(),
    status: 'planificada'
  };

  // Asignar órdenes automáticamente a la ruta
  if (availableOrders.length > 0) {
    const orders = getOrders();
    availableOrders.forEach(availableOrder => {
      const orderIndex = orders.findIndex(order => order.id === availableOrder.id);
      if (orderIndex !== -1) {
        orders[orderIndex].route = route.id;
        orders[orderIndex].assignedTransportist = transportistId;
        orders[orderIndex].status = 'en-transito';
        orders[orderIndex].history.unshift({
          date: new Date().toISOString(),
          status: 'Asignado a ruta',
          location: origin,
          description: `Orden asignada automáticamente a ruta ${route.code}`
        });
      }
    });
    localStorage.setItem('puntoenvio-orders', JSON.stringify(orders));
  }

  return route;
};

export const calculateShippingCost = (weight: number, province: string, declaredValue: number, thermoseal: number = 0) => {
  const tariffs = getTariffs();
  const applicableTariff = tariffs.find(t =>
    weight >= t.weightFrom && weight <= t.weightTo && t.province === province
  ) || tariffs.find(t =>
    weight >= t.weightFrom && weight <= t.weightTo
  ) || tariffs[0];

  const freight = applicableTariff.basePrice;
  const insurance = declaredValue * applicableTariff.insuranceRate;
  const adminFees = freight * applicableTariff.adminFeeRate;
  const subtotal = freight + insurance + adminFees + thermoseal;
  const iva = subtotal * applicableTariff.ivaRate;
  const total = subtotal + iva;

  return {
    freight,
    insurance,
    adminFees,
    iva,
    thermoseal,
    total
  };
};

// Route Sheets - MEJORADO CON LÓGICA DE ZONAS
export const saveRouteSheets = (routeSheets: RouteSheet[]) => {
  localStorage.setItem('puntoenvio-route-sheets', JSON.stringify(routeSheets));
};

export const getRouteSheets = (): RouteSheet[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('puntoenvio-route-sheets');
  return stored ? JSON.parse(stored) : [];
};

export const generateRouteSheets = (agencyId: string): RouteSheet[] => {
  const agency = getAgencies().find(a => a.id === agencyId);

  if (!agency) return [];

  // Buscar transportistas que cubran la zona de la agencia
  const availableTransportists = findAvailableTransportists(agency.city, agency.province);

  // Obtener órdenes pendientes que deberían ser manejadas por esta agencia
  const orders = getOrders().filter(order => {
    // Órdenes donde el destinatario está en la zona de la agencia
    const isDestinationMatch = order.recipient.city.toLowerCase() === agency.city.toLowerCase() &&
                              order.recipient.province.toLowerCase() === agency.province.toLowerCase();

    // Órdenes donde el remitente está en la zona de la agencia
    const isOriginMatch = order.sender.city.toLowerCase() === agency.city.toLowerCase() &&
                         order.sender.province.toLowerCase() === agency.province.toLowerCase();

    return (isDestinationMatch || isOriginMatch) &&
           order.status === 'pendiente-recoleccion' && !order.assignedTransportist && !order.route;
  });

  if (orders.length === 0) return [];

  // Agrupar órdenes por destino final para optimizar rutas
  const groupedOrders = orders.reduce((acc, order) => {
    const key = `${order.recipient.city}-${order.recipient.province}`;
    if (!acc[key]) {
      acc[key] = {
        city: order.recipient.city,
        province: order.recipient.province,
        orders: []
      };
    }
    acc[key].orders.push(order);
    return acc;
  }, {} as Record<string, { city: string, province: string, orders: Order[] }>);

  // Crear hojas de ruta inteligentes
  const routeSheets: RouteSheet[] = [];
  const existingSheets = getRouteSheets();
  let sheetCounter = existingSheets.length + 1;

  Object.entries(groupedOrders).forEach(([key, group]) => {
    // Verificar si ya existe una hoja de ruta activa para esta zona
    const existingSheet = existingSheets.find(sheet =>
      sheet.city === group.city &&
      sheet.province === group.province &&
      sheet.agencyId === agencyId &&
      (sheet.status === 'pendiente' || sheet.status === 'asignada' || sheet.status === 'en-curso')
    );

    if (!existingSheet && group.orders.length > 0) {
      const routeSheet: RouteSheet = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        code: `HR${sheetCounter.toString().padStart(4, '0')}`,
        city: group.city,
        province: group.province,
        agencyId,
        orderIds: group.orders.map(order => order.id),
        status: 'pendiente',
        createdAt: new Date().toISOString()
      };

      // Auto-asignar transportista si hay uno disponible
      const suitableTransportist = availableTransportists.find(t => {
        if (t.type === 'local') {
          return t.zones.some(zone =>
            zone.toLowerCase().includes(group.city.toLowerCase()) ||
            zone.toLowerCase().includes(group.province.toLowerCase())
          );
        } else {
          return t.zones.some(zone =>
            zone.toLowerCase().includes(group.province.toLowerCase())
          );
        }
      });

      if (suitableTransportist) {
        routeSheet.transportistId = suitableTransportist.id;
        routeSheet.status = 'asignada';
        routeSheet.assignedAt = new Date().toISOString();

        // Actualizar órdenes con el transportista asignado
        group.orders.forEach(order => {
          order.assignedTransportist = suitableTransportist.id;
          order.assignedAgency = agencyId;
          order.status = 'en-transito';
          order.history.unshift({
            date: new Date().toISOString(),
            status: 'Asignado a transportista',
            location: `${agency.city}, ${agency.province}`,
            description: `Orden asignada automáticamente a ${suitableTransportist.name} - Hoja de ruta ${routeSheet.code}`
          });
        });

        // Guardar órdenes actualizadas
        const allOrders = getOrders();
        const updatedOrders = allOrders.map(order => {
          const updatedOrder = group.orders.find(o => o.id === order.id);
          return updatedOrder || order;
        });
        localStorage.setItem('puntoenvio-orders', JSON.stringify(updatedOrders));
      }

      routeSheets.push(routeSheet);
      sheetCounter++;
    }
  });

  if (routeSheets.length > 0) {
    const allSheets = [...existingSheets, ...routeSheets];
    saveRouteSheets(allSheets);
  }

  return routeSheets;
};

export const createTestOrders = () => {
  const testOrders: Order[] = [
    {
      id: '1001',
      trackingCode: 'PE240001TEST',
      sender: {
        name: 'María González',
        dni: '35468291',
        phone: '11-4567-8901',
        email: 'maria.gonzalez@email.com',
        address: 'Av. Corrientes 1234, Piso 5 Depto B',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Ciudad Autónoma de Buenos Aires',
        postalCode: 'C1043AAR'
      },
      recipient: {
        name: 'Carlos Rodríguez',
        dni: '28745639',
        phone: '351-456-7890',
        email: 'carlos.rodriguez@email.com',
        address: 'San Martín 2340, Centro',
        city: 'Córdoba',
        province: 'Córdoba',
        postalCode: 'X5000ABC'
      },
      package: {
        weight: 5,
        quantity: 1,
        declaredValue: 25000,
        serviceType: 'Domicilio a Domicilio',
        description: 'Documentos importantes y productos electrónicos',
        transportist: 'Carlos Mendoza'
      },
      costs: {
        freight: 3800,
        insurance: 2500,
        adminFees: 570,
        iva: 1438.8,
        thermoseal: 0,
        total: 8308.8
      },
      status: 'en-transito',
      assignedAgency: '6',
      assignedTransportist: '3',
      route: 'R0001',
      history: [
        {
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'En tránsito',
          location: 'Ciudad Autónoma de Buenos Aires, CABA',
          description: 'Paquete recogido por transportista y en camino al destino'
        },
        {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'Orden creada',
          location: 'Ciudad Autónoma de Buenos Aires, CABA',
          description: 'Orden de envío creada exitosamente'
        }
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1002',
      trackingCode: 'PE240002TEST',
      sender: {
        name: 'Ana López',
        dni: '42186357',
        phone: '341-789-0123',
        email: 'ana.lopez@email.com',
        address: 'Pellegrini 6789, Centro',
        city: 'Rosario',
        province: 'Santa Fe',
        postalCode: 'S2000ABC'
      },
      recipient: {
        name: 'Roberto Silva',
        dni: '31294758',
        phone: '11-2345-6789',
        email: 'roberto.silva@email.com',
        address: 'Av. Maipú 2345, 2do Piso',
        city: 'Vicente López',
        province: 'Buenos Aires',
        postalCode: 'B1602DEF'
      },
      package: {
        weight: 15,
        quantity: 2,
        declaredValue: 45000,
        serviceType: 'Agencia a Domicilio',
        description: 'Ropa y accesorios de temporada',
        transportist: 'Roberto Silva'
      },
      costs: {
        freight: 6200,
        insurance: 4500,
        adminFees: 930,
        iva: 2462.7,
        thermoseal: 620,
        total: 14712.7
      },
      status: 'en-agencia-destino',
      assignedAgency: '2',
      assignedTransportist: '1',
      history: [
        {
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'En agencia destino',
          location: 'PuntoEnvío Vicente López, Buenos Aires',
          description: 'Paquete llegó a agencia destino y disponible para entrega'
        },
        {
          date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'En tránsito',
          location: 'Rosario, Santa Fe',
          description: 'Paquete recogido por transportista'
        },
        {
          date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'Orden creada',
          location: 'Rosario, Santa Fe',
          description: 'Orden de envío creada exitosamente'
        }
      ],
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1003',
      trackingCode: 'PE240003TEST',
      sender: {
        name: 'Luis Martínez',
        dni: '38746529',
        phone: '261-567-8901',
        email: 'luis.martinez@email.com',
        address: 'San Martín 1234, Centro',
        city: 'Mendoza',
        province: 'Mendoza',
        postalCode: 'M5500ABC'
      },
      recipient: {
        name: 'Patricia Fernández',
        dni: '29847361',
        phone: '11-3456-7890',
        email: 'patricia.fernandez@email.com',
        address: 'Rivadavia 1234, Centro',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Ciudad Autónoma de Buenos Aires',
        postalCode: 'C1033AAB'
      },
      package: {
        weight: 10,
        quantity: 1,
        declaredValue: 68000,
        serviceType: 'Domicilio a Agencia',
        description: 'Equipos electrónicos y componentes',
        transportist: 'Express Logística SRL'
      },
      costs: {
        freight: 5800,
        insurance: 6800,
        adminFees: 870,
        iva: 2811.5,
        thermoseal: 580,
        total: 16861.5
      },
      status: 'entregado',
      assignedAgency: '1',
      assignedTransportist: '4',
      history: [
        {
          date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'Entregado al cliente',
          location: 'PuntoEnvío Centro CABA, CABA',
          description: 'Paquete entregado exitosamente al destinatario Patricia Fernández - Firma: P. Fernandez'
        },
        {
          date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'Llegada a agencia destino',
          location: 'PuntoEnvío Centro CABA, CABA',
          description: 'Paquete recibido en agencia destino y disponible para entrega al cliente'
        },
        {
          date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          status: 'En tránsito',
          location: 'Mendoza, Mendoza',
          description: 'Paquete recogido por transportista de larga distancia'
        },
        {
          date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          status: 'Orden creada',
          location: 'Mendoza, Mendoza',
          description: 'Orden de envío creada exitosamente'
        }
      ],
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1004',
      trackingCode: 'PE240004TEST',
      sender: {
        name: 'Diego Herrera',
        dni: '41856372',
        phone: '11-4567-1234',
        email: 'diego.herrera@email.com',
        address: 'Mitre 890, Centro',
        city: 'Avellaneda',
        province: 'Buenos Aires',
        postalCode: 'B1870ABC'
      },
      recipient: {
        name: 'Claudia Morales',
        dni: '33758429',
        phone: '351-678-9012',
        email: 'claudia.morales@email.com',
        address: 'Constitución 4567, Barrio Norte',
        city: 'Río Cuarto',
        province: 'Córdoba',
        postalCode: 'X5800DEF'
      },
      package: {
        weight: 25,
        quantity: 3,
        declaredValue: 95000,
        serviceType: 'Agencia a Agencia',
        description: 'Herramientas y materiales de construcción',
        transportist: 'Miguel Torres'
      },
      costs: {
        freight: 9800,
        insurance: 9500,
        adminFees: 1470,
        iva: 4357.0,
        thermoseal: 0,
        total: 25127.0
      },
      status: 'pendiente-recoleccion',
      assignedAgency: '8',
      assignedTransportist: '3',
      history: [
        {
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'Orden creada',
          location: 'Avellaneda, Buenos Aires',
          description: 'Orden de envío creada exitosamente'
        }
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1005',
      trackingCode: 'PE240005TEST',
      sender: {
        name: 'Elena Ruiz',
        dni: '27465839',
        phone: '342-890-1234',
        email: 'elena.ruiz@email.com',
        address: 'San Martín 5678, Centro',
        city: 'Santa Fe',
        province: 'Santa Fe',
        postalCode: 'S3000GHI'
      },
      recipient: {
        name: 'Andrés Castro',
        dni: '35674821',
        phone: '11-5678-9012',
        email: 'andres.castro@email.com',
        address: 'Rivadavia 1234, Centro',
        city: 'Quilmes',
        province: 'Buenos Aires',
        postalCode: 'B1878JKL'
      },
      package: {
        weight: 8,
        quantity: 1,
        declaredValue: 32000,
        serviceType: 'Domicilio a Domicilio',
        description: 'Productos artesanales y decorativos',
        transportist: 'TransArg SA'
      },
      costs: {
        freight: 4800,
        insurance: 3200,
        adminFees: 720,
        iva: 1811.0,
        thermoseal: 480,
        total: 11011.0
      },
      status: 'en-transito',
      assignedAgency: '5',
      assignedTransportist: '5',
      history: [
        {
          date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'En tránsito',
          location: 'Santa Fe, Santa Fe',
          description: 'Paquete recogido por transportista de larga distancia'
        },
        {
          date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          status: 'Orden creada',
          location: 'Santa Fe, Santa Fe',
          description: 'Orden de envío creada exitosamente'
        }
      ],
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Guardar las órdenes de prueba
  const existingOrders = getOrders();
  const combinedOrders = [...existingOrders, ...testOrders];
  localStorage.setItem('puntoenvio-orders', JSON.stringify(combinedOrders));

  return testOrders;
};

export const getArgentineLocalities = () => {
  // Primero intentar cargar las localidades personalizadas
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('puntoenvio-custom-localities');
    if (stored) {
      return JSON.parse(stored);
    }
  }

  // Si no hay datos personalizados, usar los por defecto
  return getDefaultArgentineLocalities();
};

export const getDefaultArgentineLocalities = () => {
  return {
    'Buenos Aires': [
      'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'Pergamino', 'Junín', 'Azul',
      'Vicente López', 'San Isidro', 'Tigre', 'San Fernando', 'San Martín', 'Tres de Febrero', 'Hurlingham',
      'Ituzaingó', 'Merlo', 'Morón', 'La Matanza', 'Esteban Echeverría', 'Ezeiza', 'Almirante Brown',
      'Lomas de Zamora', 'Lanús', 'Avellaneda', 'Quilmes', 'Berazategui', 'Florencio Varela', 'Presidente Perón',
      'San Vicente', 'Cañuelas', 'Marcos Paz', 'General Las Heras', 'Luján', 'Mercedes', 'Chivilcoy',
      'Lobos', 'Navarro', 'Campana', 'Zárate', 'Exaltación de la Cruz', 'Pilar', 'Escobar',
      'José C. Paz', 'Malvinas Argentinas', 'General San Martín', 'Moreno', 'General Rodríguez'
    ],
    'Ciudad Autónoma de Buenos Aires': [
      'Ciudad Autónoma de Buenos Aires'
    ],
    'CABA': [
      'Ciudad Autónoma de Buenos Aires'
    ],
    'Córdoba': [
      'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'San Francisco', 'Villa María', 'Alta Gracia',
      'Bell Ville', 'Marcos Juárez', 'Jesús María', 'La Falda', 'Cosquín', 'Cruz del Eje',
      'Río Tercero', 'Villa Dolores', 'Laboulaye', 'Oncativo', 'Río Segundo', 'Villa Nueva',
      'Morteros', 'Las Varillas', 'Arroyito', 'Deán Funes', 'Capilla del Monte', 'Unquillo'
    ],
    'Santa Fe': [
      'Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Villa Gobernador Gálvez',
      'Esperanza', 'Santo Tomé', 'San Lorenzo', 'Casilda', 'Firmat', 'Cañada de Gómez',
      'Villa Constitución', 'Funes', 'Capitán Bermúdez', 'San Nicolás', 'Pergamino', 'Arroyo Seco',
      'Las Rosas', 'Sunchales', 'San Cristóbal', 'Gálvez', 'San Jorge'
    ],
    'Mendoza': [
      'Mendoza', 'San Rafael', 'Godoy Cruz', 'Las Heras', 'Maipú', 'San Martín', 'Rivadavia',
      'Junín', 'Tupungato', 'San Carlos', 'Tunuyán', 'Luján de Cuyo', 'Guaymallén', 'Lavalle',
      'La Paz', 'Santa Rosa', 'General Alvear', 'Malargüe'
    ],
    'Tucumán': [
      'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Banda del Río Salí', 'Las Talitas',
      'Concepción', 'Aguilares', 'Monteros', 'Bella Vista', 'Famaillá', 'Lules', 'Trancas'
    ],
    'Entre Ríos': [
      'Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Villaguay', 'Victoria',
      'Crespo', 'Federal', 'Chajarí', 'San José', 'Colón', 'Diamante', 'La Paz'
    ],
    'Salta': [
      'Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'General Güemes', 'Metán', 'Cafayate',
      'Joaquín V. González', 'Embarcación', 'Rosario de Lerma', 'El Carmen', 'Cerrillos'
    ],
    'Misiones': [
      'Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Montecarlo', 'Garupá', 'Leandro N. Alem',
      'Apóstoles', 'San Vicente', 'Aristóbulo del Valle', 'Puerto Rico', 'Jardín América'
    ],
    'Chaco': [
      'Resistencia', 'Barranqueras', 'Fontana', 'Puerto Vilelas', 'Presidencia Roque Sáenz Peña',
      'Villa Ángela', 'Charata', 'General San Martín', 'Juan José Castelli', 'Quitilipi'
    ],
    'Corrientes': [
      'Corrientes', 'Goya', 'Mercedes', 'Paso de los Libres', 'Curuzú Cuatiá', 'Santo Tomé',
      'Monte Caseros', 'Bella Vista', 'Esquina', 'San Roque', 'Saladas', 'Itatí'
    ],
    'Santiago del Estero': [
      'Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Añatuya', 'Frías', 'Monte Quemado',
      'Fernández', 'Suncho Corral', 'Bandera', 'Villa Ojo de Agua', 'Clodomira'
    ],
    'Jujuy': [
      'San Salvador de Jujuy', 'Palpalá', 'San Pedro', 'Libertador General San Martín', 'Perico',
      'El Carmen', 'La Quiaca', 'Humahuaca', 'Tilcara', 'Abra Pampa'
    ],
    'Formosa': [
      'Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'Ingeniero Juárez', 'Las Lomitas',
      'Comandante Fontana', 'General Mosconi', 'Pozo del Tigre'
    ],
    'Catamarca': [
      'San Fernando del Valle de Catamarca', 'Recreo', 'Valle Viejo', 'Belén', 'Santa María',
      'Andalgalá', 'Tinogasta', 'Fiambalá', 'La Rioja', 'Chilecito'
    ],
    'La Rioja': [
      'La Rioja', 'Chilecito', 'Aimogasta', 'Chepes', 'Chamical', 'Villa Unión',
      'Nonogasta', 'Famatina', 'Sanagasta'
    ],
    'San Luis': [
      'San Luis', 'Villa Mercedes', 'Merlo', 'Juana Koslay', 'La Punta', 'Concarán',
      'Villa de la Quebrada', 'Naschel', 'Candelaria', 'Tilisarao'
    ],
    'San Juan': [
      'San Juan', 'Rivadavia', 'Santa Lucía', 'Rawson', 'Chimbas', 'Pocito', '25 de Mayo',
      'Caucete', 'Jáchal', 'Albardón', 'Angaco', 'Villa Krause'
    ],
    'Neuquén': [
      'Neuquén', 'Plottier', 'Cipolletti', 'Villa La Angostura', 'San Martín de los Andes',
      'Zapala', 'Cutral Có', 'Plaza Huincul', 'Centenario', 'Rincón de los Sauces'
    ],
    'Río Negro': [
      'Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti', 'Villa Regina',
      'Cinco Saltos', 'Catriel', 'El Bolsón', 'Ingeniero Jacobacci', 'Allen'
    ],
    'Chubut': [
      'Rawson', 'Comodoro Rivadavia', 'Puerto Madryn', 'Trelew', 'Esquel', 'Rada Tilly',
      'Dolavon', 'Gaiman', 'Sarmiento', 'José de San Martín'
    ],
    'Santa Cruz': [
      'Río Gallegos', 'Caleta Olivia', 'Río Turbio', 'Puerto Deseado', 'El Calafate',
      'Pico Truncado', 'Las Heras', 'Puerto Santa Cruz', '28 de Noviembre'
    ],
    'Tierra del Fuego': [
      'Ushuaia', 'Río Grande', 'Tolhuin'
    ],
    'La Pampa': [
      'Santa Rosa', 'General Pico', 'Toay', 'Realicó', 'Eduardo Castex', 'General Acha',
      'Ingeniero Luiggi', 'Victorica', 'Intendente Alvear', 'Catriló'
    ]
  };
};

export const getCustomLocalitiesData = (): Record<string, string[]> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('puntoenvio-custom-localities');
  return stored ? JSON.parse(stored) : {};
};

export const saveCustomLocalitiesData = (data: Record<string, string[]>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('puntoenvio-custom-localities', JSON.stringify(data));
  }
};

export const saveSettlements = (settlements: Settlement[]) => {
  localStorage.setItem('puntoenvio-settlements', JSON.stringify(settlements));
};

export const getSettlements = (): Settlement[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('puntoenvio-settlements');
  return stored ? JSON.parse(stored) : [];
};

export const generateWeeklySettlement = (agencyId: string): Settlement | null => {
  const agency = getAgencies().find(a => a.id === agencyId);
  if (!agency || !agency.weeklySettlementDay) return null;

  // Calcular período de la semana anterior
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Encontrar el día de cierre de la semana pasada
  const settlementDayNumber = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  }[agency.weeklySettlementDay];

  let periodEnd = new Date(lastWeek);
  while (periodEnd.getDay() !== settlementDayNumber) {
    periodEnd.setDate(periodEnd.getDate() - 1);
  }

  const periodStart = new Date(periodEnd.getTime() - 6 * 24 * 60 * 60 * 1000);

  // Buscar órdenes del período
  const orders = getOrders().filter(order => {
    const orderDate = new Date(order.createdAt);
    return order.assignedAgency === agencyId &&
           orderDate >= periodStart &&
           orderDate <= periodEnd;
  });

  if (orders.length === 0) return null;

  // Calcular totales
  const totalSales = orders.reduce((sum, order) => sum + order.costs.total, 0);
  let totalCommissions = 0;

  orders.forEach(order => {
    if (agency.commissions) {
      if (order.package.serviceType.includes('Domicilio') && order.package.serviceType.includes('Domicilio')) {
        totalCommissions += order.costs.freight * (agency.commissions.encomiendaCobrOrigen / 100);
      } else if (order.package.serviceType.includes('Agencia')) {
        totalCommissions += order.costs.freight * (agency.commissions.encomiendaPagoDestino / 100);
      }

      if (order.package.serviceType.includes('Ecommerce')) {
        totalCommissions += agency.commissions.ecommRecibido;
        if (order.status === 'entregado') {
          totalCommissions += agency.commissions.ecommEntregado;
        }
      }

      if (order.costs.thermoseal > 0) {
        totalCommissions += order.costs.thermoseal * (agency.commissions.termosellado / 100);
      }
    }
  });

  const netAmount = totalSales - totalCommissions;

  // Generar número de liquidación
  const settlements = getSettlements();
  const settlementNumber = `LIQ-${agency.code}-${(settlements.filter(s => s.agencyId === agencyId).length + 1).toString().padStart(4, '0')}`;

  const settlement: Settlement = {
    id: Date.now().toString(),
    agencyId,
    settlementNumber,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalSales,
    totalCommissions,
    netAmount,
    status: 'pending',
    generatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días para pagar
    orderIds: orders.map(o => o.id)
  };

  return settlement;
};

export const processWeeklySettlements = (): Settlement[] => {
  const agencies = getAgencies();
  const settlements = getSettlements();
  const newSettlements: Settlement[] = [];

  agencies.forEach(agency => {
    if (!agency.weeklySettlementDay) return;

    // Verificar si ya se generó liquidación esta semana
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);

    const existingSettlement = settlements.find(s =>
      s.agencyId === agency.id &&
      new Date(s.generatedAt) >= startOfWeek
    );

    if (!existingSettlement) {
      const settlement = generateWeeklySettlement(agency.id);
      if (settlement) {
        newSettlements.push(settlement);

        // Actualizar fecha de última liquidación
        const updatedAgencies = agencies.map(a =>
          a.id === agency.id
            ? { ...a, lastSettlementDate: settlement.generatedAt }
            : a
        );
        saveAgencies(updatedAgencies);
      }
    }
  });

  if (newSettlements.length > 0) {
    const allSettlements = [...settlements, ...newSettlements];
    saveSettlements(allSettlements);
  }

  return newSettlements;
};

export const updateAgencyCredit = (agencyId: string, amount: number) => {
  const agencies = getAgencies();
  const updatedAgencies = agencies.map(agency => {
    if (agency.id === agencyId) {
      const currentCredit = (agency.currentCredit || 0) + amount;
      return { ...agency, currentCredit };
    }
    return agency;
  });
  saveAgencies(updatedAgencies);
};

export const checkCreditLimit = (agencyId: string, orderAmount: number): boolean => {
  const agency = getAgencies().find(a => a.id === agencyId);
  if (!agency || !agency.creditLimit) return true;

  const currentCredit = agency.currentCredit || 0;
  return (currentCredit + orderAmount) <= agency.creditLimit;
};

export const uploadPaymentProof = (settlementId: string, file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const settlements = getSettlements();
      const updatedSettlements = settlements.map(settlement => {
        if (settlement.id === settlementId) {
          return {
            ...settlement,
            paymentProof: {
              filename: file.name,
              uploadedAt: new Date().toISOString(),
              url: e.target?.result as string
            },
            status: 'paid' as const
          };
        }
        return settlement;
      });

      saveSettlements(updatedSettlements);
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

export const getRouteSheetsByAgency = (agencyId: string): RouteSheet[] => {
  const routeSheets = getRouteSheets();
  return routeSheets.filter(sheet => sheet.agencyId === agencyId);
};

export const getRouteSheetsByTransportist = (transportistId: string): RouteSheet[] => {
  const routeSheets = getRouteSheets();
  return routeSheets.filter(sheet => sheet.transportistId === transportistId);
};

export const assignTransportistToRouteSheet = (routeSheetId: string, transportistId: string) => {
  const routeSheets = getRouteSheets();
  const updatedSheets = routeSheets.map(sheet => {
    if (sheet.id === routeSheetId) {
      return {
        ...sheet,
        transportistId,
        status: 'asignada' as const,
        assignedAt: new Date().toISOString()
      };
    }
    return sheet;
  });
  saveRouteSheets(updatedSheets);
};

export const updateRouteSheetStatus = (routeSheetId: string, status: RouteSheet['status']) => {
  const routeSheets = getRouteSheets();
  const updatedSheets = routeSheets.map(sheet => {
    if (sheet.id === routeSheetId) {
      const updatedSheet = { ...sheet, status };
      if (status === 'completada') {
        updatedSheet.completedAt = new Date().toISOString();
      }
      return updatedSheet;
    }
    return sheet;
  });
  saveRouteSheets(updatedSheets);
};

export const receiveRouteSheetAtAgency = (routeSheetId: string, agencyId: string) => {
  const routeSheets = getRouteSheets();
  const routeSheet = routeSheets.find(sheet => sheet.id === routeSheetId);

  if (!routeSheet) return;

  // actualizar todas las órdenes relacionadas a "en agencia destino"
  const orders = getOrders();
  const updatedOrders = orders.map(order => {
    if (routeSheet.orderIds.includes(order.id)) {
      return {
        ...order,
        status: 'en-agencia-destino' as const,
        history: [
          {
            date: new Date().toISOString(),
            status: 'En agencia destino',
            location: `Agencia ${agencyId}`,
            description: 'Paquete recibido en agencia destino'
          },
          ...order.history
        ]
      };
    }
    return order;
  });

  localStorage.setItem('puntoenvio-orders', JSON.stringify(updatedOrders));

  // actualizar hoja de ruta a "completada"
  updateRouteSheetStatus(routeSheetId, 'completada');
};

export const deliverToFinalCustomer = (trackingCode: string, deliveryDetails: string): boolean => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.trackingCode === trackingCode);

  if (orderIndex === -1) return false;

  orders[orderIndex] = {
    ...orders[orderIndex],
    status: 'entregado',
    history: [
      {
        date: new Date().toISOString(),
        status: 'Entregado',
        location: `${orders[orderIndex].recipient.city}, ${orders[orderIndex].recipient.province}`,
        description: `Paquete entregado exitosamente - ${deliveryDetails}`
      },
      ...orders[orderIndex].history
    ]
  };

  localStorage.setItem('puntoenvio-orders', JSON.stringify(orders));
  return true;
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
  // In production, you would use Google Maps Geocoding API
  // For now, return approximate coordinates based on known locations
  const knownLocations: Record<string, { lat: number, lng: number }> = {
    'ciudad autónoma de buenos aires': { lat: -34.6037, lng: -58.3816 },
    'buenos aires': { lat: -34.6037, lng: -58.3816 },
    'caba': { lat: -34.6037, lng: -58.3816 },
    'vicente lópez': { lat: -34.5312, lng: -58.4847 },
    'la matanza': { lat: -34.6698, lng: -58.6252 },
    'avellaneda': { lat: -34.6627, lng: -58.3656 },
    'quilmes': { lat: -34.7205, lng: -58.2545 },
    'Córdoba': { lat: -31.4201, lng: -64.1888 },
    'villa carlos paz': { lat: -31.4240, lng: -64.4987 },
    'río cuarto': { lat: -33.1301, lng: -64.3496 },
    'santa fe': { lat: -31.6107, lng: -60.6973 },
    'rosario': { lat: -32.9468, lng: -60.6393 },
    'mendoza': { lat: -32.8908, lng: -68.8272 }
  };

  const searchKey = address.toLowerCase();

  // Try exact match first
  for (const [key, coords] of Object.entries(knownLocations)) {
    if (searchKey.includes(key)) {
      return coords;
    }
  }

  // If no match found, return null
  return null;
};

export const updateAgencyCoordinates = async (): Promise<Agency[]> => {
  const agencies = getAgencies();
  const updatedAgencies = [...agencies];

  // Default coordinates for known locations
  const defaultCoordinates: Record<string, { lat: number, lng: number }> = {
    'ciudad autónoma de buenos aires': { lat: -34.6037, lng: -58.3816 },
    'vicente lópez': { lat: -34.5312, lng: -58.4847 },
    'la matanza': { lat: -34.6698, lng: -58.6252 },
    'avellaneda': { lat: -34.6627, lng: -58.3656 },
    'quilmes': { lat: -34.7205, lng: -58.2545 },
    'Córdoba': { lat: -31.4201, lng: -64.1888 },
    'villa carlos paz': { lat: -31.4240, lng: -64.4987 },
    'río cuarto': { lat: -33.1301, lng: -64.3496 },
    'santa fe': { lat: -31.6107, lng: -60.6973 },
    'rosario': { lat: -32.9468, lng: -60.6393 }
  };

  let hasUpdates = false;

  for (let i = 0; i < updatedAgencies.length; i++) {
    if (!updatedAgencies[i].coordinates) {
      const cityKey = updatedAgencies[i].city.toLowerCase();
      const provinceKey = updatedAgencies[i].province.toLowerCase();

      // Try to find coordinates by city or province
      const coordinates = defaultCoordinates[cityKey] ||
                         defaultCoordinates[provinceKey] ||
                         defaultCoordinates['ciudad autónoma de buenos aires']; // fallback

      updatedAgencies[i] = {
        ...updatedAgencies[i],
        coordinates
      };
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    saveAgencies(updatedAgencies);
  }

  return updatedAgencies;
};

export const getAvailableOrdersForRoute = (origin: string, destination: string, stops: string[]) => {
  const orders = getOrders();
  return orders.filter(order => {
    // order.status === 'pendiente-recoleccion' &&
    // order.assignedAgency === agencyId &&
    // !order.assignedTransportist &&
    // !order.route &&
    return order.sender.province === origin &&
           order.recipient.province === destination &&
           stops.includes(order.recipient.city);
  });
};

// Nueva función para calcular el pago del transportista
export const calculateTransportistPayment = (transportistId: string, orderIds: string[]): number => {
  const transportist = getTransportists().find(t => t.id === transportistId);
  if (!transportist) return 0;

  // At this point transportist.paymentRate is guaranteed to exist due to ensureTransportistPaymentRate
  const paymentRate = transportist.paymentRate!;

  const orders = getOrders().filter(order => orderIds.includes(order.id));

  let totalPayment = 0;

  // Calculate payment for each package based on weight scales
  orders.forEach(order => {
    const packageWeight = order.package.weight;

    // Find the appropriate weight scale
    const applicableScale = paymentRate.weightScales.find(scale =>
      packageWeight >= scale.weightFrom && packageWeight <= scale.weightTo
    );

    if (applicableScale) {
      // Pay per package according to its weight scale
      for (let i = 0; i < order.package.quantity; i++) {
        totalPayment += applicableScale.pricePerPackage;
      }
    }
  });

  // Add delivery bonus for successfully delivered orders
  const deliveredOrders = orders.filter(order => order.status === 'entregado');
  const deliveryBonus = deliveredOrders.reduce((total, order) => {
    return total + (order.package.quantity * paymentRate.deliveryBonus);
  }, 0);

  totalPayment += deliveryBonus;

  return totalPayment;
};

// Nueva función para obtener el historial de pagos del transportista con el nuevo sistema
export const getTransportistPaymentHistory = (transportistId: string): Array<{
  routeSheetId: string;
  routeSheetCode: string;
  totalPackages: number;
  deliveredPackages: number;
  totalOrders: number;
  payment: number;
  paymentBreakdown: {
    packagePayments: Array<{
      weightRange: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    deliveryBonus: number;
    total: number;
  };
  date: string;
}> => {
  const routeSheets = getRouteSheets().filter(sheet =>
    sheet.transportistId === transportistId && sheet.status === 'completada'
  );

  const transportist = getTransportists().find(t => t.id === transportistId);
  if (!transportist) return [];

  return routeSheets.map(sheet => {
    const orders = getOrders().filter(order => sheet.orderIds.includes(order.id));
    const deliveredOrders = orders.filter(order => order.status === 'entregado');

    const totalPackages = orders.reduce((sum, order) => sum + order.package.quantity, 0);
    const deliveredPackages = deliveredOrders.reduce((sum, order) => sum + order.package.quantity, 0);

    // Calculate payment breakdown by weight scales
    const packagePayments: any[] = [];
    const weightScales = transportist.paymentRate?.weightScales || [];

    weightScales.forEach(scale => {
      const packagesInScale = orders.filter(order =>
        order.package.weight >= scale.weightFrom && order.package.weight <= scale.weightTo
      );

      if (packagesInScale.length > 0) {
        const quantity = packagesInScale.reduce((sum, order) => sum + order.package.quantity, 0);
        const subtotal = quantity * scale.pricePerPackage;

        packagePayments.push({
          weightRange: `${scale.weightFrom}-${scale.weightTo}kg`,
          quantity,
          unitPrice: scale.pricePerPackage,
          subtotal
        });
      }
    });

    const deliveryBonusAmount = deliveredPackages * (transportist.paymentRate?.deliveryBonus || 0);
    const totalPayment = packagePayments.reduce((sum, pp) => sum + pp.subtotal, 0) + deliveryBonusAmount;

    return {
      routeSheetId: sheet.id,
      routeSheetCode: sheet.code,
      totalPackages,
      deliveredPackages,
      totalOrders: orders.length,
      payment: totalPayment,
      paymentBreakdown: {
        packagePayments,
        deliveryBonus: deliveryBonusAmount,
        total: totalPayment
      },
      date: sheet.completedAt || sheet.createdAt
    };
  });
};
