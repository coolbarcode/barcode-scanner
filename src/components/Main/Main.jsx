import React from "react";
import "./Main.css";
import Header from "../Header/Header";
import AirtableComponent from "../Airtable";

function Main() {
  return (
    <div className="mainWrapper">
      <Header />
      <section>
        <ul>
          <li>Måndag</li>
          <li>Tisdag</li>
          <li>Onsdag</li>
          <li>Torsdag</li>
          <li>Fredag</li>
        </ul>
      </section>
      <main>
        <AirtableComponent />
      </main>
    </div>
  );
}

export default Main;
