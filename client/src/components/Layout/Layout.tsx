import { type ReactNode } from 'react';

type Children = {
    children?: ReactNode;
};

export const Layout = ({ children }: Children) => {
    return (
        <div className="container">
            <main>
                {children}
            </main>
        </div>
    );
}
