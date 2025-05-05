import { amber, blue, green, grey, pink, red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// Function to create theme with the specified mode
export const createAppTheme = (mode: 'light' | 'dark' = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: blue[700],
        light: blue[400],
        dark: blue[800],
        contrastText: '#fff',
      },
      secondary: {
        main: pink[500],
        light: pink[300],
        dark: pink[700],
        contrastText: '#fff',
      },
      error: {
        main: red[500],
        light: red[300],
        dark: red[700],
        contrastText: '#fff',
      },
      warning: {
        main: amber[500],
        light: amber[300],
        dark: amber[700],
        contrastText: isDark ? '#fff' : 'rgba(0, 0, 0, 0.87)',
      },
      info: {
        main: blue[500],
        light: blue[300],
        dark: blue[700],
        contrastText: '#fff',
      },
      success: {
        main: green[500],
        light: green[300],
        dark: green[700],
        contrastText: isDark ? '#fff' : 'rgba(0, 0, 0, 0.87)',
      },
      background: {
        paper: isDark ? '#121212' : '#fff',
        default: isDark ? '#121212' : '#f5f5f5',
      },
      text: {
        primary: isDark ? '#fff' : 'rgba(0, 0, 0, 0.87)',
        secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        disabled: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.38)',
      },
      grey: grey,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
          },
        },
      },
    },
  });
};

// Export default theme (light mode)
export default createAppTheme();
