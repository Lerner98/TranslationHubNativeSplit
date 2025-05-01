// utils/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import useThemeStore from '../stores/ThemeStore';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);