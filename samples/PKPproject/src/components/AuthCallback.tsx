import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Give SDK time to complete OAuth
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return <LoadingSpinner />;
};
