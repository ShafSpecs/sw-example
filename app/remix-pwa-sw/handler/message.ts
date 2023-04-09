export interface MessagePlugin {
  messageDidReceive?: (env: MessageEnv) => void;
  messageWillSend?: (env: MessageEnv) => void;
}

export interface MessageEnv {
  event?: ExtendableMessageEvent;
  state?: Record<string, any>;
}

export abstract class MessageHandler {
  plugins: MessagePlugin[];

  constructor(plugins: MessagePlugin[] = []) {
    this.plugins = plugins;
  }

  async handle(event: ExtendableMessageEvent, state: Record<string, any> = {}) {
    await this._handleMessage(event, state);
  }

  abstract _handleMessage(
    event: ExtendableMessageEvent,
    state: Record<string, any>
  ): Promise<void> | void;

  async runPlugins(hook: keyof MessagePlugin, env: MessageEnv) {
    for (const plugin of this.plugins) {
      if (plugin[hook]) {
        await plugin[hook]!(env);
      }
    }
  }
}

export class PingHandler extends MessageHandler {
  async _handleMessage(
    event: ExtendableMessageEvent,
    state: Record<string, any> = {}
  ) {
    if (event.data.type !== "ping") return;

    const env = {
      event,
      state,
    };
    await this.runPlugins("messageDidReceive", env);

    // Do stuff with the payload here, ig

    await this.runPlugins("messageWillSend", env);

    // return the message after this point

    event.source!.postMessage("pong");
  }
}

export class RemixMessageHandler extends MessageHandler {
  async _handleMessage(
    event: ExtendableMessageEvent,
    state: Record<string, any>
  ): Promise<void> {
    const { data } = event;
    const { DATA, PAGES } = state["caches"];

    let cachePromises: Map<string, Promise<void>> = new Map();

    if (data.type === "REMIX_NAVIGATION") {
      let { isMount, location, matches, manifest } = data;
      let documentUrl = location.pathname + location.search + location.hash;

      let [dataCache, documentCache, existingDocument] = await Promise.all([
        caches.open(DATA),
        caches.open(PAGES),
        caches.match(documentUrl),
      ]);

      if (!existingDocument || !isMount) {
        // debug("Caching document for", documentUrl);
        cachePromises.set(
          documentUrl,
          documentCache.add(documentUrl).catch((error) => {
            // debug(`Failed to cache document for ${documentUrl}:`, error);
          })
        );
      }

      if (isMount) {
        for (let match of matches) {
          if (manifest.routes[match.id].hasLoader) {
            let params = new URLSearchParams(location.search);
            params.set("_data", match.id);
            let search = params.toString();
            search = search ? `?${search}` : "";
            let url = location.pathname + search + location.hash;
            if (!cachePromises.has(url)) {
              // debug("Caching data for", url);
              cachePromises.set(
                url,
                dataCache.add(url).catch((error) => {
                  // debug(`Failed to cache data for ${url}:`, error);
                })
              );
            }
          }
        }
      }
    }

    await Promise.all(cachePromises.values());
  }
}
