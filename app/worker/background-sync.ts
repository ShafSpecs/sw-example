// todo: Later please. Implementation wants to burst my head 
// and I'm still figuring out how plugin would work, 
// chaneged implemenation 4 times already.


/**
 * Rough implementation of background sync plugin.
 * `registerBackgroundSync` is a function that registers the request,
 * triggered by the `fetchDidFail` hook of the `StrategyPlugin` interface.
 */
// class BackgroundSyncPlugin implements Plugin {
//   async fetchDidFail(request: Request, error: Error): void {
//     await registerBackgroundSync({
//       request: request,
//       options: {
//         tag: 'background-sync'
//       }
//     });
//   }
// }