import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SessionsSchema } from '../api/Api';
import { sessionsApi } from '../services/sessions';

interface InitialState {
  sessions?: SessionsSchema[];
}

const initialState: InitialState = {};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessions(state, action: PayloadAction<SessionsSchema[]>) {
      state.sessions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      sessionsApi.endpoints.getMySessions.matchFulfilled,
      (state, action) => {
        state.sessions = action.payload;
      }
    );
  },
});

export const { setSessions } = sessionSlice.actions;

export default sessionSlice.reducer;
