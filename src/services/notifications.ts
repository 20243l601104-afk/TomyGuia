import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tomyguia', {
      name: 'TomyGuia',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const result = await Notifications.requestPermissionsAsync();
  return (result as any).status === 'granted' || (result as any).granted === true;
}

export async function cancelarTodasNotificaciones() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function programarNotificacionPago(
  titulo: string,
  monto: number,
  diaPago: number
) {
  const hoy = new Date();
  const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
  if (fechaPago <= hoy) {
    fechaPago.setMonth(fechaPago.getMonth() + 1);
  }

  // 2 dias antes
  const fechaAviso = new Date(fechaPago);
  fechaAviso.setDate(fechaAviso.getDate() - 2);
  fechaAviso.setHours(9, 0, 0, 0);

  if (fechaAviso > hoy) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Pago proximo: ${titulo}`,
        body: `Vence el dia ${diaPago}. Tienes $${monto.toLocaleString('es-MX')} apartados.`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fechaAviso, channelId: 'tomyguia' },
    });
  }

  // El mismo dia
  const fechaDia = new Date(fechaPago);
  fechaDia.setHours(8, 0, 0, 0);
  if (fechaDia > hoy) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Hoy vence: ${titulo}`,
        body: `No olvides pagar $${monto.toLocaleString('es-MX')} hoy.`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fechaDia, channelId: 'tomyguia' },
    });
  }
}

export async function programarRecordatorioGastos() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tus finanzas te esperan',
      body: 'Registra lo que gastaste hoy. Solo toma un momento.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      channelId: 'tomyguia',
    },
  });
}

export async function programarResumenMensual() {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const fechaResumen = new Date(ultimoDia);
  fechaResumen.setDate(fechaResumen.getDate() - 2);
  fechaResumen.setHours(10, 0, 0, 0);

  if (fechaResumen > hoy) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Casi termina el mes',
        body: 'Revisa como vas con tu presupuesto antes de que cierre el mes.',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fechaResumen, channelId: 'tomyguia' },
    });
  }
}

export async function configurarNotificaciones(
  gastosFijos: { title: string; amount: number; day: number | null }[]
) {
  const permiso = await solicitarPermisosNotificaciones();
  if (!permiso) return;

  await cancelarTodasNotificaciones();

  for (const gasto of gastosFijos) {
    if (gasto.day) {
      await programarNotificacionPago(gasto.title, gasto.amount, gasto.day);
    }
  }

  await programarRecordatorioGastos();
  await programarResumenMensual();
}
