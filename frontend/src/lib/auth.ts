export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  department?: string;
}

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: (): boolean => {
    return auth.getToken() !== null;
  },

  getRoleBasedPath: (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/superadmin/dashboard';
      case 'sub_admin':
        return '/subadmin/dashboard';
      case 'hr':
        return '/hr/dashboard';
      case 'hod':
        return '/hod/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/dashboard';
    }
  },
};

