import React, { useState, useEffect, useCallback } from "react";
import Scanner from "./Scanner";
import * as XLSX from "xlsx";

// Optional: You can define styles here or use a CSS module
const styles = {
  tableRow: (isPersonal) => ({
    color: isPersonal ? "#0F0" : "#white",
  }),
};

function DataFetcher() {
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString());
  const [userSet, setUserSet] = useState(new Set()); // To track unique usernames
  const [listItems, setListItems] = useState([]);
  const [scanned, setScanned] = useState("");
  const [currentTime, setCurrentTime] = useState("");

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
          isPersonal: record.teacher || false, // Default to false if undefined
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

    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://ntifoodpeople.vercel.app/api/users/${scanned}`
        );
        const data = await response.json();

        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          addItem(data[0]);
        } else {
          console.warn("No user data found for scanned barcode.");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchData();
  }, [scanned, addItem]);

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
    </div>
  );
}

export default DataFetcher;
