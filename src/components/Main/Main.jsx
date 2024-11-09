import React, { useEffect, useState } from "react";
import "./Main.css";
import Header from "../Header/Header";
import AirtableComponent from "../Airtable";
import axios from "axios";

function Main() {
  const [data, setData] = useState(null);
  useEffect(() => {
    axios
      .get("http://192.168.198.178:1337/mat/weeks")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  if (!data) {
    return (
      <div>
        Loading...
        <AirtableComponent />
      </div>
    );
  }

  return (
    <div className="mainWrapper">
      <Header />
      <section>
        <ul>
          <li>
            <h1>Måndag</h1>
            <p
              dangerouslySetInnerHTML={{ __html: data.items[0].description }}
            ></p>
          </li>
          <li>
            <h1>Tisdag</h1>
            <p
              dangerouslySetInnerHTML={{ __html: data.items[1].description }}
            ></p>
          </li>
          <li>
            <h1>Onsdag</h1>
            <p
              dangerouslySetInnerHTML={{ __html: data.items[2].description }}
            ></p>
          </li>
          <li>
            <h1>Torsdag</h1>
            <p
              dangerouslySetInnerHTML={{ __html: data.items[3].description }}
            ></p>
          </li>
          <li>
            <h1>Fredag</h1>
            <p
              dangerouslySetInnerHTML={{ __html: data.items[4].description }}
            ></p>
          </li>
        </ul>
      </section>
      <main>
        <AirtableComponent />
      </main>
    </div>
  );
}

export default Main;
