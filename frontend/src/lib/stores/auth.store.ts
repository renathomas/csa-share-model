import { writable, derived } from 'svelte/store';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false
  });

  return {
    subscribe,
    login: (user: any, accessToken: string, refreshToken: string) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      update(state => ({
        ...state,
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false
      }));
    },
    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false
      });
    },
    setLoading: (loading: boolean) => {
      update(state => ({ ...state, isLoading: loading }));
    },
    initFromStorage: () => {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          update(state => ({
            ...state,
            accessToken,
            refreshToken,
            isAuthenticated: true
          }));
        }
      }
    }
  };
};

export const authStore = createAuthStore();

export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const currentUser = derived(authStore, $auth => $auth.user);
export const authToken = derived(authStore, $auth => $auth.accessToken); 