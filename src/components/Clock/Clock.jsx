import React, { useEffect, useState } from "react";
import "./Clock.css";

function Clock() {
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      var dag = new Date().getDay();
      var hours = new Date().getHours();
      var minutes = new Date().getMinutes();
      var seconds = new Date().getSeconds();
      setTime(
        (hours < 10 ? "0" : "") +
          hours +
          ":" +
          (minutes < 10 ? "0" : "") +
          minutes +
          ":" +
          (seconds < 10 ? "0" : "") +
          seconds
      );
      switch (dag) {
        case 0:
          setDays("Söndag");
          break;
        case 1:
          setDays("Måndag");
          break;
        case 2:
          setDays("Tisdag");
          break;
        case 3:
          setDays("Onsdag");
          break;
        case 4:
          setDays("Torsdag");
          break;
        case 5:
          setDays("Fredag");
          break;
        case 6:
          setDays("Lördag");
          break;
        default:
          setDays("Error");
          break;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clockContainer">
      <h2>{days}</h2>
      <h2>{time}</h2>
    </div>
  );
}

export default Clock;
