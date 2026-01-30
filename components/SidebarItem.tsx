import { IconType } from 'react-icons';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

//* Declaring the type for the SidebarItem component's properties
interface SidebarItemProps {
  icon?: IconType;
  /** Custom node (e.g. app icon image) used instead of icon when provided */
  iconNode?: React.ReactNode;
  label: string;
  active?: boolean;
  href: string;
}

//* SidebarItem component using React Function Component with SidebarItemProps
export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, iconNode, label, active, href }) => {
  //* The component includes a Link component, which is used for navigation
  return (
    <Link
      href={href}
      className={twMerge(
        `
        flex
        flex-row
        h-auto
        items-center
        w-full
        gap-x-4
        text-md
        font-medium
        cursor-pointer
        hover:text-white
        transition
        text-neutral-400
        py-2
        min-h-[44px]
        items-center
        `,
        active && 'text-white'
      )}
    >
      <span className="w-10 shrink-0 flex items-center">
        {iconNode ?? (Icon != null && <Icon size={26} />)}
      </span>
      <p className="truncate w-100">{label}</p>
    </Link>
  );
};
