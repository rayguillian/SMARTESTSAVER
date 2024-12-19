import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('User signed in successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      setMessage('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setMessage('User signed in with Google successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setMessage('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            {message && <p className="text-red-500">{message}</p>}
            <div>
              <label>Email:</label>
              <Input type="email" name="email" required />
            </div>
            <div>
              <label>Password:</label>
              <Input type="password" name="password" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </CardContent>
        </form>
        <CardFooter>
          <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full">
            {loading ? 'Signing In...' : 'Sign In with Google'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignInPage;
