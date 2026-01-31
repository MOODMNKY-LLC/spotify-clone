import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';

//* Declaring the type for the Modal component's properties
interface ModalProps {
  isOpen: boolean;
  onChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  /** When true, show app icon above the title (e.g. for auth modals) */
  showAppIcon?: boolean;
  /** When 'auth', uses PWA-style colors (neutral-800) and hides the close button */
  variant?: 'default' | 'auth';
}

//* Modal component using React Function Component with ModalProps
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onChange,
  title,
  description,
  children,
  showAppIcon = false,
  variant = 'default',
}) => {
  const isAuth = variant === 'auth';
  const contentClass = isAuth
    ? 'fixed drop-shadow-xl border border-neutral-700 ring-1 ring-neutral-700 top-[50%] left-[50%] max-h-full h-full md:h-auto md:max-h-[85vh] w-full md:w-[90vw] md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-neutral-800 p-6 focus:outline-none'
    : 'fixed drop-shadow-xl border border-border top-[50%] left-[50%] max-h-full h-full md:h-auto md:max-h-[85vh] w-full md:w-[90vw] md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-card p-6 focus:outline-none';

  return (
    <Dialog.Root open={isOpen} defaultOpen={isOpen} onOpenChange={onChange}>
      <Dialog.DialogPortal>
        <Dialog.Overlay className="bg-[#1A1A1A]/90 backdrop-blur-sm fixed inset-0" />
        <Dialog.Content className={contentClass}>
          {showAppIcon && (
            <div className="flex justify-center mb-5">
              <Image
                src="/images/mnky-muzik-app-icon.png"
                alt=""
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
          )}
          <Dialog.Title className="text-xl text-center font-bold text-white mb-1">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-normal text-center text-neutral-400 mb-5">
            {description}
          </Dialog.Description>
          <div className="overflow-y-auto min-h-0">{children}</div>
          {!isAuth && (
            <Dialog.Close asChild>
              <button
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close"
              >
                <IoMdClose className="h-5 w-5" />
              </button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.DialogPortal>
    </Dialog.Root>
  );
};
