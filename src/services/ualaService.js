// =====================================================================
// Ualá Bis API v2 - Servicio de pasarela de pago
// Las rutas /api/uala-auth y /api/uala-checkout son proxys de Vite que
// redirigen a los servidores de Ualá Bis evitando el bloqueo de CORS.
// Configuración del proxy en: vite.config.js -> server.proxy
// =====================================================================

// Rutas locales que el proxy de Vite redirecciona a los servidores de Ualá Bis
const AUTH_PROXY  = '/api/uala-auth/auth/token';
const ORDER_PROXY = '/api/uala-checkout/checkout';

/**
 * Obtiene un token de acceso de Ualá Bis (API v2).
 * La petición va a /api/uala-auth/auth/token → proxy → auth.stage.developers.ar.ua.la/v2/api/auth/token
 */
export const obtenerTokenUala = async () => {
  const username        = import.meta.env.VITE_UALA_USERNAME;
  const clientId        = import.meta.env.VITE_UALA_CLIENT_ID;
  const clientSecretId  = import.meta.env.VITE_UALA_CLIENT_SECRET;

  if (!username || !clientId || !clientSecretId) {
    throw new Error('Faltan credenciales de Ualá Bis en el archivo .env');
  }

  // Campos requeridos por la API v2 de Ualá Bis
  const payload = {
    username,          // v2 usa "username" (sin guión bajo)
    client_id:         clientId,
    client_secret_id:  clientSecretId,
    grant_type:        'client_credentials',
  };

  const response = await fetch(AUTH_PROXY, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al obtener token de Ualá Bis:', errorData);
    throw new Error(`Error de autenticación Ualá Bis: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  // La API v2 devuelve { access_token: "...", ... }
  if (!data.access_token) {
    throw new Error('La respuesta de autenticación no contiene access_token');
  }

  return data.access_token;
};

/**
 * Crea una orden de cobro en Ualá Bis (API v2).
 *
 * @param {number|string} monto            - Importe a cobrar (ej: 5000)
 * @param {string}        descripcion      - Descripción visible en el checkout
 * @param {string}        callbackSuccess  - URL de redirección si el pago es exitoso
 * @param {string}        callbackFail     - URL de redirección si el pago falla
 * @param {string}        externalRef      - Referencia externa opcional (ej: DNI del socio)
 * @returns {Promise<string>}              - Link de checkout para redirigir al usuario
 */
export const crearOrdenCobro = async (
  monto,
  descripcion,
  callbackSuccess,
  callbackFail
) => {
  // 1. Obtener token
  const token = await obtenerTokenUala();

  // 2. Construir el payload según la API v2
  //    Solo se incluyen los campos requeridos: amount, description, callback_success, callback_fail.
  //    Los campos opcionales (notification_url, external_reference) se omiten para evitar errores de validación.
  const orderPayload = {
    amount:           String(parseFloat(monto).toFixed(2)),
    description:      descripcion,
    callback_success: callbackSuccess,
    callback_fail:    callbackFail,
  };

  console.log('[ualaService] Creando orden de cobro:', orderPayload);

  const response = await fetch(ORDER_PROXY, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[ualaService] Error al crear orden:', errorData);
    throw new Error(`Error al crear la orden de cobro: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log('[ualaService] Respuesta de la orden:', data);

  // La API v2 devuelve el link en data.links.checkoutLink o data.checkout_link
  const checkoutLink =
    data?.links?.checkoutLink ||
    data?.links?.checkout_link ||
    data?.checkoutLink ||
    data?.checkout_link ||
    null;

  if (!checkoutLink) {
    throw new Error(
      `La respuesta no contiene un link de checkout válido. Respuesta: ${JSON.stringify(data)}`
    );
  }

  return checkoutLink;
};
