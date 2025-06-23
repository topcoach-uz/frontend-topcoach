import { Provider } from 'react-redux';
import { store } from 'src/app/store';
import { PropsWithChildren } from 'react';

function ReduxProvider({ children }: PropsWithChildren) {
  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
