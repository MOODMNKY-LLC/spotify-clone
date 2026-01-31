'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from './login-form';
import { SignUpForm } from './sign-up-form';
import { Modal } from './Modal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useUser } from '@/hooks/useUser';

/**
 * Auth modal: "Sign Up" in header opens create-account view, "Log in" opens login view.
 * View is set by onOpen('sign-up') | onOpen('login') so the correct form is shown.
 */
export const AuthModal = () => {
  const router = useRouter();
  const { user } = useUser();
  const { onClose, isOpen, view, setView } = useAuthModal();

  useEffect(() => {
    if (user) {
      router.refresh();
      onClose();
    }
  }, [user, router, onClose]);

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleLoginSuccess = () => {
    router.refresh();
    onClose();
  };

  const isLogin = view === 'login';

  return (
    <Modal
      title={isLogin ? 'Welcome back' : 'Create an account'}
      description={isLogin ? 'Login to your account to continue' : 'Sign up to get started'}
      isOpen={isOpen}
      onChange={onChange}
      showAppIcon
      variant="auth"
    >
      {isLogin ? (
        <LoginForm
          key="login"
          onSuccess={handleLoginSuccess}
          embedded
          onSwitchToSignUp={() => setView('sign-up')}
        />
      ) : (
        <SignUpForm
          key="sign-up"
          embedded
          onSwitchToLogin={() => setView('login')}
        />
      )}
    </Modal>
  );
};
