import { createSlice } from '@reduxjs/toolkit';

interface ProfilePopupState {
  visible: boolean;
}

const initialState: ProfilePopupState = {
  visible: false,
};

const profilePopupSlice = createSlice({
  name: 'profilePopup',
  initialState,
  reducers: {
    show: (state) => {
      state.visible = true;
    },
    hide: (state) => {
      state.visible = false;
    },
  },
});

export const { show, hide } = profilePopupSlice.actions;
export default profilePopupSlice.reducer; 