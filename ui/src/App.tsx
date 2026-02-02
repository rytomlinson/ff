import { createUseStyles, ThemeProvider } from 'react-jss';
import { lightTheme, type PathTheme } from './utils/theme.js';
import Map from './components/Map/Map.js';
import TripList from './components/TripList/TripList.js';
import TripForm from './components/TripForm/TripForm.js';
import TripDetail from './components/TripDetail/TripDetail.js';
import { useWebSocket } from './hooks/index.js';

const useStyles = createUseStyles<string, object, PathTheme>((theme) => ({
  '@global': {
    body: {
      fontFamily: theme.fontFamily,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
    },
    '*': {
      boxSizing: 'border-box',
    },
    '::-webkit-scrollbar': {
      width: 8,
      height: 8,
    },
    '::-webkit-scrollbar-track': {
      background: theme.colors.background.primary,
    },
    '::-webkit-scrollbar-thumb': {
      background: theme.colors.border.primary,
      borderRadius: 4,
      '&:hover': {
        background: theme.colors.border.secondary,
      },
    },
  },
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
    height: '100%',
  },
  main: {
    flex: 1,
    height: '100%',
  },
}));

function AppContent() {
  const classes = useStyles();

  // Connect to WebSocket for real-time updates
  useWebSocket();

  const handleMapClick = (lng: number, lat: number) => {
    console.log(`Map clicked at: ${lng}, ${lat}`);
  };

  return (
    <div className={classes['container']}>
      <div className={classes['sidebar']}>
        <TripList />
      </div>
      <div className={classes['main']}>
        <Map onMapClick={handleMapClick} />
      </div>
      <TripForm />
      <TripDetail />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <AppContent />
    </ThemeProvider>
  );
}
