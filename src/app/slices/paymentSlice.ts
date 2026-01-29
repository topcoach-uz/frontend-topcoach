import { createSlice } from '@reduxjs/toolkit';

interface InitialState {
  mentorId: string;
  sessionId: string;
  plandId: string;
}

const initialState: InitialState = {
  mentorId: '',
  sessionId: '',
  plandId: '',
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentData: (state, { payload }: { payload: InitialState }) => {
      state = payload;
    },
  },
});

export const { setPaymentData } = paymentSlice.actions;

export default paymentSlice.reducer;
