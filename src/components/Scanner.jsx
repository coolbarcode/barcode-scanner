import React, { useState, useEffect, useRef } from "react";

const Scanner = ({ onScan }) => {
  const [id, setId] = useState("");
  const timeout = useRef(null);
  // Lyssna på keydown för att skanna streckkoder.
  //Eftersom att scanningen av en barcode är samma sak som att skriva datan i barcoden och sen klicka enter.
  useEffect(() => {
    function handleKeydown(evt) {
      if (evt.code === "Enter" || evt.key === "\n") {
        if (id) {
          onScan(id); // Skicka id till onScan funktionen.
          setId("");
        }
        return;
      }

      if (evt.key !== "Shift") {
        setId((prevBarcode) => prevBarcode + evt.key);
      }

      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setId(""), 3000);
    }

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearTimeout(timeout.current);
    };
  }, [id, onScan]);

  return;
};

export default Scanner;
