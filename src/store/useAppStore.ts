import { create } from 'zustand';
import { Project, Client, Supplier } from '../types/database';

interface AppState {
  projects: Project[];
  clients: Client[];
  suppliers: Supplier[];
  
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, partial: Partial<Client>) => void;
  
  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, partial: Partial<Supplier>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  clients: [],
  suppliers: [],
  
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, partial) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...partial } : p)
  })),
  
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
  updateClient: (id, partial) => set((state) => ({
    clients: state.clients.map(c => c.id === id ? { ...c, ...partial } : c)
  })),
  
  setSuppliers: (suppliers) => set({ suppliers }),
  addSupplier: (supplier) => set((state) => ({ suppliers: [supplier, ...state.suppliers] })),
  updateSupplier: (id, partial) => set((state) => ({
    suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...partial } : s)
  }))
}));
