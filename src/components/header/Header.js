import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import { RxCross2 } from "react-icons/rx";
import { BsSearch } from "react-icons/bs";
import logo from "./logo.png";
import { Link } from "react-router-dom";
import { HiHome, HiBars3BottomRight } from "react-icons/hi2";
import { IoCompass, IoTrendingUp } from "react-icons/io5";
import { AiFillInfoCircle } from "react-icons/ai";

const Header = () => {
  const [isSearchClick, setIsSearchClick] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isMoreOptions, setIsMoreOptions] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target[0].value;
    navigate(`/search/${searchQuery}`);
  };

  const navLinks = [
    { title: "Home", link: "/", icon: <HiHome size="100%" /> },
    {
      title: "Trending",
      link: "/trending",
      icon: <IoTrendingUp size="100%" />,
    },
    {
      title: "Explore",
      link: "/explore",
      icon: <IoCompass size="100%" />,
    },
    { title: "More", icon: <HiBars3BottomRight size="100%" /> },
  ];

  const currentPath = window.location.pathname;

  useEffect(() => {
    if (isSearchClick) {
      inputRef.current?.focus();
    }
  }, [isSearchClick]);

  useEffect(() => {
    document.body.style.overflow = isMoreOptions ? "hidden" : "";
  }, [isMoreOptions]);

  return (
    <div className="header-nav-container">
      <header className="header-section">
        <div className="header-container container">
          <Link to="/" className="header-logo-wrapper">
            <img className="header-logo" src={logo} alt="logo" />
          </Link>
          <div
            className="search-icon-wrapper mobile-search-icon absolute-center"
            onClick={() => setIsSearchClick(!isSearchClick)}
          >
            {!isSearchClick ? (
              <BsSearch style={{ width: "100%", height: "100%" }} />
            ) : (
              <RxCross2 style={{ width: "100%", height: "100%" }} />
            )}
          </div>
          <form
            className={`header-search-wrapper ${
              isSearchClick ? "mobile-search" : ""
            }`}
            onSubmit={handleSearch}
          >
            <div className="search-icon-wrapper absolute-center">
              <BsSearch
                style={{ width: "100%", height: "100%", color: "black" }}
              />
            </div>

            <input
              type="text"
              name="search"
              className="search-input"
              placeholder="Search songs"
              ref={inputRef}
            />
            <button type="submit" className="search-btn cur-pointer">
              Search
            </button>
          </form>
        </div>
      </header>
      {/* bottom navigantion options  */}
      <nav className="bottom-nav-container ">
        <div className="bottom-nav-wrapper container">
          {navLinks.map((item, index) =>
            item.link ? (
              <Link
                key={index}
                to={item.link}
                title={item.title}
                className={`bottom-nav-link absolute-center ${
                  currentPath === item.link && !isMoreOptions
                    ? "active-link"
                    : ""
                }`}
              >
                {item.icon}
                <span
                  className={`${
                    currentPath === item.link && !isMoreOptions
                      ? "bottom-nav-text"
                      : "hide"
                  }`}
                >
                  {item.title}
                </span>
              </Link>
            ) : (
              <button
                key={index}
                title={item.title}
                className={`bottom-nav-link more-btn absolute-center ${
                  isMoreOptions ? "active-link" : ""
                }`}
                onClick={() => setIsMoreOptions(true)}
              >
                {item.icon}
                <span
                  className={`${isMoreOptions ? "bottom-nav-text" : "hide"}`}
                >
                  {item.title}
                </span>
              </button>
            )
          )}
        </div>
      </nav>

      {/* More options container */}
      <div
        className={`more-options-container ${
          isMoreOptions
            ? "more-options-container-visible"
            : "more-options-container-hide"
        }`}
      >
        <div
          className="more-options-overlayer model-overlayer"
          onClick={() => setIsMoreOptions(false)}
        ></div>
        <div
          className={`more-options-model ${
            !isMoreOptions ? "more-options-model-inActive" : ""
          }`}
        >
          <div className="more-options-logo-wrapper">
            <img className="header-logo" src={logo} alt="logo" />
            <button
              type="button"
              title="close"
              className="close-btn absolute-center"
              onClick={() => setIsMoreOptions(false)}
            >
              <RxCross2 size={25} />
            </button>
          </div>
          <div className="more-options-list">
            <div className="absolute-center">
              <AiFillInfoCircle size={20} />
              About us
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
