// todo: Later please. Implementation wants to burst my head 
// and I'm still figuring out how plugin would work, 
// chaneged implemenation 4 times already.


/**
 * Rough implementation of background sync plugin.
 * `registerBackgroundSync` is a function that registers the request,
 * triggered by the `fetchDidFail` hook of the `StrategyPlugin` interface.
 * 
 * I've finally settled for this implementation btw, neater and allows anyone to 
 * easily create their plugin. Just understand the lifecycle in your strategy 
 * and know which hook to implement. 
 * 
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