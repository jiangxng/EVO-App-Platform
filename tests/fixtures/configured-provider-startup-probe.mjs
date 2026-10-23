// Test-only network observation, installed before Host module evaluation.
let requests = 0;
globalThis.fetch = async () => {
  requests++;
  throw Error('UNEXPECTED_CONFIGURED_PROVIDER_STARTUP_FETCH');
};
process.on('message', message => {
  if (message?.kind === 'configured-provider-snapshot') process.send?.({id: message.id, requests});
});
