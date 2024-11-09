import React, { useState, useEffect } from "react";
import Scanner from "./Scanner";
import Airtable from "airtable";
import { db, analytics, app } from "./firebase/firebase";
import * as XLSX from "xlsx";

const baseId = process.env.REACT_APP_AIRTABLE_BASEID;
const airtableApiKey = process.env.REACT_APP_AIRTABLE_APIKEY;

// Airtable setup
const base = new Airtable({ apiKey: airtableApiKey }).base(baseId);

function AirtableComponent() {
  const [datum, setDatum] = useState(new Date().toLocaleDateString()); // Date for report
  const [namnArray, setNamnArray] = useState([]); // Array to save unique names
  const [listItems, setListItems] = useState([]); // Array to save all items
  const [scanned, setScanned] = useState(""); // Scanned barcode that updates namnArray
  const [currentTime, setCurrentTime] = useState(""); // Used for the scan time

  // Function to handle scanned barcodes, lowercase and trim whitespace
  function handleSubmit(barcode) {
    setScanned(barcode.toLowerCase().trim());
  }

  function addItem(record) {
    const namn = record.get("Namn");

    if (!namnArray.includes(namn)) {
      const newItem = {
        namn: namn,
        isPersonal: record.get("isPersonal"),
        isVip: record.get("isVip"),
        time: currentTime,
        TotalaÄtit: record.get("TotalaÄtit"),
      };

      // Update "TotalaÄtit" field in Airtable for the record
      base("data").update(
        record.id,
        {
          TotalaÄtit: (record.get("TotalaÄtit") || 0) + 1,
        },
        (err, updatedRecord) => {
          if (err) {
            console.error("Error updating TotalaÄtit:", err);
            return;
          }
          console.log("Updated TotalaÄtit for", updatedRecord.fields.Namn);
        }
      );

      // Save name in namnArray and add newItem to listItems
      setNamnArray((prev) => [...prev, namn]);
      setListItems((prev) => [...prev, newItem]);
    }
  }

  // Function to update the date every day
  function updateDate() {
    setDatum(new Date().toLocaleDateString());
  }

  // Function to create a report table and download it
  const createReportTable = () => {
    const reportData = listItems.map((item) => ({
      Ankomst: item.time,
      Namn: item.namn,
      Personal: item.isPersonal !== undefined ? item.isPersonal : false,
    }));

    console.log(reportData);

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, `report_${datum}.xlsx`);
  };

  // Update the date every 24 hours
  useEffect(() => {
    const dailyInterval = setInterval(updateDate, 1000 * 60 * 60 * 24);
    return () => clearInterval(dailyInterval);
  }, []);

  // Update the time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data from Airtable and compare with scanned barcodes
  useEffect(() => {
    if (!scanned) return;

    base("data")
      .select({ fields: ["Id", "Namn", "isPersonal", "isVip", "TotalaÄtit"] })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            if (record.get("Id") === scanned) {
              console.log(
                "Match found:",
                record.get("Id"),
                record.get("Namn"),
                record.get("isPersonal") ? "Personal" : ""
              );
              addItem(record);
              setScanned(""); // Reset scanned after processing
              return;
            }
          });
          fetchNextPage();
        },
        (err) => {
          if (err) console.error(err);
        }
      );
  }, [scanned]);

  return (
    <div>
      <Scanner onScan={handleSubmit} />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {listItems.map((item, index) => (
            <tr
              key={index}
              style={{
                color: item.isVip
                  ? "#FFD700"
                  : item.isPersonal
                  ? "#ab14b0"
                  : "#000",
              }}
            >
              <td>{item.namn}</td>
              <td>{item.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={createReportTable}>Send Report</button>
    </div>
  );
}

export default AirtableComponent;
