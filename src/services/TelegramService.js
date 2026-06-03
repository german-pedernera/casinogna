const TELEGRAM_TOKEN = '8870995559:AAGKJvkXcRHDRDE4YgzZl3YJ-0BGEhlWo70';
const CHAT_ID = '1222847704';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

/**
 * Envía un mensaje de texto al chat de Telegram configurado.
 * @param {string} mensaje El texto a enviar.
 */
export const enviarNotificacionTelegram = async (mensaje) => {
  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML' // Permite enviar negritas y formato HTML básico
      }),
    });

    if (!response.ok) {
      console.error('Error al enviar notificación a Telegram:', await response.text());
    }
  } catch (error) {
    console.error('Error de red al intentar enviar a Telegram:', error);
  }
};
