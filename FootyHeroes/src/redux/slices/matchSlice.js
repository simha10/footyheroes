import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import matchService from '../../services/matchService';

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await matchService.getMatches(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMatchById = createAsyncThunk(
  'matches/fetchMatchById',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await matchService.getMatchById(matchId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createMatch = createAsyncThunk(
  'matches/createMatch',
  async (matchData, { rejectWithValue }) => {
    try {
      const response = await matchService.createMatch(matchData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinMatch = createAsyncThunk(
  'matches/joinMatch',
  async ({ matchId, position }, { rejectWithValue }) => {
    try {
      const response = await matchService.joinMatch(matchId, position);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveMatch = createAsyncThunk(
  'matches/leaveMatch',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await matchService.leaveMatch(matchId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNearbyMatches = createAsyncThunk(
  'matches/fetchNearbyMatches',
  async (location, { rejectWithValue }) => {
    try {
      const response = await matchService.getNearbyMatches(location);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const matchSlice = createSlice({
  name: 'matches',
  initialState: {
    matches: [],
    currentMatch: null,
    nearbyMatches: [],
    loading: false,
    error: null,
    filters: {
      format: '',
      skillLevel: '',
      distance: 25000,
      dateFrom: null,
      dateTo: null,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        format: '',
        skillLevel: '',
        distance: 25000,
        dateFrom: null,
        dateTo: null,
      };
    },
    setCurrentMatch: (state, action) => {
      state.currentMatch = action.payload;
    },
    clearCurrentMatch: (state) => {
      state.currentMatch = null;
    },
    updateMatchInList: (state, action) => {
      const updatedMatch = action.payload;
      const index = state.matches.findIndex(match => match._id === updatedMatch._id);
      if (index !== -1) {
        state.matches[index] = updatedMatch;
      }
      
      if (state.currentMatch && state.currentMatch._id === updatedMatch._id) {
        state.currentMatch = updatedMatch;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
        state.error = null;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Match By ID
      .addCase(fetchMatchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload;
        state.error = null;
      })
      .addCase(fetchMatchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Match
      .addCase(createMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.matches.unshift(action.payload);
        state.error = null;
      })
      .addCase(createMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Join Match
      .addCase(joinMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the match in the store directly in the slice
        const updatedMatch = action.payload;
        const index = state.matches.findIndex(match => match._id === updatedMatch._id);
        if (index !== -1) {
          state.matches[index] = updatedMatch;
        }
        if (state.currentMatch && state.currentMatch._id === updatedMatch._id) {
          state.currentMatch = updatedMatch;
        }
      })
      .addCase(joinMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Leave Match
      .addCase(leaveMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the match in the store
        const updatedMatch = action.payload;
        const index = state.matches.findIndex(match => match._id === updatedMatch._id);
        if (index !== -1) {
          state.matches[index] = updatedMatch;
        }
        if (state.currentMatch && state.currentMatch._id === updatedMatch._id) {
          state.currentMatch = updatedMatch;
        }
      })
      // Fetch Nearby Matches
      .addCase(fetchNearbyMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyMatches = action.payload;
        state.error = null;
      })
      .addCase(fetchNearbyMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setCurrentMatch,
  clearCurrentMatch,
  updateMatchInList
} = matchSlice.actions;
export default matchSlice.reducer;
