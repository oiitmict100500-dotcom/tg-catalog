import axios from 'axios';

const API_URL = '/api/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async register(username: string, email: string, password: string) {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async login(login: string, password: string) {
    const response = await axios.post(`${API_URL}/login`, {
      login,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await axios.get(`${API_URL}/me`);
      return response.data;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  async forgotPassword(email: string) {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await axios.post(`${API_URL}/reset-password`, {
      token,
      password,
    });
    return response.data;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setUser(user: User | null) {
    // Сохраняем пользователя в localStorage для быстрого доступа
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();

