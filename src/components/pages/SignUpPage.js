import React, { useState } from 'react';
import styles from './SignUpPage.module.css';
import helpers from '../../helpers';
import { useNavigate } from 'react-router-dom';

import bbbLogoWhite from '../../assets/images/bbbLogoWhite.png';
import bbbLogo from '../../assets/images/bbbLogo.png';
import greenCircles from '../../assets/images/greenCircles.png';

import DottedLine from '../DottedLine';
import TextInput from '../TextInput';
import Button from '../Button';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SignUpPage = ({ onSignUp }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [highlightedInput, setHighlightedInput] = useState(null);
  const [errorPrompt,      setErrorPrompt]      = useState("");

  const navigate = useNavigate();
  const goToLogin = () => navigate('/login');

  const signUp = async () => {
    if (!firstName) {
      setHighlightedInput("firstName");
      return;
    }
    if (!lastName) {
      setHighlightedInput("lastName");
      return;
    }
    if (!email) {
      setHighlightedInput("email");
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
    if (!password || password.length < 6) {
      helpers.errorPrompt(
        "Password must be at least 6 characters",
        "password",
        setErrorPrompt,
        setHighlightedInput
      );
      return;
    }

    const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        first_name: firstName,
        last_name:  lastName,
        email,
        password,
    }),
    });
    const data = await res.json();

    if (res.ok) {
    localStorage.setItem("token", data.token);
    onSignUp();   // navigates into your app
    } else {
    helpers.errorPrompt(data.message, /* … */);
    }


    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password
        }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        onSignUp();
      } else {
        helpers.errorPrompt(
          data.message || "Signup failed",
          "email",
          setErrorPrompt,
          setHighlightedInput
        );
      }
    } catch (err) {
      console.error("Signup error:", err);
      helpers.errorPrompt(
        "Server error. Try again later.",
        "email",
        setErrorPrompt,
        setHighlightedInput
      );
    }
  };

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
                Join Us!<span className={styles.headerGreen}>&nbsp;Create Account.</span>
              </div>
              <div className={styles.welcomeText}>
                Already have an account?&nbsp;
                <span className={styles.textLink} onClick={goToLogin}>
                  log in here
                </span>.
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
            <h2 className={styles.loginHeader}>Sign Up</h2>
            <TextInput
              name="First Name"
              value={firstName}
              onChange={setFirstName}
              highlighted={highlightedInput === "firstName"}
              iconName="user"
              labelStyle="top"
              placeholder="First Name"
              onEnter={signUp}
            />
            <TextInput
              name="Last Name"
              value={lastName}
              onChange={setLastName}
              highlighted={highlightedInput === "lastName"}
              iconName="user"
              labelStyle="top"
              placeholder="Last Name"
              onEnter={signUp}
            />
            <TextInput
              name="Email"
              value={email}
              onChange={setEmail}
              highlighted={highlightedInput === "email"}
              iconName="envelope"
              labelStyle="top"
              placeholder="Enter Email"
              onEnter={signUp}
            />
            <TextInput
              name="Password"
              value={password}
              onChange={setPassword}
              highlighted={highlightedInput === "password"}
              iconName="key"
              labelStyle="top"
              placeholder="Password"
              isPassword
              onEnter={signUp}
            />
            <div className={helpers.clx("errorPrompt", styles.errorPromptContainer)}>
              {errorPrompt}
            </div>
            <Button onPress={signUp} name="Sign Up" color="Coal" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
