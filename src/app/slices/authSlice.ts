import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { message } from 'antd';
import {
  ACCESS_TOKEN,
  access_token,
  REFRESH_TOKEN,
  refresh_token,
} from 'src/constants/storage';
import { api } from '../api';
import { GetMeResDto, MEDIA_TAGS, MediaEnum } from '../api/Api';
import { authApi } from '../services/users';

export interface IAuthState {
  access_token?: string;
  refresh_token?: string;
  isAuthenticated: boolean;
  profile?: Partial<GetMeResDto>;
}

// Create an async thunk for updating the profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<GetMeResDto>, { rejectWithValue }) => {
    try {
      const response = await api.users.updateProfile(data);
      return response.data;
    } catch (err) {
      // @ts-ignore
      return rejectWithValue(err?.response?.data);
    }
  }
);

const initialState: IAuthState = {
  access_token: access_token || '',
  refresh_token: refresh_token || '',
  isAuthenticated: !!access_token,
  profile: {},
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.access_token = '';
      state.refresh_token = '';
      state.isAuthenticated = false;

      // Remove tokens from localStorage
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      window.location.href = '/auth/signin';
    },
    login: (
      state,
      action: PayloadAction<{ access: string; refresh: string }>
    ) => {
      const { access, refresh } = action.payload;

      state.isAuthenticated = true;
      state.access_token = access;
      state.refresh_token = refresh;

      // Store tokens in localStorage
      localStorage.setItem(ACCESS_TOKEN, access);
      localStorage.setItem(REFRESH_TOKEN, refresh);
    },
    loginCheck: (state) => {
      const access_token = localStorage.getItem(ACCESS_TOKEN);
      const refresh_token = localStorage.getItem(REFRESH_TOKEN);

      if (access_token && refresh_token) {
        state.isAuthenticated = true;
        state.access_token = access_token;
        state.refresh_token = refresh_token;
      }
    },
    setProfile: (state, action: PayloadAction<GetMeResDto>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    // setProfileImage: (state, action) => {
    //   state.profile?.profile?.media
    // }
    updateProfile: (
      state,
      { payload }: PayloadAction<Partial<GetMeResDto>>
    ) => {
      state.profile = { ...state.profile, ...payload };
    },
    setProfileImage: (state, action: PayloadAction<string | undefined>) => {
      if (typeof action.payload !== 'string') {
        message.error('Invalid profile image');
        return;
      }
      if (state.profile?.profile?.media) {
        const updatedMedia = [...state?.profile.profile.media];

        updatedMedia?.unshift({
          url: action.payload,
          tags: [MEDIA_TAGS.ProfilePicture],
          id: 'new',
          createdAt: new Date().toISOString(),
          deletedAt: '',
          type: MediaEnum.Image,
          updatedAt: '',
        });

        state.profile.profile.media = updatedMedia;
      }
    },
    setHasGoogleCredentials: (state, { payload }) => {
      if (state.profile) {
        state.profile.hasGoogleCredentials = payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      const updatedProfile = { ...state.profile, ...action.payload };
      updatedProfile.profile.media = [...(state.profile?.profile?.media || [])];
      state.profile = updatedProfile;
    });
    builder.addMatcher(
      authApi.endpoints.getMe.matchFulfilled,
      (state, action) => {
        state.profile = { ...state.profile, ...action.payload };
      }
    );
  },
});

export const {
  logout,
  login,
  loginCheck,
  setProfile,
  setProfileImage,
  setHasGoogleCredentials,
} = authSlice.actions;
export default authSlice.reducer;
