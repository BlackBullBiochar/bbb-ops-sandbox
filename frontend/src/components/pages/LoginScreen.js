import React, { useState } from 'react';
import styles from './LoginScreen.module.css';
import helpers from '../../helpers';

import bbbLogoWhite from '../../assets/images/bbbLogoWhite.png';
import bbbLogo from '../../assets/images/bbbLogo.png';
import greenCircles from '../../assets/images/greenCircles.png';

import DottedLine from '../DottedLine';
import TextInput from '../TextInput';
import Button from '../Button';
import Checkbox from '../Checkbox';

// ← Add this at the top
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LoginScreen = ({ onLogin }) => {
  const [screenState, setScreenState]       = useState("login");
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);
  const [highlightedInput, setHighlightedInput] = useState(null);
  const [errorPrompt, setErrorPrompt]       = useState("");

  const login = async () => {
    if (!email) {
      setHighlightedInput("email");
      return;
    }
    if (!password) {
      setHighlightedInput("password");
      return;
    }
    if (!helpers.isValidEmail(email)) {
      helpers.errorPrompt(
        "Please Enter Valid Email",
        "email",
        setErrorPrompt,
        setHighlightedInput
      );
      return;
    }
    if (password.length < 6) {
      helpers.errorPrompt(
        "Please Enter Valid Password",
        "password",
        setErrorPrompt,
        setHighlightedInput
      );
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        onLogin();
      } else {
        helpers.errorPrompt(
          data.message || "Login failed",
          "email",
          setErrorPrompt,
          setHighlightedInput
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      helpers.errorPrompt(
        "Server error. Try again later.",
        "email",
        setErrorPrompt,
        setHighlightedInput
      );
    }
  };

  const goToSignUp = () => setScreenState("goToSignUp");
  const goToForgotPassword = () => setScreenState("goToForgotPassword");

  return (
    <div className={styles.BgContainer}>
      <div className={styles.BgHexOverlay} />
      <div className={styles.mainBlackContainerLogin}>
        <div className={styles.blackContainerContentLogin}>
          <div className={styles.bbbLogoWhiteContainer}>
            <img src={bbbLogoWhite} className={styles.bbbLogoWhite} alt="White Logo" />
            <div className={styles.bbbLogoText}>BLACK BULL BIOCHAR</div>
          </div>
          <div className={styles.welcomeMessageContainer}>
            <DottedLine color="grass" segmentNumber={5} segmentWidth="0.5rem" segmentHeight="1.7rem" />
            <div className={styles.welcomeMessageTextContainer}>
              <div className={styles.welcomeHeader}>
                Hello!<span className={styles.headerGreen}>&nbsp;Welcome Back.</span>
              </div>
              <div className={styles.welcomeText}>
                Do you not have an account?&nbsp;
                <span className={styles.textLink} onClick={goToSignUp}>create a new account</span>.
                <br /><br />
                Do you have a problem with our software?&nbsp;
                <a
                  href="https://www.blackbullbiochar.com/contact-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.textLink}
                >
                  Get in touch
                </a> with our team and let them know it was Adrien's fault.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainWhiteContainerLogin}>
          <div className={styles.logoContainer}>
            <img src={bbbLogo} className={styles.bbbLogo} alt="BBB Logo" />
          </div>
          <div className={styles.greenCirclesWrapper}>
            <img src={greenCircles} className={styles.greenCircle1} alt="Green Circle" />
            <img src={greenCircles} className={styles.greenCircle2} alt="Green Circle" />
          </div>
          <div className={styles.loginContent}>
            <h2 className={styles.loginHeader}>Account Login</h2>
            <TextInput
              name="Email"
              value={email}
              onChange={setEmail}
              highlighted={highlightedInput === "email"}
              iconName="envelope"
              labelStyle="top"
              placeholder="Enter Email"
              onEnter={login}                    // ← trigger login on Enter
            />
            <TextInput
              name="Password"
              value={password}
              onChange={setPassword}
              highlighted={highlightedInput === "password"}
              iconName="key"
              labelStyle="top"
              placeholder="Password"
              isPassword={true}
              onEnter={login}                    // ← trigger login on Enter
            />
            <div className={helpers.clx("errorPrompt", styles.errorPromptContainer)}>
              {errorPrompt}
            </div>
            <div className={styles.loginOptionsContainer}>
              <Checkbox
                text="Keep Me Logged In"
                checked={keepMeLoggedIn}
                onPress={() => setKeepMeLoggedIn(!keepMeLoggedIn)}
              />
              <div className={styles.forgotPassword} onClick={goToForgotPassword}>
                Forgot Password?
              </div>
            </div>
            <Button disabled={false} onPress={login} name="Login" color="Coal" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
