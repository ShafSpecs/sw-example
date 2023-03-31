## Demo `SW` module

This is a demo `sw` module that allows for testing and updating features in real-time. It is not intended for production use.
To test it out, clone this repo then run `npm run dev`.

### Modules

- `core` - Core functions shared across all other modules
- `_private` - Internal APIs for the service worker modules. Not intended for public use.
- `_strategy` - Inner APIs for `Strategy` handling.
- `loader` - Module for loading service worker. This is the entry point for the service worker (to be used in `entry.client`)
- `routing` - Module for routing requests to the appropriate `Strategy`
- `strategy` - Module for defining `Strategy` for handling requests --- heavily inspired by Workbox
- `types` - COmplete typings of this module.