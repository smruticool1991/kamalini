import React, { useState } from "react";
import { Link } from "react-router-dom";
import img from "../../assets/images/review/google.png";
import img2 from "../../assets/images/review/tweet.png";

function SignIn() {
  const [showPass, setShowPass] = useState(false);

  return (
    <section className="account-section">
      <div className="tf-container">
        <div className="row">
          <div className="wd-form-login">
            <h4>Log In</h4>
            <div className="nofi-form">
              <p>
                Username: <span>candidate</span> or <span>employer</span>
              </p>
              <p>
                Password: <span>jobtex</span>
              </p>
            </div>
            <form action="/">
              <div className="ip">
                <label>
                  Username or email address<span>*</span>
                </label>
                <input
                  type="text"
                  defaultValue="Tony Nguyen"
                  placeholder="Name"
                />
              </div>
              <div className="ip">
                <label>
                  Password<span>*</span>
                </label>
                <div className="inputs-group auth-pass-inputgroup">
                  <input
                    type={showPass ? "text" : "password"}
                    className="input-form password-input"
                    placeholder="Password"
                    id="password-input"
                    required
                  />
                  <Link
                    className={`password-addon ${
                      showPass ? "icon-eye" : "icon-eye-off"
                    }`}
                    id="password-addon"
                    onClick={() => setShowPass(!showPass)}
                  />
                </div>
              </div>
              <div className="group-ant-choice">
                <div className="sub-ip">
                  <input type="checkbox" />
                  Remember me
                </div>
                <Link to="#" className="forgot">
                  Fogot password?
                </Link>
              </div>
              <p className="line-ip">
                <span>or sign up with</span>
              </p>
              <Link to="#" className="btn-social">
                Continue with Facebook
              </Link>
              <Link to="#" className="btn-social">
                <img src={img} alt="images" /> Continue with Google
              </Link>
              <Link to="#" className="btn-social">
                <img src={img2} alt="images" /> Continue with Twitter
              </Link>
              <button type="submit">Login</button>
              <div className="sign-up">
                Not registered yet? <Link to="/createaccount">Sign Up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
