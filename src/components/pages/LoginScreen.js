// LoginScreen.js
import {Navigate, useNavigate } from "react-router-dom";
import { useState, useCallback, useContext, useEffect } from "react";
import { API } from '../../config/api';

import { UserContext } from "../../UserContext.js";
import helpers from "../../helpers.js";
import styles from './LoginScreen.module.css'; // your existing styles

import TextInput from "../TextInput.js"; 
import Button from "../Button.js";
import Checkbox from "../Checkbox.js";
import DottedLine from "../DottedLine.js";

import bbbLogoWhite from '../../assets/images/bbbLogoWhite.png';
import bbbLogo from '../../assets/images/bbbLogo.png';
import greenCircles from '../../assets/images/greenCircles.png';
import { set } from "date-fns";

function LoginScreen(props) {
  const { user, setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(true);

  const [screenState, setScreenState] = useState("login");
  const [errorPrompt, setErrorPrompt] = useState("");
  const [highlightedInput, setHighlightedInput] = useState("");

  const navigate = useNavigate();

  const login = useCallback(async () => {
    // 1) Validate inputs
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

    // 2) Figure out API before making request
    // 3) Send login request
    let response;
    try {
      response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      console.error("Network error during login:", err);
      helpers.errorPrompt(
        "Network error. Try again later.",
        "email",
        setErrorPrompt,
        setHighlightedInput
      );
      return;
    }

    const jsonResponse = await response.json();

    if (!jsonResponse.success) {
      helpers.errorPrompt(
        jsonResponse.message || "Invalid Username / Password",
        "",
        setErrorPrompt,
        setHighlightedInput
      );
      return;
    }

    // 4) Build a fresh userObj (overwrite any existing fields)
    const userObj = {
      API,       // needed for subsequent fetches
      token: jsonResponse.data.token,
      details: {},
      authed: true,
    };

    // 5) Fill in userObj.details (admin vs. normal user)
    if (jsonResponse.data.isAdmin) {
      // Admin login path
      userObj.details.id = jsonResponse.data.user._id;
      userObj.details.email = jsonResponse.data.user.email;
      userObj.details.firstName = jsonResponse.data.user.first_name;
      userObj.details.lastName = jsonResponse.data.user.last_name;
      userObj.details.privileges = jsonResponse.data.user.privileges;
      userObj.details.language = jsonResponse.data.user.language;

      // 6) Persist token if requested
      if (keepMeLoggedIn) {
        localStorage.setItem("token", userObj.token);
      } else {
        localStorage.removeItem("token");
      }

      // 7) Call your existing helper to set context and navigate
      props.setAdminDetails(userObj, jsonResponse.data, keepMeLoggedIn);
      setUser(userObj);
      setScreenState("Upload");
      navigate("/upload");
      return;

    } else {
      // Normal user login path
      userObj.details.id = jsonResponse.data.user._id;
      userObj.details.email = jsonResponse.data.user.email;
      userObj.details.businessName = jsonResponse.data.user.business_name;
      userObj.details.firstName = jsonResponse.data.user.first_name;
      userObj.details.lastName = jsonResponse.data.user.last_name;
      userObj.details.country = jsonResponse.data.user.country;
      userObj.details.language = jsonResponse.data.user.language;

      // 6) Persist token if requested
      if (keepMeLoggedIn) {
        localStorage.setItem("token", userObj.token);
      } else {
        localStorage.removeItem("token");
      }

      // 7) Call your existing helper to set context and navigate
      props.setUserDetails(userObj, jsonResponse.data, keepMeLoggedIn);
      setUser(userObj);
      setScreenState("goToDataAnalysis");
      navigate("/data-analysis");
      return;
    }
  }, [email, password, keepMeLoggedIn, props, setUser, navigate]);

  // Trigger login when ENTER key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        login();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [login]);

  const goToSignUp = useCallback(() => {
    setScreenState("goToSignUp");
    setTimeout(() => navigate("/signup"), 700);
  }, [navigate]);

  const goToForgotPassword = useCallback(() => {
    setScreenState("goToForgotPassword");
    setTimeout(() => navigate("/forgot-password"), 700);
  }, [navigate]);

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
                <span className={styles.textLink} onClick={goToSignUp}>
                  create a new account
                </span>.
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
