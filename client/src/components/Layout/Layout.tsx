import { type ReactNode } from 'react';

type Children = {
    children?: ReactNode;
};

export const Layout = ({ children }: Children) => {
    return (
        <div className="container" style={{ userSelect: "none" }}>
            <main>
                {children}
            </main>
        </div>
    );
}
