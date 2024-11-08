import React, { useState, useEffect } from "react";
import Scanner from "./Scanner";
import Airtable from "airtable";
import * as XLSX from "xlsx";

const baseId = process.env.REACT_APP_AIRTABLE_BASEID;
const airtableApiKey = process.env.REACT_APP_AIRTABLE_APIKEY;

// Airtable setup
const base = new Airtable({ apiKey: airtableApiKey }).base(baseId);

function AirtableComponent() {
  const [datum, setDatum] = useState(new Date().toLocaleDateString()); // Date for report
  const [namnArray, setnamnArray] = useState([]); // Array to save unique names
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
      };

      // Save name in namnArray and all in listItems
      setnamnArray((prev) => [...prev, namn]);
      setListItems((prev) => [...prev, newItem]);
    } else {
      // Additional functionality if someone scans multiple times
      return;
    }
  }

  // Function to update the date every day
  function updateDate() {
    setDatum(new Date().toLocaleDateString());
  }

  // Function to create a report table and download it
  const createReportTable = () => {
    // Initialize an array to accumulate data
    const reportData = listItems.map((item) => ({
      Ankomst: item.time,
      Namn: item.namn,
      Personal: item.isPersonal !== undefined ? item.isPersonal : false,
    }));

    console.log(reportData);

    // Create the worksheet
    const ws = XLSX.utils.json_to_sheet(reportData);

    // Create a new workbook and append the sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Create the Excel file and download it
    XLSX.writeFile(wb, `report_${datum}.xlsx`);
  };

  // Use a single daily interval to update date and run createReportTable
  useEffect(() => {
    const dailyInterval = setInterval(() => {
      updateDate();
    }, 1000 * 60 * 60 * 24); // Update every 24 hours

    return () => clearInterval(dailyInterval); // Cleanup interval when component unmounts
  }, []);

  // Update time every second, displayed when someone scans
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval); // Cleanup time interval
  }, []);

  // Fetch data from Airtable and compare with scanned barcodes
  useEffect(() => {
    if (!scanned) return;

    base("data")
      .select({ fields: ["Id", "Namn", "isPersonal", "isVip"] })
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
  }, [scanned]); // Runs whenever 'scanned' changes

  // Render table with all scanned items
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
