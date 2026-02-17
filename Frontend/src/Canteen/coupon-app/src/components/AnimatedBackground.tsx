import React from 'react';
import './AnimatedBackground.css';

export const AnimatedBackground: React.FC = () => {
    return (
        <div className="animated-bg">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="grid-overlay"></div>
        </div>
    );
};
