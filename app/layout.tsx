import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'Little Rome — A town of your own',
 description: 'Build a little Roman town. Lay thoughtful streets, grow beautiful neighborhoods, and watch your city flourish.',
};
export default function RootLayout({children}: { children: React.ReactNode }) {
 return <html lang="en"><body>{children}</body></html>;
}
