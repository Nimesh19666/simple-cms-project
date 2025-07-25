import { AuthProvider } from './context/AuthContext';
import './globals.css';

export const metadata = {
    title: 'Simple CMS',
    description: 'A simple CMS with AI features',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}