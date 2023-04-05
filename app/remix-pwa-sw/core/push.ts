declare let self: ServiceWorkerGlobalScope;

export const handlePush = async (event: PushEvent) => {
  const data = JSON.parse(event?.data!.text());
  const title = data.title ? data.title : "Remix PWA";

  const options = {
    body: data.body ? data.body : "Notification Body Text",
    icon: data.icon ? data.icon : "/icons/android-icon-192x192.png",
    badge: data.badge ? data.badge : "/icons/android-icon-48x48.png",
    dir: data.dir ? data.dir : "auto",
    image: data.image ? data.image : undefined,
    silent: data.silent ? data.silent : false,
  };

  self.registration.showNotification(title, {
    ...options,
  });
};
