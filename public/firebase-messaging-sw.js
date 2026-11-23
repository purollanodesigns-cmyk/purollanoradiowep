/* Service worker de mensajería (Firebase Cloud Messaging).
   Experiencia nativa para móviles: acciones interactivas, vibración, banner expandible e insignia. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

try {
  firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
  const messaging = firebase.messaging();

  // Recepción en segundo plano (pantalla bloqueada / app cerrada)
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle =
      payload.notification?.title || payload.data?.title || "Puro Llano Radio";

    const image = payload.notification?.image || payload.data?.image || undefined;
    const path = payload.data?.path || payload.fcmOptions?.link || "/";

    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || "",
      icon: "/purollano-logo.png",
      badge: "/purollano-logo.png",
      ...(image ? { image } : {}),
      tag: payload.data?.tag || "purollano-push-alert",
      renotify: true,
      vibrate: [250, 100, 250, 100, 250],
      data: { path },
      actions: [
        {
          action: "listen",
          title: "▶ Escuchar en vivo",
        },
        {
          action: "open",
          title: "Abrir radio",
        },
      ],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.error("[FCM-SW] Error inicializando messaging:", e);
}

// Soporte adicional para eventos push directos del navegador
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const notification = payload.notification || payload;
    const title = notification.title || "Puro Llano Radio";
    const body = notification.body || "";
    const image = notification.image || payload.data?.image || undefined;
    const path = payload.data?.path || payload.fcmOptions?.link || "/";

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: "/purollano-logo.png",
        badge: "/purollano-logo.png",
        ...(image ? { image } : {}),
        tag: "purollano-push-alert",
        renotify: true,
        vibrate: [250, 100, 250, 100, 250],
        data: { path },
        actions: [
          { action: "listen", title: "▶ Escuchar en vivo" },
          { action: "open", title: "Abrir radio" },
        ],
      }),
    );
  } catch (err) {
    console.error("[FCM-SW] Error procesando evento push:", err);
  }
});

// Mensajes enviados desde la pestaña cliente para mostrar notificación nativa
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, image, path } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || "Puro Llano Radio", {
        body: body || "",
        icon: "/purollano-logo.png",
        badge: "/purollano-logo.png",
        ...(image ? { image } : {}),
        tag: `purollano-msg-${Date.now()}`,
        renotify: true,
        vibrate: [250, 100, 250, 100, 250],
        data: { path: path || "/" },
        actions: [
          { action: "listen", title: "▶ Escuchar en vivo" },
          { action: "open", title: "Abrir radio" },
        ],
      }),
    );
  }
});

// Clic en la notificación o en las acciones interactivas
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const basePath = (event.notification.data && event.notification.data.path) || "/";
  const target = action === "listen" ? "/?play=1" : basePath;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Si la pestaña ya existe, enfocamos y navegamos si se presionó "Escuchar en vivo"
      for (const client of clients) {
        if ("focus" in client) {
          if (action === "listen" && "navigate" in client) {
            return client.navigate(target).then(() => client.focus());
          }
          return client.focus();
        }
      }
      // Si no hay pestaña abierta, abrimos la ventana
      return self.clients.openWindow(target);
    }),
  );
});
