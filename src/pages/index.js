// pages/index.js
import { useState, useEffect } from "react";

export default function Home() {
  const [workType, setWorkType] = useState("");
  const [minutes, setMinutes] = useState("");
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");

  const fixedPayRate = 18; // fixed pay rate here

  useEffect(() => {
    const stored = localStorage.getItem("entries");
    if (stored) setEntries(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    const time = parseFloat(minutes);
    
    if (!workType || isNaN(time)) return;

    const newEntry = {
      id: Date.now(),
      date: date || new Date().toLocaleDateString(), // fallback to today if empty
      workType,
      minutes: time,
      payRate: fixedPayRate, // store fixed pay rate here
      total: ((time / 60) * fixedPayRate).toFixed(2),
    };
    
    newEntry.totalEarnedSoFar = (getTotalPay() * 1 + parseFloat(newEntry.total)).toFixed(2);


    setEntries([newEntry, ...entries]);
    setWorkType("");
    setMinutes("");
    setDate(""); // clear date after adding entry
    sendToGoogleSheet(newEntry);
    
    
  };

  const getTotalMinutes = () => {
    return entries.reduce((sum, e) => sum + e.minutes, 0);
  };

  const getTotalPay = () => {
    return entries.reduce((sum, e) => sum + parseFloat(e.total), 0).toFixed(2);
  };
  const getTotalsByType = () => {
    const grouped = {};
    entries.forEach((e) => {
      if (!grouped[e.workType]) {
        grouped[e.workType] = { minutes: 0, total: 0 };
      }
      grouped[e.workType].minutes += e.minutes;
      grouped[e.workType].total += parseFloat(e.total);
    });
    return grouped;
  };

  const sendToGoogleSheet = (entry) => {
    fetch(
      process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL,
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      }
    )
      // .then((res) => res.json())
      .then(() => {
        // if (res.status === "success") {
        console.log("Data sent to Google Sheets (no response available)");
        // } else {
        //   console.error("Error from Sheet:", res.message);
        // }
      })
      .catch((err) => console.error("Google Sheet error:", err));
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Time Tracker</h1>
      <input
        type="date"
        className="input input-bordered w-full"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="grid gap-3 mb-6">
        <input
          type="text"
          placeholder="Work Type (e.g., Class, Mentoring)"
          className="input input-bordered w-full"
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
        />
        <input
          type="number"
          placeholder="Minutes Worked"
          className="input input-bordered w-full"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <input
          type="number"
          className="input input-bordered w-full"
          value={fixedPayRate}
          readOnly
        />
        <button className="btn btn-primary" onClick={addEntry}>
          Add Entry
        </button>
      </div>
      {/* Summary */}
      <div className="bg-base-200 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Summary</h2>
        <p>Total Sessions: {entries.length}</p>
        <p>
          Total Time: {getTotalMinutes()} minutes (
          {(getTotalMinutes() / 60).toFixed(2)} hours)
        </p>
        <p className="text-green-600 font-semibold">
          Total Earned: ${getTotalPay()}
        </p>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">By Work Type:</h3>
          <ul className="list-disc pl-6">
            {Object.entries(getTotalsByType()).map(([type, stats]) => (
              <li key={type}>
                {type}: {stats.minutes} minutes (${stats.total.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Time Cards */}
      <div className="bg-base-200 p-4 rounded-lg shadow mb-6">
        <ul className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Time Cards</h2>
            {entries.map((entry) => (
              <li key={entry.id} className="card bg-base-100 shadow p-4">
                <p className="font-bold">{entry.date}</p>
                <p>Work: {entry.workType}</p>
                <p>Time: {entry.minutes} mins</p>
                <p className="text-lg font-semibold">
                  Pay Rate: ${entry.payRate}/hr
                </p>
                <p className="text-green-600 font-semibold">Pay: ${entry.total}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
  );
}
