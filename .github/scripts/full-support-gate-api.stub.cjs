exports.useGetFullSupportPaymentQuery = () => global.__fullSupportTestQuery;
exports.useCreateFullSupportCheckoutMutation = () => [() => { throw Error('No checkout in render tests'); }, {isLoading: false}];
