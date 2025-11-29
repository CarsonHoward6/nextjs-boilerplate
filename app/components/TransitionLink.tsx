"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "@/app/context/LoadingContext";
import { ReactNode, MouseEvent } from "react";

interface TransitionLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    title?: string;
    onClick?: () => void;
}

export default function TransitionLink({ href, children, className, title, onClick }: TransitionLinkProps) {
    const router = useRouter();
    const { startLoading, stopLoading } = useLoading();

    function handleClick(e: MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();

        if (onClick) onClick();

        startLoading();

        // Navigate after a brief delay to show loading
        setTimeout(() => {
            router.push(href);
            // Stop loading after navigation completes
            setTimeout(() => {
                stopLoading();
            }, 1000);
        }, 50);
    }

    return (
        <a href={href} onClick={handleClick} className={className} title={title}>
            {children}
        </a>
    );
}