import AuthPage from '../../components/Auth/AuthPage';

export const metadata = {
  title: 'BytBoom — Sign Up',
  description: 'Create your BytBoom trading account',
};

export default function SignupPage() {
  return <AuthPage initialMode="signup" />;
}
