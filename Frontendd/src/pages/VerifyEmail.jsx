import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState(token ? 'verifying' : 'idle'); 
  const [message, setMessage] = useState('');
  
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  
  // Yeh guard lagaya hai taaki React StrictMode double API call na kare
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (token && !hasCalledAPI.current) {
      hasCalledAPI.current = true; // Gate band kar diya
      
      const verifyAccount = async () => {
        try {
          // Backend call
          const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
          setStatus('success');
          setMessage(response.data.message);
        } catch (error) {
          setStatus('error');
          setMessage(error.response?.data?.message || 'Verification failed. The link might be expired.');
        }
      };
      verifyAccount();
    }
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus('loading');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      setResendStatus('success');
      setMessage(response.data.message);
    } catch (error) {
      setResendStatus('error');
      setMessage(error.response?.data?.message || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        
        <h2 className="text-2xl font-bold text-center mb-6 text-primary">
          Email Verification
        </h2>

        {status === 'idle' && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We've sent a verification link to your email address. Please click the link to activate your account.
            </p>
            <p className="text-sm text-gray-500 mb-6">Didn't receive it? Check your spam folder.</p>
            <Link to="/login" className="text-blue-500 hover:underline">Go to Login</Link>
          </div>
        )}

        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-green-600 dark:text-green-400 font-semibold mb-6">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Login Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-6">{message}</p>
            
            <form onSubmit={handleResend} className="mt-6 text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">Enter your email to receive a new link:</p>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" 
                className="w-full p-2 mb-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                disabled={resendStatus === 'loading'}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {resendStatus === 'loading' ? 'Sending...' : 'Resend Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;