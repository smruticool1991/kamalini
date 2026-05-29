import React from "react";
import img from "../../assets/images/review/bg-popup.jpg";

function PopUpForm() {
  const handleClosePopup = () => {
    const getPopup = document.querySelector(".wd-popup-form");
    getPopup.classList.remove("modal-menu--open");
  };

  return (
    <div className="wd-popup-form">
      <div className="modal-menu__backdrop" onClick={handleClosePopup} />
      <div className="content">
        <div className="content-left">
          <div className="thumb">
            <img src={img} alt="images" />
          </div>
        </div>
        <div className="content-right">
          <button className="title-button-group" onClick={handleClosePopup} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="icon-close" />
          </button>
          <h6>Welcome to jobitex</h6>
          <p>
            Sign up to get all the latest Jobtex news, website updates, offers
            and promos.
          </p>
          <form>
            <input type="text" placeholder="Email" />
            <div className="group-radio">
              <input type="radio" />
              <label>Prevent this Pop-up</label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PopUpForm;
