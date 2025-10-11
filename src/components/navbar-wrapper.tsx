"use client"
import { Navbar } from '@/components/navbar'
import { usePathname } from 'next/navigation'

export default function NavbarWrapper() {
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/register');
  if (hideNavbar) return null;
  return <Navbar />;
}
