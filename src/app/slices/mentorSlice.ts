import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaymentPlansSchema, UserDetailsResponseDto } from '../api/Api';
import { mentorApi } from '../services/mentors';

export interface IBalance {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: any;
  status?: string;
  totalMinutes?: number;
  usedMinutes?: number;
}

export interface IMentorState {
  lastMentorData?: UserDetailsResponseDto;
  balance?: IBalance;
  plans?: PaymentPlansSchema[];
  plansWithParams?: PaymentPlansSchema[];
}

const initialState: IMentorState = {};

const mentorSlice = createSlice({
  name: 'lastMentor',
  initialState,
  reducers: {
    setLastMentorData: (
      state,
      action: PayloadAction<UserDetailsResponseDto>
    ) => {
      state.lastMentorData = action.payload;
    },
    setBalance: (state, action: PayloadAction<IBalance>) => {
      state.balance = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        mentorApi.endpoints.getMentorDetail.matchFulfilled,
        (state, action) => {
          state.lastMentorData = action.payload;
        }
      )
      .addMatcher(
        mentorApi.endpoints.getMentorBalance.matchFulfilled,
        (state, action) => {
          state.balance = action.payload;
        }
      )
      .addMatcher(
        mentorApi.endpoints.getPlans.matchFulfilled,
        (state, action) => {
          state.plans = action.payload;
        }
      )
      .addMatcher(
        mentorApi.endpoints.getPlansWithParams.matchFulfilled,
        (state, action) => {
          state.plansWithParams = action.payload;
        }
      );
  },
});

export const { setLastMentorData, setBalance } = mentorSlice.actions;

export default mentorSlice.reducer;
