import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const auth = getAuth();

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage('User signed up successfully');
    } catch (error) {
      console.error('Error signing up:', error);
      setMessage('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
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
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default SignUpPage;
