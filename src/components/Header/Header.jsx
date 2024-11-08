import React from "react";
//@ts-ignore
import Clock from "../Clock/Clock";
import "../Main/Main.css";
import logo from "../../assets/logo.svg";

function Header() {
  return (
    <header>
      <img src={logo} alt="logo" />
      <Clock />
    </header>
  );
}

export default Header;
