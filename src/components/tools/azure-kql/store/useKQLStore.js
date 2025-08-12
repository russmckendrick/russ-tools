import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_HISTORY_ITEMS = 50;

export const useKQLStore = create((set, get) => ({
  selectedService: '',
  selectedTemplate: '',
  parameters: {},
  generatedQuery: '',
  queryHistory: [],
  favorites: [],
  customTemplates: [],

  setSelectedService: (service) => set((state) => ({ 
    selectedService: service,
    selectedTemplate: state.selectedService === service ? state.selectedTemplate : '',
    parameters: state.selectedService === service ? state.parameters : {},
    generatedQuery: ''
  })),

  setSelectedTemplate: (template) => set({ 
    selectedTemplate: template,
    generatedQuery: ''
  }),

  setParameters: (parameters) => set({ parameters }),

  updateParameter: (name, value) => set((state) => ({
    parameters: {
      ...state.parameters,
      [name]: value
    }
  })),

  setGeneratedQuery: (query) => set({ generatedQuery: query }),

  addToHistory: (entry) => set((state) => {
    const newHistory = [entry, ...state.queryHistory];
    if (newHistory.length > MAX_HISTORY_ITEMS) {
      newHistory.length = MAX_HISTORY_ITEMS;
    }
    return { queryHistory: newHistory };
  }),

  clearHistory: () => set({ queryHistory: [] }),

  addToFavorites: (favorite) => set((state) => ({
    favorites: [favorite, ...state.favorites]
  })),

  updateFavorite: (id, updates) => set((state) => ({
    favorites: state.favorites.map(fav => 
      fav.id === id ? { ...fav, ...updates } : fav
    )
  })),

  removeFavorite: (id) => set((state) => ({
    favorites: state.favorites.filter(fav => fav.id !== id)
  })),

  addCustomTemplate: (template) => set((state) => ({
    customTemplates: [...state.customTemplates, template]
  })),

  updateCustomTemplate: (id, updates) => set((state) => ({
    customTemplates: state.customTemplates.map(template =>
      template.id === id ? { ...template, ...updates } : template
    )
  })),

  removeCustomTemplate: (id) => set((state) => ({
    customTemplates: state.customTemplates.filter(template => template.id !== id)
  })),

  loadConfiguration: (config) => set({
    selectedService: config.service || '',
    selectedTemplate: config.template || '',
    parameters: config.parameters || {},
    generatedQuery: config.query || ''
  }),

  reset: () => set({
    selectedService: '',
    selectedTemplate: '',
    parameters: {},
    generatedQuery: ''
  })
}));