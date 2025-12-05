"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import TransitionLink from "./components/TransitionLink";
import "./landing.css";

export default function Home() {
  const { user, loading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setShowContent(true), 100);
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-spinner-container">
          <div className="landing-spinner"></div>
          <p className="landing-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-background-gradient"></div>

      {/* Home Icon - Only show when logged in */}
      {user && (
        <div className="landing-home-icon">
          <TransitionLink href="/lms" className="landing-home-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </TransitionLink>
        </div>
      )}

      <div className={`landing-content ${showContent ? 'visible' : ''}`}>
        <div className="landing-logo-container">
          <svg className="landing-logo-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h1 className="landing-title">
          <span className="landing-title-word">Learn</span>
          <span className="landing-title-word">Manage</span>
          <span className="landing-title-word">Succeed</span>
        </h1>
        <p className="landing-subtitle">Your comprehensive learning management system</p>

        {!user && (
          <div className="landing-buttons">
            <TransitionLink href="/login" className="landing-btn landing-btn-primary">
              <span>Log in</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </TransitionLink>
            <TransitionLink href="/signup" className="landing-btn landing-btn-secondary">
              <span>Sign up</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </TransitionLink>
          </div>
        )}

        <div className="landing-features">
          <div className="landing-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>Track Progress</span>
          </div>
          <div className="landing-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Collaborate</span>
          </div>
          <div className="landing-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Achieve Goals</span>
          </div>
        </div>
        <footer className="landing-footer">Created by Carson</footer>
      </div>
    </div>
  );
}
