'use client';

import React from 'react';

interface ProfileProps {
    avatarUrl?: string;
    email?: string;
}

const Avatar: React.FC<ProfileProps> = ({ avatarUrl, email }) => {
    const getInitial = () => {
        if (email && email.length > 0) {
            return email[0].toUpperCase();
        }
        return 'U';
    };

    return (
        <>
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={`${email}'s avatar`}
                    className="w-24 h-24 rounded-full object-cover bg-white border border-neutral-200 flex"
                />
            ) : (
                <div className="w-24 h-24 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-3xl md:text-4xl font-bold text-gray-800">
                    {getInitial()}
                </div>
            )}
        </>
    );
};

export default Avatar;
