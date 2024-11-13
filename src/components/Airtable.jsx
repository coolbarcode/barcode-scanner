import React, { useState, useEffect, useCallback } from "react";
import Scanner from "./Scanner";
import * as XLSX from "xlsx";
import Airtable from "airtable";

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.REACT_APP_AIRTABLE_APIKEY,
}).base(process.env.REACT_APP_AIRTABLE_BASEID);

// Optional: Define styles here or use a CSS module
const styles = {
  tableRow: (isPersonal) => ({
    color: isPersonal ? "#ab14b0" : "#000",
  }),
};

function DataFetcher() {
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString());
  const [userSet, setUserSet] = useState(new Set());
  const [listItems, setListItems] = useState([]);
  const [scanned, setScanned] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [scannedCache, setScannedCache] = useState({});

  // Handle scanned barcode
  const handleSubmit = useCallback((barcode) => {
    setScanned(barcode.toLowerCase().trim());
  }, []);

  // Add item to the list if username is unique
  const addItem = useCallback(
    (record) => {
      const username = record.username;

      if (!userSet.has(username)) {
        const newItem = {
          username,
          isPersonal: record.isPersonal || false,
          time: currentTime,
        };

        setUserSet((prevSet) => new Set(prevSet).add(username));
        setListItems((prevItems) => [...prevItems, newItem]);
      }
    },
    [userSet, currentTime]
  );

  // Update the report date daily
  useEffect(() => {
    const updateDate = () => {
      setReportDate(new Date().toLocaleDateString());
    };

    const dailyInterval = setInterval(updateDate, 1000 * 60 * 60 * 24);
    return () => clearInterval(dailyInterval);
  }, []);

  // Update the current time every second
  useEffect(() => {
    const updateTime = () => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setCurrentTime(time);
    };

    updateTime(); // Initialize immediately
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user data when a barcode is scanned
  useEffect(() => {
    if (!scanned) return;

    if (scannedCache[scanned]) {
      setListItems((prevList) =>
        prevList.some(
          (item) => item.username === scannedCache[scanned].username
        )
          ? prevList
          : [scannedCache[scanned], ...prevList]
      );
      return;
    }

    const fetchRecord = async () => {
      try {
        const records = await base("data")
          .select({
            fields: ["scanId", "username", "teacher"],
            filterByFormula: `{scanId} = '${scanned}'`,
          })
          .firstPage();

        if (records.length > 0) {
          const record = records[0];
          const newItem = {
            username: record.get("username"),
            teacher: record.get("teacher"),
          };

          setScannedCache((prevCache) => ({
            ...prevCache,
            [scanned]: newItem,
          }));
          addItem(newItem);
        } else {
          console.log("ID not found in Airtable. Checking external API...");
          const response = await fetch(
            "https://ntifoodpeople.vercel.app/api/users"
          );
          const users = await response.json();

          const user = users.find((u) => u.scanId === scanned);
          if (user) {
            const newItem = {
              username: user.username,
              teacher: user.teacher,
            };

            await base("data").create({
              scanId: scanned,
              username: user.username,
              teacher: user.teacher,
            });

            setScannedCache((prevCache) => ({
              ...prevCache,
              [scanned]: newItem,
            }));
            addItem(newItem);
          } else {
            console.log("ID not found in external API either.");
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setScanned("");
      }
    };

    fetchRecord();
  }, [scanned, scannedCache, addItem]);

  // Create and download the report as an Excel file
  const createReportTable = useCallback(() => {
    const reportData = listItems.map((item) => ({
      Ankomst: item.time,
      Namn: item.username,
      Personal: item.isPersonal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `report_${reportDate}.xlsx`);
  }, [listItems, reportDate]);

  return (
    <div>
      <Scanner onScan={handleSubmit} />
      <table>
        <thead>
          <tr>
            <th>Namn</th>
            <th>Ankomst</th>
          </tr>
        </thead>
        <tbody>
          {listItems.map((item, index) => (
            <tr key={index} style={styles.tableRow(item.isPersonal)}>
              <td>{item.username}</td>
              <td>{item.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={createReportTable}>Send Report</button>
    </div>
  );
}

export default DataFetcher;
