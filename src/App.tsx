import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { getFCMToken } from './firebase';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Define a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FFB6C1', // Light Pink
    },
    secondary: {
      main: '#ADD8E6', // Light Blue
    },
    background: {
      default: '#F0F8FF', // Alice Blue
      paper: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white for glassmorphism
    },
  },
  typography: {
    fontFamily: '"M PLUS Rounded 1c", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#4682B4', // Steel Blue
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            '& fieldset': {
              borderColor: '#ADD8E6',
            },
            '&:hover fieldset': {
              borderColor: '#FFB6C1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFB6C1',
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"M PLUS Rounded 1c", sans-serif',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          '& fieldset': {
            borderColor: '#ADD8E6',
          },
          '&:hover fieldset': {
            borderColor: '#FFB6C1',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#FFB6C1',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '50px', // Add some top padding to the container
        },
      },
    },
  },
});

function App() {
  const [biasName, setBiasName] = useState('');
  const [biasTone, setBiasTone] = useState('');
  const [notificationTime, setNotificationTime] = useState<Dayjs | null>(dayjs());
  const [interval, setInterval] = useState(0); // 0 for one-time
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('fcm_token');
    if (storedToken) {
      setFcmToken(storedToken);
      setIsSubscribed(true);
    }
  }, []);

  const handleSubscribe = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const token = await getFCMToken();
      if (token) {
        let finalNotificationTime = dayjs();
        if (notificationTime) {
          const now = dayjs();
          let selectedTime = dayjs()
            .hour(notificationTime.hour())
            .minute(notificationTime.minute())
            .second(0);

          if (selectedTime.isBefore(now)) {
            // If the selected time is in the past for today, schedule it for tomorrow
            selectedTime = selectedTime.add(1, 'day');
          }
          finalNotificationTime = selectedTime;
        }

        // Send token to your backend to save it
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken: token,
            biasName,
            biasTone,
            notificationTime: finalNotificationTime.toISOString(),
            notification_interval: interval,
          }),
        });
        setFcmToken(token);
        setIsSubscribed(true);
        localStorage.setItem('fcm_token', token);
        setStatusMessage('알림을 구독했습니다!');
      } else {
        setErrorMessage('알림 권한이 허용되지 않았습니다.');
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      setErrorMessage('알림 구독에 실패했습니다.');
    }
  };

  const handleUnsubscribe = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (fcmToken) {
        // Send token to your backend to remove it
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken }),
        });
        setFcmToken(null);
        setIsSubscribed(false);
        localStorage.removeItem('fcm_token');
        setStatusMessage('알림 구독을 취소했습니다.');
      }
    } catch (error) {
      console.error('Unsubscription failed:', error);
      setErrorMessage('알림 구독 취소에 실패했습니다.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Typography variant="h4" gutterBottom>
          최애의 알리미
        </Typography>

        {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}
        {statusMessage && <Alert severity="success" onClose={() => setStatusMessage(null)}>{statusMessage}</Alert>}

        <Box
          component="form"
          sx={{
            '& .MuiTextField-root, & .MuiFormControl-root': { m: 1, width: '100%' },
            '& .MuiButton-root': { m: 1, width: '100%' },
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3, // Padding inside the box
            borderRadius: '25px', // Rounded corners for the box
            backgroundColor: theme.palette.background.paper, // Semi-transparent background
            backdropFilter: 'blur(10px)', // Glassmorphism blur effect
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', // Soft shadow
            border: '1px solid rgba(255, 255, 255, 0.18)', // Subtle border
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            label="최애 이름"
            variant="outlined"
            value={biasName}
            onChange={(e) => setBiasName(e.target.value)}
          />
          <TextField
            label="최애 말투 (~했당, ~라네 등)"
            variant="outlined"
            value={biasTone}
            onChange={(e) => setBiasTone(e.target.value)}
            helperText="알림 메시지가 이 말투로 끝나게 됩니다."
          />
          <TimePicker
            label="첫 알림 시간"
            value={notificationTime}
            onChange={(newValue) => setNotificationTime(newValue)}
          />
          <FormControl fullWidth>
            <InputLabel id="interval-select-label">알림 주기</InputLabel>
            <Select
              labelId="interval-select-label"
              id="interval-select"
              value={interval}
              label="알림 주기"
              onChange={(e) => setInterval(Number(e.target.value))}
            >
              <MenuItem value={0}>한 번만</MenuItem>
              <MenuItem value={1}>1시간마다</MenuItem>
              <MenuItem value={6}>6시간마다</MenuItem>
              <MenuItem value={12}>12시간마다</MenuItem>
              <MenuItem value={24}>24시간마다</MenuItem>
            </Select>
          </FormControl>

          <Box mt={4} width="100%">
            {!isSubscribed ? (
              <Button variant="contained" color="primary" onClick={handleSubscribe}>
                알림 구독
              </Button>
            ) : (
              <Button variant="contained" color="error" onClick={handleUnsubscribe}>
                알림 구독 취소
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;